# Soundtrack.me

A lightweight scheduler for Sonos using Vue.js, Foundation CSS, and the Jishi Sonos Node API. Currently works with tracks, albums, and playlists from Spotify. Devices, volume, shuffle/repeat, and time/day can be scheduled and edited using a simple form.

## Setup

0. Set up the [Jishi Node Sonos API](https://github.com/jishi/node-sonos-http-api).
1. Create a settings file.
In order to run properly, the project will need to contain a ```settings.json``` file in the project root directory. At minimum, this file will need to contain two key-value pairs: ```spotifyClientId``` and ```spotifyClientSecret```. These are used to access your Spotify account from the application. If you don't have a client ID or client secret for the Spotify API, you can obtain them [here](https://developer.spotify.com).

Your ```settings.json``` file should end up looking like this:
```
{
    'spotifyClientId': 'your_client_id_here',
    'spotifyClientSecret': 'your_client_secret_here'
}
```
2. Set up the backend:
```
(Starting from the project root)
cd server
npm install
node index.js
```
If this fails, make sure you don't already have a process operating on port 3000. You can change the port the server operates on in ```server/index.js```.

3. Set up the frontend:
```
(Starting from the project root)
npm install
npm run serve
```

At this point, you should be able to access the application at localhost:8080 or the next available port!