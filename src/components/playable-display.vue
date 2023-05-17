<template>
    <div>
        <img class="playable-thumbnail" :src="imageSrc" />&nbsp;{{ displayName }}
    </div>
</template>

<script>
export default {
    name: 'PlayableDisplay',
    props: {
        playable: Object,
        type: String,

    },
    computed: {
        imageSrc() {
            var src;
            switch (this.type) {
                case 'tracks': src = this.playable.album.images[0].url;
                break;
                case 'playlists':
                case 'albums': src = this.playable.images[0].url;
                break;
                default: src = '';
                break;
            }
            return src;
        },
        displayName() {
            var display;
            switch (this.type) {
                case 'tracks': display = this.playable.name + ' - ' + this.playable.artists[0].name;
                break;
                case 'albums': display = this.playable.name + ' (' + this.playable.release_date + ') - ' + this.playable.artists[0].name;
                break;
                case 'playlists': display = this.playable.name;
                break;
                default: display = '';
                break;
            }
            return display;
        }
    }
};
</script>

<style>
.playable-thumbnail {
    height: 40px;
    width: 40px;
}
</style>