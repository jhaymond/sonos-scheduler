import axios from 'axios';
import settings from '../../settings.json';
import SpotifyWebApi from 'spotify-web-api-node';

export const sonosApi = axios.create({
    baseURL: 'http://localhost:5005'
});
const spotifyApi = new SpotifyWebApi({
    clientId: settings.spotifyClientId,
    clientSecret: settings.spotifyClientSecret
});

axios.get('http://localhost:3000/code').then(function (response) {
    spotifyApi.setAccessToken(response.data.access_token);
    spotifyApi.setRefreshToken(response.data.refresh_token);
  });

export default {
    sonosApi: sonosApi,
    spotifyApi: spotifyApi
};