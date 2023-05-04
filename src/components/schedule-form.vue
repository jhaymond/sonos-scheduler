<template>
  <fieldset class="fieldset">
    <legend>Add to your schedule</legend>
    <div class="search-container">
      <input placeholder="Search Spotify" v-model="query" type="text" @input="updateResults" @blur="searchFocused = false" @focus="searchFocused = true" data-toggle="suggestionsDropdown"/>
      <div class="dropdown-pane" :class="{ 'is-open': showSuggestions }" id="suggestionsDropdown" data-dropdown>
      <ul class="vertical menu">
        <li v-for="suggestion in searchSuggestions" :key="suggestion.id">
          <a href="#" @click="selectedPlayable = suggestion">{{ suggestion.name }} - {{ suggestion.artists[0].name }}</a>
        </li>
      </ul>
      </div>
    </div>
    <div class="grid-x grid-margin-x">
      <input class="cell small-4 large-2" v-model="scheduledTime" type="time"/>
      <div class="cell small-6 large-8 button-group no-gaps">
        <a class="button primary" v-for="day in days" :key="day" :class="{ 'hollow': !day.selected }" @click="day.selected = !day.selected">
          {{ day.initial }}
        </a>
      </div>
      <div class="cell small-2 large-2">
        <input class="button float-right" type="submit" value="Schedule" @click="schedulePlayable"/>
      </div>
    </div>
    <input type="hidden" :value="selectedPlayable == null ? null : selectedPlayable.uri"/>
  </fieldset>
</template>

<script>
import api from '../scripts/api.js';
import schedule from 'node-schedule';

export default {
  name: 'ScheduleForm',
  data() {
    return {
      query: '',
      searchFocused: false,
      lastQueryTime: 0,
      searchSuggestions: [],
      selectedPlayable: null,
      scheduledTime: null,
      days: [
        { initial: "S", selected: false },
        { initial: "M", selected: false },
        { initial: "T", selected: false },
        { initial: "W", selected: false },
        { initial: "T", selected: false },
        { initial: "F", selected: false },
        { initial: "S", selected: false },
      ]
    }
  },
  computed: {
    showSuggestions() {
      return this.query.length > 0 && this.searchSuggestions.length > 0 && this.selectedPlayable === null && this.searchFocused;
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
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .search-container {
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    #suggestionsDropdown {
      width: 100%;
      position: absolute;
      top: 100%;
    }
</style>
