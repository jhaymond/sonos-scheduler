const fs = require('fs');
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');
const app = express();
const port = 3000;
var settings = null;
var spotifyApi = null;

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
  } catch (err) {
    console.log("Error parsing JSON string:", err);
  }
});

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

app.get('/load', async (req, res) => {
  try {
    res.json(settings.schedule || []);
  } catch (error) {
    console.error('Error getting data:', error);
    res.sendStatus(500);
  }
});

app.post('/save', async (req, res) => {
  try {
    settings.schedule = req.body;
    fs.writeFile('../settings.json', JSON.stringify(settings, null, 2), err => {
      if (err) {
          console.log('Error writing file', err);
      } else {
          console.log('Successfully wrote file');
      }
    });
    res.sendStatus(200);
  } catch (error) {
    console.error('Error saving data:', error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
