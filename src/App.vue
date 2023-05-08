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

export default {
  name: 'App',
  components: {
    ScheduleForm,
    ScheduleList
  },
  data() {
    return {
      scheduledPlayables: []
      // todo: capture new scheduledPlayables emitted by the form and add them to the list
      // todo: pre-fill scheduledPlayables from a saved list of playables the user already scheduled
    };
  },
  methods: {
    addToSchedule(newScheduledPlay) {
      this.scheduledPlayables.push(newScheduledPlay);
    }
  }
}
</script>