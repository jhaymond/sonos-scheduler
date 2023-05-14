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
      <select v-model="selectedDevices" multiple>
        <option v-for="device in devices" :key="device">{{ device }}</option>
      </select>
      <div class="cell small-2 large-2">
        <input class="button float-right" type="submit" value="Schedule" @click="schedulePlayable"/>
      </div>
    </div>
  </fieldset>
</template>

<script>
import PlayableSearch from './playable-search.vue';
import api from '../scripts/api.js';

export default {
  name: 'ScheduleForm',
  emits: ['submit'],
  components: {
    PlayableSearch
  },
  data() {
    return {
      selectedPlayable: null,
      scheduledTime: null,
      selectedDevices: [],
      days: [
        { initial: 'Su', selected: false },
        { initial: 'M', selected: false },
        { initial: 'Tu', selected: false },
        { initial: 'W', selected: false },
        { initial: 'Th', selected: false },
        { initial: 'F', selected: false },
        { initial: 'Sa', selected: false },
      ],
      devices: null
    }
  },
  methods: {
    updateSelection(newSelection) {
      this.selectedPlayable = newSelection;
    },
    schedulePlayable() {
      const playDays = this.days.filter(d => d.selected).map(d => d.initial);
      const selectedPlayable = JSON.parse(JSON.stringify(this.selectedPlayable)); // copy over so we don't lose it when the form is cleared

      this.$emit("submit", { playable: selectedPlayable, time: this.scheduledTime, days: playDays, devices: [...this.selectedDevices] });
      this.clearForm();
    },
    clearForm() {
      this.scheduledTime = null;
      this.selectedDevices = [];
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
    },
    async getDevices() {
      const response = await api.sonosApi.get('/zones');
      const data = await response.data;
      return data.flatMap(zone => zone.members.map(member => member.roomName));
    }
  },
  async mounted() {
    this.devices = await this.getDevices();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
