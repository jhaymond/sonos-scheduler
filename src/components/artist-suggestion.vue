<template>
    <img class="artist" :src="playable.images[0].url" /> {{ playable.name }}
</template>

<script>
export default {
    name: 'ArtistSuggestion',
    props: {
        playable: Object
    }
};
</script>

<style>
.artist {
    width: 40px;
    height: 40px;
}
</style>