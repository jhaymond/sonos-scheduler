<template>
    <div>
        <div v-for="schedule in schedules" :key="schedule" class="card">
            {{ schedule.playable.name }} @ {{ schedule.time }}
        </div>
    </div>
</template>

<script>
export default {
    name: 'ScheduleList',
    props: {
        schedules: Array
    },
};
</script>