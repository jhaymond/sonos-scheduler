<template>
    <img class="playlist" :src="playable.images[0].url" /> {{ playable.name }}
</template>

<script>
export default {
    name: 'PlaylistSuggestion',
    props: {
        playable: Object
    }
};
</script>

<style>
.playlist {
    width: 40px;
    height: 40px;
}
</style>