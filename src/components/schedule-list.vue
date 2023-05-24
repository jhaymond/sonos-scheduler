<template>
    <div>
        <div v-for="scheduleItem in sortedScheduleItems" :key="scheduleItem" class="callout small" data-closable>
            <div class="grid-x grid-margin-x align-middle">
                <PlayableDisplay class="cell small-8" :playable="scheduleItem.playable" :type="scheduleItem.playable.category"/>
                <div class="cell small-4">
                    <div class="text-center">
                        {{ scheduleItem.startTime + (scheduleItem.endTime ? '-' + scheduleItem.endTime : '') }}
                        <br/>
                        {{ scheduleItem.days.join(', ') || "Once" }}
                    </div>
                </div>
            </div>
            <button class="close-button" type="button" @click="deleteItem(scheduleItem)" data-close>&times;</button>
        </div>
    </div>
</template>

<script>
import api from '../scripts/api.js';
import PlayableDisplay from './playable-display.vue';

export default {
    name: 'ScheduleList',
    components: {
        PlayableDisplay
    },
    props: {
        scheduleItems: Array
    },
    emits: ['updateSchedule'],
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
        async editItem(scheduleItem) {
            await api.localApi.put('/schedule', scheduleItem);
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