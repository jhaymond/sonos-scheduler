<template>
  <div class="grid-x grid-margin-x">
    <ScheduleForm @submit="addToSchedule" class="cell small-6 small-offset-3"/>
  </div>
  <div class="grid-x grid-margin-x">
    <ScheduleList :schedules="scheduledPlayables" class="cell small-6 small-offset-3"/>
  </div>
</template>

<script>
import ScheduleForm from './components/schedule-form.vue';
import ScheduleList from './components/schedule-list.vue';
import schedule from 'node-schedule';
import api from './scripts/api.js';

export default {
  name: 'App',
  components: {
    ScheduleForm,
    ScheduleList
  },
  data() {
    return {
      scheduledPlayables: [],
      scheduledJobs: []
    };
  },
  methods: {
    addToSchedule(newScheduledPlay) {
      newScheduledPlay.nextPlayDate = this.getNextScheduledTime(newScheduledPlay);
      this.scheduledPlayables.push(newScheduledPlay);

      this.updateSaveFile();
      this.scheduledJobs.push(schedule.scheduleJob(newScheduledPlay.nextPlayDate, this.schedulerCallback.bind(null, newScheduledPlay)));
    },
    updateSaveFile() {
      api.localApi.post('/save', this.scheduledPlayables);
    },
    async schedulerCallback(scheduleItem) {
      await this.playOnDevices(scheduleItem);
      if (scheduleItem.days.length > 0) {
        scheduleItem.nextPlayDate = this.getNextScheduledTime(scheduleItem);
        this.updateSaveFile();
        this.scheduledJobs.push(schedule.scheduleJob(scheduleItem.nextPlayDate, this.schedulerCallback.bind(null, scheduleItem)));
        console.log(this.scheduledPlayables);
      }
    },
    getNextScheduledTime(scheduleItem) {
      const [playHour, playMinute] = scheduleItem.time.split(':').map(Number);
      const now = new Date();
      const playDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), playHour, playMinute, 0);
      const dayOfWeekIndices = scheduleItem.days.map(day => ['Su','M', 'Tu', 'W', 'Th', 'F', 'Sa'].indexOf(day));

      while (playDate < now || !dayOfWeekIndices.includes(playDate.getDay()))
        playDate.setDate(playDate.getDate() + 1);

      return playDate;
    },
    async playOnDevices(scheduleItem) {
      const groupCore = scheduleItem.devices[0];
      const response = await api.sonosApi.get(`/${groupCore}/state`);

      if (response.data.playbackState === 'PLAYING')
        await new Promise(resolve => setTimeout(resolve, (response.data.currentTrack.duration - response.data.elapsedTime) * 1000));

      if (response.data.trackNo > 0)
        await api.sonosApi.get(`${groupCore}/clearqueue`);      

      for (var i = 0; i < scheduleItem.devices.length; ++i)
      {
        await api.sonosApi.get(`/${scheduleItem.devices[i]}/leave`);
        if (i != 0)
          api.sonosApi.get(`/${scheduleItem.devices[i]}/join/${groupCore}`); // todo: remove devices that aren't part of the group
      }

      await api.sonosApi.get(`/${groupCore}/shuffle/${scheduleItem.shuffle ? 'on' : 'off'}`);
      await api.sonosApi.get(`/${groupCore}/repeat/${scheduleItem.repeat ? 'on' : 'off'}`);
      
      api.sonosApi.get(`/${groupCore}/spotify/now/${scheduleItem.playable.uri}`);
    }
  },
  async mounted() {
    var response = await api.localApi.get('/load');
    this.scheduledPlayables = response.data;
  }
}
</script>