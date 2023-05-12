<template>
  <fieldset class="fieldset">
    <legend>Add to your schedule</legend>
    <PlayableSearch ref="searchBar" @input="updateSelection" />
    <div class="grid-x grid-margin-x">
      <input class="cell small-4 large-2" v-model="scheduledTime" type="time"/>
      <div class="cell small-6 large-8 button-group no-gaps">
        <a class="button primary" v-for="day in days" :key="day.initial" :class="{ 'hollow': !day.selected }" @click="day.selected = !day.selected">
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
import PlayableSearch from './playable-search.vue';

export default {
  name: 'ScheduleForm',
  emits: ['submit'],
  components: {
    PlayableSearch
  },
  data() {
    return {
      selectedPlayable: null,
      scheduledTime: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
      days: [
        { initial: 'Su', selected: false },
        { initial: 'M', selected: false },
        { initial: 'Tu', selected: false },
        { initial: 'W', selected: false },
        { initial: 'Th', selected: false },
        { initial: 'F', selected: false },
        { initial: 'Sa', selected: false },
      ]
    }
  },
  methods: {
    updateSelection(newSelection) {
      this.selectedPlayable = newSelection;
    },
    schedulePlayable() {
      const playDays = this.days.filter(d => d.selected).map(d => d.initial);
      const selectedPlayable = JSON.parse(JSON.stringify(this.selectedPlayable)); // copy over so we don't lose it when the form is cleared

      this.$emit("submit", { playable: selectedPlayable, time: this.scheduledTime, days: playDays });
      this.clearForm();
    },
    clearForm() {
      this.scheduledTime = new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0');
      this.days = [
        { initial: 'Su', selected: false },
        { initial: 'M', selected: false },
        { initial: 'Tu', selected: false },
        { initial: 'W', selected: false },
        { initial: 'Th', selected: false },
        { initial: 'F', selected: false },
        { initial: 'Sa', selected: false },
      ];
      this.$refs.searchBar.clear();
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
