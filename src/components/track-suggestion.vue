<template>
    <img class="album" :src="playable.album.images[0].url" /> {{ playable.name + ' - ' + playable.artists[0].name }}
</template>

<script>
export default {
    name: 'TrackSuggestion',
    props: {
        playable: Object
    }
};
</script>

<style>
.album {
    height: 40px;
    width: 40px;
}
</style>