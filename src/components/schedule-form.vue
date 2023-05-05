<template>
  <fieldset class="fieldset">
    <legend>Add to your schedule</legend>
    <PlayableSearch @input="updateSelection" />
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
  </fieldset>
</template>

<script>
import api from '../scripts/api.js';
import schedule from 'node-schedule';
import PlayableSearch from './playable-search.vue';

export default {
  name: 'ScheduleForm',
  components: {
    PlayableSearch
  },
  data() {
    return {
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
  methods: {
    updateSelection(newSelection) {
      this.selectedPlayable = newSelection;
    },
    schedulePlayable() {
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

</style>
