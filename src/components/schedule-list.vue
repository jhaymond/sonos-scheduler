<template>
    <div>
        <div v-for="schedule in sortedSchedules" :key="schedule.nextPlayDate" class="callout" data-closable>
            {{ schedule.playable.name }} @ {{ schedule.time }} ({{ schedule.days.join('-') || "Once" }})
            <p>Next play: {{ schedule.nextPlayDate }}</p>
            <button class="close-button" type="button" @click="deleteItem(schedule)" data-close>&times;</button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ScheduleList',
    props: {
        schedules: Array
    },
    emits: ['edit', 'delete'],
    computed: {
        sortedSchedules() {
            return [...this.schedules].sort((a, b) => a.nextPlayDate - b.nextPlayDate);
        }
    },
    methods: {
        deleteItem(scheduleItem) {
            this.$emit('delete', scheduleItem);
        },
        editItem(scheduleItem) {
            this.$emit('edit', scheduleItem)
        }
    }
};
</script>