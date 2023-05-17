<template>
  <fieldset class="fieldset">
    <legend class="legend text-center">Add to your schedule</legend>
    <div class="grid-x grid-margin-x align-middle">
      <PlayableSearch ref="searchBar" @input="updateSelection" class="cell small-12"/>
      <div class="cell small-12">
        <select class="cell small-12" v-model="selectedDevices" multiple>
          <option @click="selectedDevices = devices">All Devices</option>
          <option v-for="device in devices" :key="device">{{ device }}</option>
        </select>
      </div>
      <div class="cell small-12 medium-6 large-4">
        <input class="cell small-12" v-model="scheduledTime" type="time"/>
      </div>
      <div class="cell small-12 medium-8 large-5 button-group align-middle">
        <button class="button primary" v-for="day in days" :key="day.initial" :class="{ 'hollow': !day.selected }" @click="day.selected = !day.selected">
          {{ day.initial }}
        </button>
      </div>
      <div class="cell small-12 medium-4 large-3 button-group align-right">
        <button class="button primary" :class="{ 'hollow': !shuffle }" @click="shuffle = !shuffle">Shuffle</button>
        <button class="button primary" :class="{ 'hollow': !repeat }" @click="repeat = !repeat">Repeat</button>
      </div>
      <div class="cell small-12">
        <button class="button primary float-right" type="button" @click="schedulePlayable">Schedule</button>
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
      devices: null,
      shuffle: false,
      repeat: false
    }
  },
  methods: {
    updateSelection(newSelection) {
      this.selectedPlayable = newSelection;
    },
    schedulePlayable() {
      const playDays = this.days.filter(d => d.selected).map(d => d.initial);
      const selectedPlayable = JSON.parse(JSON.stringify(this.selectedPlayable)); // copy over so we don't lose it when the form is cleared

      this.$emit("submit", {
        playable: selectedPlayable,
        time: this.scheduledTime,
        days: playDays,
        devices: [...this.selectedDevices],
        shuffle: false,
        repeat: false
      });

      this.clearForm();
    },
    clearForm() {
      this.scheduledTime = null;
      this.selectedDevices = [];
      this.shuffle = false;
      this.repeat = false;
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
