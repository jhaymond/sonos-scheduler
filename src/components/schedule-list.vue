<template>
    <div>
        <div v-for="schedule in sortedSchedules" :key="schedule.nextPlay" class="callout" data-closable>
            {{ schedule.playable.name }} @ {{ schedule.time }} ({{ schedule.days.join('-') }})
            <p>Next play: {{ schedule.nextPlayDate }}</p>
            <button class="close-button" type="button" data-close>&times;</button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ScheduleList',
    props: {
        schedules: Array
    },
    computed: {
        sortedSchedules() {
            return [...this.schedules].sort((a, b) => a.nextPlayDate - b.nextPlayDate);
        }
    },
    methods: {
        delete(scheduleItem) {
            return scheduleItem;
        },
        edit(scheduleItem) {
            return scheduleItem;
        }
    }
};
</script>