const settings = require('../settings.json');
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');
const app = express();
const port = 3000;

app.use(cors());

const spotifyApi = new SpotifyWebApi({
  clientId: settings.spotifyClientId,
  clientSecret: settings.spotifyClientSecret
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
