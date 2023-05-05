<template>
    <img class="album" :src="playable.images[0].url" /> {{ playable.name + ' (' + playable.release_date + ') - ' + playable.artists[0].name }}
</template>

<script>
export default {
    name: 'AlbumSuggestion',
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