<template>
  <div class="grid-x grid-margin-x">
    <ScheduleForm @submit="addToSchedule" class="cell small-6 small-offset-3"/>
  </div>
  <div class="grid-x grid-margin-x">
    <ScheduleList :schedules="scheduledPlayables" class="cell small-6 large-offset-3"/>
  </div>
</template>

<script>
import ScheduleForm from './components/schedule-form.vue';
import ScheduleList from './components/schedule-list.vue';
import api from './scripts/api.js';

export default {
  name: 'App',
  components: {
    ScheduleForm,
    ScheduleList
  },
  data() {
    return {
      scheduledPlayables: []
      // todo: pre-fill scheduledPlayables from a saved list of playables the user already scheduled
    };
  },
  methods: {
    addToSchedule(newScheduledPlay) {
      this.scheduledPlayables.push(newScheduledPlay);
      this.updateSaveFile();
    },
    updateSaveFile() {
      api.localApi.post('/save', this.scheduledPlayables);
    }
  },
  async mounted() {
    var response = await api.localApi.get('/load');
    this.scheduledPlayables = response.data;
  }
}
</script>