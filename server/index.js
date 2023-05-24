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

    for (var scheduleItem of settings.schedule) {
      var nextPlayDate = getNextScheduledTime(scheduleItem);
      scheduledJobs[nextPlayDate.toString()] = schedule.scheduleJob(nextPlayDate, schedulerCallback.bind(null, scheduleItem));
    }
    
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

function getNextScheduledTime(scheduleItem) {
  const [playHour, playMinute] = scheduleItem.startTime.split(':').map(Number);
  const now = new Date();
  const playDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), playHour, playMinute, 0);
  const dayOfWeekIndices = scheduleItem.days.map(day => ['Su','M', 'Tu', 'W', 'Th', 'F', 'Sa'].indexOf(day));

  while (playDate < now || (scheduleItem.days.length > 0 && !dayOfWeekIndices.includes(playDate.getDay())))
    playDate.setDate(playDate.getDate() + 1);

  return playDate;
}

function addToSchedule(newScheduleItem) {
  // set up the job
  var nextPlayDate = getNextScheduledTime(newScheduleItem);
  scheduledJobs[nextPlayDate.toString()] = schedule.scheduleJob(nextPlayDate, schedulerCallback.bind(null, newScheduleItem));

  // save the new item to the schedule data
  settings.schedule.push(newScheduleItem);
  updateSaveFile();
}

function removeFromSchedule(scheduleItem) {
  // cancel the job
  var nextPlayDate = getNextScheduledTime(scheduleItem);
  if (scheduledJobs[nextPlayDate.toString()])
    scheduledJobs[nextPlayDate.toString()].cancel();

  // remove the item from the schedule data
  settings.schedule.splice(settings.schedule.findIndex(p => p.startTime === scheduleItem.startTime && p.days === scheduleItem.days), 1);
  updateSaveFile();
}

async function schedulerCallback(scheduleItem) {
  await playOnDevices(scheduleItem);

  if (scheduleItem.days.length > 0) {
    // set up the next job
    var nextPlayDate = getNextScheduledTime(scheduleItem);
    scheduledJobs[nextPlayDate.toString()] = schedule.scheduleJob(scheduleItem.nextPlayDate, schedulerCallback.bind(null, scheduleItem));
  } else {
    removeFromSchedule(scheduleItem);
  }

  updateSaveFile();
}

async function playOnDevices(scheduleItem) {
  const promises = scheduleItem.devices.map(d => prepareDevice(d));
  
  // set up the core device of the group then prepare all other devices 
  const groupCore = await Promise.race(promises);
  await Promise.all(promises);

  // set up the play group
  for (var device of scheduleItem.devices.filter(d => d.name !== groupCore.name)) {
    console.log(`${device.name}/join/${groupCore.name}`);
    await sonosApi.get(`${device.name}/join/${groupCore.name}`);
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
    console.log(`${device.name}/clearqueue`);
    await sonosApi.get(`${device.name}/clearqueue`);
  }

  // separate the device from its previous group to prepare it for its new grouping
  console.log(`${device.name}/leave`);
  await sonosApi.get(`${device.name}/leave`);

  // set the device volume
  console.log(`/${device.name}/volume/${device.volume}`);
  await sonosApi.get(`/${device.name}/volume/${device.volume}`);

  return device;
}

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

});

app.delete('/schedule', async (req, res) => {
  try {
    console.log(req);
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