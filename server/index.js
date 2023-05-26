const fs = require('fs');
const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');
const app = express();
const port = 3000;

var settings = null;
var scheduledJobs = {};

var spotifyApi = null;
const sonosApi = axios.create({
  baseURL: 'http://localhost:5005'
});

app.use(cors());
app.use(express.json());

fs.readFile("../settings.json", "utf8", (err, jsonString) => {
  if (err) {
    console.log("Error reading file from disk:", err);
    return;
  }
  try {
    settings = JSON.parse(jsonString);
    spotifyApi = new SpotifyWebApi({
      clientId: settings.spotifyClientId,
      clientSecret: settings.spotifyClientSecret
    });

    for (var scheduleItem of settings.schedule)
      scheduleNextJobs(scheduleItem);
    
    console.log("Server ready");
  } catch (err) {
    console.log("Error parsing JSON string:", err);
  }
});

function updateSaveFile() {
  fs.writeFile('../settings.json', JSON.stringify(settings, null, 2), err => {
    if (err) {
      console.log('Error writing file', err);
    } else {
      console.log('Successfully wrote file');
    }
  });
}

// methods for finding schedule time
function getNextStartTime(days, time) {
  const [playHour, playMinute] = time.split(':').map(Number);
  const now = new Date();
  const playDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), playHour, playMinute, 0);
  const dayOfWeekIndices = days.map(day => ['Su','M', 'Tu', 'W', 'Th', 'F', 'Sa'].indexOf(day));

  while (playDate < now || (days.length > 0 && !dayOfWeekIndices.includes(playDate.getDay())))
    playDate.setDate(playDate.getDate() + 1);

  return playDate;
}

function getNextStopTime(nextPlayDate, endTime) {
  const [pauseHour, pauseMinute] = endTime.split(':').map(Number);
  const now = new Date();
  const pauseDate = new Date(nextPlayDate.getFullYear(), nextPlayDate.getMonth(), nextPlayDate.getDate(), pauseHour, pauseMinute, 0);

  if (pauseDate < now)
    pauseDate.setDate(pauseDate.getDate() + 1);

  return pauseDate;
}

// methods for modifying the schedule
function addToSchedule(newScheduleItem) {
  // set up the job
  scheduleNextJobs(newScheduleItem);

  // save the new item to the schedule data
  settings.schedule.push(newScheduleItem);
  updateSaveFile();
}

function scheduleNextJobs(newScheduleItem) {
  var nextPlayDate = getNextStartTime(newScheduleItem.days, newScheduleItem.startTime);
  scheduledJobs[nextPlayDate.toString()] = { start: schedule.scheduleJob(nextPlayDate, schedulerPlayCallback.bind(null, newScheduleItem)) };

  if (newScheduleItem.endTime) {
    var nextPauseDate = getNextStopTime(nextPlayDate, newScheduleItem.endTime);
    scheduledJobs[nextPlayDate.toString()].end = schedule.scheduleJob(nextPauseDate, schedulerPauseCallback.bind(null, newScheduleItem));
  }
}

function removeFromSchedule(scheduleItem) {
  // cancel the job
  var scheduledJob = scheduledJobs[getNextStartTime(scheduleItem.days, scheduleItem.startTime).toString()];
  if (scheduledJob) {
    scheduledJob.start.cancel();
    if (scheduledJob.end)
      scheduledJob.end.cancel();
  }

  // remove the item from the schedule data
  settings.schedule.splice(settings.schedule.findIndex(p => p.startTime === scheduleItem.startTime && JSON.stringify(p.days) === JSON.stringify(scheduleItem.days)), 1);
  updateSaveFile();
}

function updateSchedule(newScheduleItem, oldScheduleItem) {
  removeFromSchedule(oldScheduleItem);
  addToSchedule(newScheduleItem);
}

// scheduler callbacks and supporting functions
async function schedulerPlayCallback(scheduleItem) {
  await playOnDevices(scheduleItem);

  if (scheduleItem.days.length > 0)
    scheduleNextJobs(scheduleItem);
  else
    removeFromSchedule(scheduleItem);

  updateSaveFile();
}

async function schedulerPauseCallback(scheduleItem) {
  for (var device of scheduleItem.devices) {
    const response = await sonosApi.get(`/${device.name}/state`);
    if (response.data.playbackState === 'PLAYING') {
      await new Promise(resolve => setTimeout(resolve, (response.data.currentTrack.duration - response.data.elapsedTime) * 1000));
      await sonosApi.get(`/${device.name}/pause`);
    }
  }
}

async function playOnDevices(scheduleItem) {
  const promises = scheduleItem.devices.map(d => prepareDevice(d));
  
  // set up the core device of the group then prepare all other devices 
  const groupCore = await Promise.race(promises);
  await Promise.all(promises);

  // set up the play group
  for (var device of scheduleItem.devices.filter(d => d.name !== groupCore.name)) {
    console.log(`/${device.name}/join/${groupCore.name}`);
    await sonosApi.get(`/${device.name}/join/${groupCore.name}`);
  }

  // finish settings and play
  console.log(`/${groupCore.name}/shuffle/${scheduleItem.shuffle ? 'on' : 'off'}`);
  await sonosApi.get(`/${groupCore.name}/shuffle/${scheduleItem.shuffle ? 'on' : 'off'}`);
  console.log(`/${groupCore.name}/repeat/${scheduleItem.repeat ? 'on' : 'off'}`);
  await sonosApi.get(`/${groupCore.name}/repeat/${scheduleItem.repeat ? 'on' : 'off'}`);

  console.log(`/${groupCore.name}/spotify/now/${scheduleItem.playable.uri}`);
  await sonosApi.get(`/${groupCore.name}/spotify/now/${scheduleItem.playable.uri}`);
}

async function prepareDevice(device) {
  console.log(`${device.name}/state`);
  const response = await sonosApi.get(`${device.name}/state`);

  // wait for the device to finish its current job and then clear the queue
  if (response.data.trackNo > 0) {
    if (response.data.playbackState === 'PLAYING')
      await new Promise(resolve => setTimeout(resolve, (response.data.currentTrack.duration - response.data.elapsedTime) * 1000));
    console.log(`/${device.name}/clearqueue`);
    await sonosApi.get(`/${device.name}/clearqueue`);
  }

  // separate the device from its previous group to prepare it for its new grouping
  console.log(`/${device.name}/leave`);
  await sonosApi.get(`/${device.name}/leave`);

  // set the device volume
  console.log(`/${device.name}/volume/${device.volume}`);
  await sonosApi.get(`/${device.name}/volume/${device.volume}`);

  return device;
}


// API ENDPOINTS

// SPOTIFY ACCESS CODE
app.get('/code', async (req, res) => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    const { access_token, refresh_token } = data.body;

    // Set the access and refresh tokens in the API wrapper
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    res.json(data.body);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.sendStatus(500);
  }
});

// SCHEDULE
app.get('/schedule', async (req, res) => {
  try {
    res.json(settings.schedule || []);
  } catch (error) {
    console.error('Error getting data:', error);
    res.sendStatus(500);
  }
});

app.post('/schedule', async (req, res) => {
  try {
    addToSchedule(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error saving data:', error);
    res.sendStatus(500);
  }
});

app.put('/schedule', async (req, res) => {
  try {
    updateSchedule(req.body.new, req.body.old);
    res.sendStatus(200);
  } catch(error) {
    console.error('Error putting data:', error);
    res.sendStatus(500);
  }
});

app.delete('/schedule', async (req, res) => {
  try {
    removeFromSchedule(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting data:', error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});