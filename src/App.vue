<template>
  <div class="grid-x grid-margin-x">
    <ScheduleForm @submit="addToSchedule" class="cell small-6 small-offset-3"/>
  </div>
  <div class="grid-x grid-margin-x">
    <ScheduleList :schedules="scheduledPlayables" @delete="removeFromSchedule" class="cell small-6 small-offset-3"/>
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
      if (!this.isOverlap(newScheduledPlay)) {
        newScheduledPlay.nextPlayDate = this.getNextScheduledTime(newScheduledPlay);
        this.scheduledPlayables.push(newScheduledPlay);

        this.updateSaveFile();
        this.scheduledJobs.push(schedule.scheduleJob(newScheduledPlay.nextPlayDate, this.schedulerCallback.bind(null, newScheduledPlay)));
      } else {
        alert("There is already an item scheduled for that time. If you would like to play something different, please edit or remove the item previously scheduled.")
      }
    },
    removeFromSchedule(scheduledPlay) {
        this.scheduledPlayables.splice(this.scheduledPlayables.findIndex(p => p.time === scheduledPlay.time && p.days === scheduledPlay.days), 1);
        this.updateSaveFile();
    },
    updateSaveFile() {
      api.localApi.post('/save', this.scheduledPlayables);
    },
    isOverlap(newScheduledPlay) {
      return this.scheduledPlayables.findIndex(function (p) {
        var isSameTime = p.time === newScheduledPlay.time;
        var bothAreSingletons = p.days.length === 0 && newScheduledPlay.days.length === 0;
        var selectedDaysOverlap = p.days.filter(d => newScheduledPlay.days.includes(d)).length > 0;

        return isSameTime && (bothAreSingletons || selectedDaysOverlap);
      }) > -1;
    },
    async schedulerCallback(scheduleItem) {
      await this.playOnDevices(scheduleItem);
      if (scheduleItem.days.length > 0) {
        scheduleItem.nextPlayDate = this.getNextScheduledTime(scheduleItem);
        this.updateSaveFile();
        this.scheduledJobs.push(schedule.scheduleJob(scheduleItem.nextPlayDate, this.schedulerCallback.bind(null, scheduleItem)));
      } else {
        this.removeFromSchedule(scheduleItem);
      }
    },
    getNextScheduledTime(scheduleItem) {
      const [playHour, playMinute] = scheduleItem.time.split(':').map(Number);
      const now = new Date();
      const playDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), playHour, playMinute, 0);
      const dayOfWeekIndices = scheduleItem.days.map(day => ['Su','M', 'Tu', 'W', 'Th', 'F', 'Sa'].indexOf(day));

      while (playDate < now || (scheduleItem.days.length > 0 && !dayOfWeekIndices.includes(playDate.getDay())))
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