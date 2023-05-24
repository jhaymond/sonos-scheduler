<template>
  <div class="grid-x grid-margin-x">
    <ScheduleForm class="cell small-6 small-offset-3" @updateSchedule="refreshFromSource()"/>
  </div>
  <div class="grid-x grid-margin-x">
    <ScheduleList :scheduleItems="scheduleItems" class="cell small-6 small-offset-3" @updateSchedule="refreshFromSource()"/>
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
      scheduleItems: []
    };
  },
  methods: {
    async refreshFromSource() {  
      var response = await api.localApi.get('/schedule');
      this.scheduleItems = response.data;
    }
  },
  async mounted() {
    this.refreshFromSource();
  }
}
</script>

<style scoped>
</style>