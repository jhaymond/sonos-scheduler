<template>
<fieldset class="fieldset">
  <legend v-if="!edit" class="text-center">Add to your schedule</legend>
  <legend v-if="edit" class="text-center">Edit your schedule</legend>
  <div class="grid-x grid-margin-x align-bottom">
    <PlayableSearch ref="searchBar" @input="updateSelectedPlayable" class="cell small-12"/>
    <DeviceSelector ref="deviceSelector" :preselectedDevices="this.preselectedDevices" @input="updateSelectedDevices" class="cell small-12"/>
    <div class="cell small-6 medium-3 large-2">
      <label for="startTime">
        Start
        <input id="startTime" v-model="startTime" type="time"/>
      </label>
    </div>
    <div class="cell small-6 medium-3 large-2 align-middle">
      <label for="endTime">
        End (optional)
        <input id="endTime" v-model="endTime" type="time"/>
      </label>
    </div>
    <div class="cell small-12 medium-8 large-5 button-group">
      <button class="button primary" type="button" v-for="day in days" :key="day.initial" :class="{ 'hollow': !day.selected }" @click="day.selected = !day.selected">
        {{ day.initial }}
      </button>
    </div>
    <div class="cell small-12 medium-4 large-3 button-group align-right">
      <button class="button primary" type="button" :class="{ 'hollow': !shuffle }" @click="shuffle = !shuffle"><i class="fas fa-shuffle"></i></button>
      <button class="button primary" type="button" :class="{ 'hollow': !repeat }" @click="repeat = !repeat"><i class="fas fa-repeat"></i></button>
    </div>
    <div class="cell small-8">
      <p class="text-right text-error">{{ errorMessage }}</p>
    </div>
    <div class="cell small-4">
      <button class="button primary float-right" type="button" @click="submitItem()">Schedule</button>
    </div>
  </div>
</fieldset>
</template>

<script>
import PlayableSearch from './playable-search.vue';
import DeviceSelector from './device-selector.vue';
import api from '../scripts/api.js';

export default {
  name: 'ScheduleForm',
  props: {
    edit: Object
  },
  emits: ['updateSchedule'],
  components: {
    PlayableSearch,
    DeviceSelector
  },
  data() {
    return {
      selectedPlayable: null,
      startTime: null,
      endTime: null,
      preselectedDevices: [],
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
      repeat: false,
      errorMessage: ''
    }
  },
  computed: {
    selectedDays() {
      return this.days.filter(d => d.selected).map(d => d.initial);
    }
  },
  methods: {
    updateSelectedPlayable(newSelection) {
      this.selectedPlayable = newSelection;
    },
    updateSelectedDevices(newSelection) {
      this.selectedDevices = newSelection;
    },
    async submitItem() {
      if (await this.validateForm()) {
        const newScheduleItem = {
          playable: this.selectedPlayable,
          startTime: this.startTime,
          endTime: this.endTime,
          days: this.selectedDays,
          devices: this.selectedDevices,
          shuffle: this.shuffle,
          repeat: this.repeat
        };

        if (this.edit)
          await api.localApi.put('/schedule', { new: newScheduleItem, old: this.edit });
        else
          await api.localApi.post('/schedule', newScheduleItem);

        this.$emit('updateSchedule');
        this.clearForm();
      }
    },
    async validateForm() {
      var formIsValid = true;

      this.errorMessage = '';
      if (!this.selectedPlayable) {
        formIsValid = false;
        this.errorMessage += 'No music selected. '
      }
      if (!this.startTime) {
        formIsValid = false;
        this.errorMessage += 'No time specified. '
      }
      if (this.selectedDevices.length === 0) {
        formIsValid = false;
        this.errorMessage += 'No devices selected. '
      }
      if (await this.isOverlap()) {
        formIsValid = false;
        this.errorMessage += 'There is already music scheduled for the given time and devices.'
      }

      return formIsValid;
    },
    async isOverlap() {
      const response = await api.localApi.get('/schedule');
      const scheduleItems = response.data;

      return scheduleItems.findIndex(p => {
        var timesOverlap = p.startTime === this.startTime ||
          (this.startTime > p.startTime && this.startTime < p.endTime) ||
          (p.startTime > this.startTime && p.startTime < this.endTime);
        var bothAreSingletons = p.days.length === 0 && this.selectedDays.length === 0;
        var selectedDaysOverlap = p.days.filter(d => this.selectedDays.includes(d)).length > 0;
        var selectedDevicesOverlap = p.devices.filter(d => this.selectedDevices.map(e => e.name).includes(d.name)).length > 0;

        return !this.edit && timesOverlap && (bothAreSingletons || selectedDaysOverlap) && selectedDevicesOverlap;
      }) > -1;
    },
    clearForm() {
      this.startTime = null;
      this.endTime = null;
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
      this.$refs.deviceSelector.clear();
    }
  },
  mounted() {
    if (this.edit) {
      this.startTime = this.edit.startTime;
      this.endTime = this.edit.endTime;
      this.shuffle = this.edit.shuffle;
      this.repeat = this.edit.repeat;
      this.days.forEach(d => {
        if (this.edit.days.includes(d.initial)) {
          d.selected = true;
        } else {
          d.selected = false;
        }
      });
      this.selectedPlayable = this.edit.playable;
      this.$refs.searchBar.selectedPlayable = this.edit.playable;
      this.preselectedDevices = this.edit.devices;
    }
  }
}
</script>

<style>
.text-error {
  color: red;
}
</style>