<template>
  <div class="grid-x grid-margin-x">
    <ScheduleForm class="cell small-6 small-offset-3"/>
  </div>
  <!-- <div class="grid-x grid-margin-x">
    <ScheduleList class="cell small-6 large-offset-3"/>
  </div> -->
</template>

<script>
import ScheduleForm from './components/schedule-form.vue';

export default {
  name: 'App',
  components: {
    ScheduleForm
  },
  data() {
    return {
      scheduledPlayables: []
      // todo: capture new scheduledPlayables emitted by the form and add them to the list
      // todo: pre-fill scheduledPlayables from a saved list of playables the user already scheduled
    };
  }
}
</script>