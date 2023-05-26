<template>
    <div>
        <div v-for="scheduleItem in sortedScheduleItems" :key="scheduleItem" class="callout small" data-closable>
            <div class="grid-x grid-margin-x align-middle">
                <PlayableDisplay class="cell small-7" :playable="scheduleItem.playable" :type="scheduleItem.playable.category"/>
                <div class="cell small-4">
                    <div class="text-center">
                        {{ scheduleItem.startTime + (scheduleItem.endTime ? '-' + scheduleItem.endTime : '') }}
                        <br/>
                        {{ scheduleItem.days.join(', ') || "Once" }}
                    </div>
                </div>
            </div>
            <button class="close-button edit" type="button" @click="editedItem = scheduleItem" data-open="editModal"><i class="fa-solid fa-pen-to-square fa-2xs"></i></button>
            <button class="close-button" type="button" @click="deleteItem(scheduleItem)" data-close><i class="fa-solid fa-trash fa-2xs"></i></button>
        </div>
        <div id="editModal" class="reveal small" data-reveal>
            <ScheduleForm v-if="editedItem" :edit="editedItem" @updateSchedule="finishEdit()"/> 
            <button class="close-button" type="button" @click="editedItem = null" data-close>&times;</button>
        </div>
    </div>
</template>

<script>
import api from '../scripts/api.js';
import PlayableDisplay from './playable-display.vue';
import ScheduleForm from './schedule-form.vue';

export default {
    name: 'ScheduleList',
    components: {
    PlayableDisplay,
    ScheduleForm
},
    props: {
        scheduleItems: Array
    },
    emits: ['updateSchedule'],
    data() {
        return {
            editedItem: null
        };
    },
    computed: {
        sortedScheduleItems() {
            return [...this.scheduleItems].sort((a, b) => this.nextPlayDate(a) - this.nextPlayDate(b));
        }
    },
    methods: {
        async deleteItem(scheduleItem) {
            await api.localApi.delete('/schedule', { data: scheduleItem });
            this.$emit('updateSchedule');
        },
        finishEdit() {
            this.editedItem = null;
            this.$emit('updateSchedule');
        },
        nextPlayDate(scheduleItem) {
            const [playHour, playMinute] = scheduleItem.startTime.split(':').map(Number);
            const now = new Date();
            const playDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), playHour, playMinute, 0);
            const dayOfWeekIndices = scheduleItem.days.map(day => ['Su','M', 'Tu', 'W', 'Th', 'F', 'Sa'].indexOf(day));

            while (playDate < now || (scheduleItem.days.length > 0 && !dayOfWeekIndices.includes(playDate.getDay())))
                playDate.setDate(playDate.getDate() + 1);

            return playDate;
        }
    }
};
</script>

<style>
.edit {
    padding-right: 25px;
}
</style>