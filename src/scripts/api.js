import axios from 'axios';
import settings from '../../settings.json';
import SpotifyWebApi from 'spotify-web-api-node';

const sonosApi = axios.create({
    baseURL: 'http://localhost:5005'
});
const localApi = axios.create({
    baseURL: 'http://localhost:3000'
});
const spotifyApi = new SpotifyWebApi({
    clientId: settings.spotifyClientId,
    clientSecret: settings.spotifyClientSecret
});

localApi.get('/code').then(function (response) {
    spotifyApi.setAccessToken(response.data.access_token);
    spotifyApi.setRefreshToken(response.data.refresh_token);
  });

export default {
    sonosApi: sonosApi,
    localApi: localApi,
    spotifyApi: spotifyApi
};