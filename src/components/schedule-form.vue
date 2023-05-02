<template>
  <div class="hello">
    <div>
      <input v-model="query" type="text" @input="updateResults"/>
      <input v-model="scheduledTime" type="time"/>
      <input type="submit" @click="schedulePlayable"/>
    </div>
    <ul v-if="searchSuggestions.length">
      <li v-for="suggestion in searchSuggestions" :key="suggestion.id">
        <a @click="selectedPlayable = suggestion">{{ suggestion.name }} - {{ suggestion.artists[0].name }}</a>
      </li>
    </ul>
    <input type="hidden" :value="selectedPlayable == null ? null : selectedPlayable.uri"/>
  </div>
</template>

<script>
import api from '../scripts/api.js';
import schedule from 'node-schedule';

export default {
  name: 'ScheduleForm',
  data() {
    return {
      query: '',
      lastQueryTime: 0,
      searchSuggestions: [],
      selectedPlayable: null,
      scheduledTime: null
    }
  },
  methods: {
    async updateResults() {
      if (this.query.length > 0) {
        if (Date.now() - this.lastQueryTime > 300) { // debounce
          this.lastQueryTime = Date.now();
          var response = await api.spotifyApi.searchTracks(this.query);
          this.searchSuggestions = response.body.tracks.items;
        }
      } else {
        this.searchSuggestions = [];
      }
    },
    schedulePlayable() {
      //const deviceNames = await getDevices();
      //const playlistUri = await searchMusic(searchQuery);

      const [playHour, playMinute] = this.scheduledTime.split(':').map(Number);
      const now = new Date();
      const playDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), playHour, playMinute, 0);

      // If the scheduled time has already passed, schedule for the next day
      if (now > playDate) {
        playDate.setDate(playDate.getDate() + 1);
      }

      const job = schedule.scheduleJob(playDate, async () => {
        await this.playOnDevices(await this.getDevices());
        console.log(`Playing ${this.selectedPlayable.name} on all devices at ${playDate}`);
        job.cancel(); // Cancel the scheduled job after it has been executed
      });
    },
    async playOnDevices(devices) {
      const groupCore = devices[0];
      
      for (var i = 1; i < devices.length; ++i)
        api.sonosApi.get(`/${devices[i]}/join/${groupCore}`); // todo: remove devices that aren't part of the group

      api.sonosApi.get(`/${groupCore}/spotify/now/${this.selectedPlayable.uri}`);
      api.sonosApi.get(`/${groupCore}/play`);
    },
    async getDevices() {
      const response = await api.sonosApi.get('/zones');
      const data = await response.data;
      return data.flatMap(zone => zone.members.map(member => member.roomName));
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
