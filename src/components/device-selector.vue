<template>
<div>
    <ul class="accordion">
        <li class="accordion-item" :class="{ 'is-active': isExpanded }">
            <span class="accordion-title" @click="isExpanded = !isExpanded">{{ selectedDevices.length }} device(s) selected</span>
            <div class="accordion-content">
                <ul class="vertical menu">
                    <li class="grid-x grid-margin-x" v-for="device in devices" :key="device.name">
                        <div class="cell small-2">
                            <input :id="device.name" type="checkbox" v-model="device.isSelected" @change="updateDevices"/>
                            &nbsp;
                            <label class="middle" :for="device.name">{{ device.name }}</label>
                        </div>
                        <div class="cell small-4 volume" v-show="device.isSelected">
                            <i class="fa-solid fa-volume-high"></i>
                            &nbsp;
                            <input type="range" min="1" max="100" step="1" v-model="device.volume" @change="updateDevices"/>
                            &nbsp;
                            <span class="text-small">{{ device.volume }}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </li>
    </ul>
</div>
</template>

<script>
import api from '../scripts/api.js';

export default {
    name: 'DeviceSelector',
    props: {
        preselectedDevices: Array
    },
    emits: ['input'],
    data() {
        return {
            devices: [],
            isExpanded: false
        }
    },
    computed: {
        selectedDevices() {
            return this.devices.filter(d => d.isSelected);
        }
    },
    methods: {
        async getDevices() {
            const response = await api.sonosApi.get('/zones');
            const data = await response.data;
            return data.flatMap(zone => zone.members.map(member => {
                return {
                    name: member.roomName,
                    volume: 30,
                    isSelected: !this.preselectedDevices.length || this.preselectedDevices.some(d => d.name === member.roomName)
                }
            }));
        },
        updateDevices() {
            this.$emit("input", [...this.selectedDevices]);
        },
        async clear() {
            this.devices = await this.getDevices();
            this.updateDevices();
        }
    },
    async mounted() {
        this.clear();
    }
}
</script>

<style>
.accordion-item:is(.is-active) .accordion-content {
    display:inherit;
}

.volume {
    padding-top: 7px;
}
</style>