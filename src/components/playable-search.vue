<template>
    <div class="search-container">
        <input v-if="!selectedPlayable" placeholder="Search Spotify" v-model="query" type="text" @input="updateResults" />
        <div v-else class="callout" data-closable>
            <button class="close-button" @click="clear()" type="button" data-close>&times;</button>
            <TrackSuggestion :playable="selectedPlayable" v-if="selectedPlayable.category === 'tracks'" />
            <AlbumSuggestion :playable="selectedPlayable" v-if="selectedPlayable.category === 'albums'" />
            <PlaylistSuggestion :playable="selectedPlayable" v-if="selectedPlayable.category === 'playlists'" />
        </div>

        <div class="dropdown-pane" :class="{ 'is-open': showSuggestions }" id="suggestionsDropdown">
            <div v-for="category in Object.keys(searchSuggestionsByCategory)" :key="category" v-show="searchSuggestionsByCategory[category].length > 0">
                <h4>{{ category }}</h4>
                <ul class="vertical menu">
                    <li v-for="suggestion in searchSuggestionsByCategory[category]" :key="suggestion.id">
                        <div @click="updateSelection(suggestion, category)">
                            <TrackSuggestion :playable="suggestion" v-if="category === 'tracks'" />
                            <AlbumSuggestion :playable="suggestion" v-if="category === 'albums'" />
                            <PlaylistSuggestion :playable="suggestion" v-if="category === 'playlists'" />
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import api from '../scripts/api.js';
import TrackSuggestion from './track-suggestion.vue';
import AlbumSuggestion from './album-suggestion.vue';
import PlaylistSuggestion from './playlist-suggestion.vue';

export default {
    name: "PlayableSearch",
    emits: ['input'],
    components: {
        TrackSuggestion,
        AlbumSuggestion,
        PlaylistSuggestion
    },
    data() {
        return {
            query: '',
            selectedPlayable: null,
            searchFocused: false,
            lastQueryTime: 0,
            searchSuggestionsByCategory: {
                tracks: [],
                albums: [],
                playlists: []
            },
        };
    },
    computed: {
        searchSuggestionsExist() {
            return Object.values(this.searchSuggestionsByCategory).some(v => v.length > 0);
        },
        showSuggestions() {
            return this.query.length > 0 && this.searchSuggestionsExist && this.selectedPlayable === null;
        }
    },
    methods: {
        clear() {
            this.query = '';
            this.updateSelection(null, null);
            this.updateResults();
        },
        updateSelection(newSelection, category) {
            this.selectedPlayable = newSelection;
            if (category)
                this.selectedPlayable.category = category;
            this.$emit("input", newSelection);
        },
        async updateResults() {
            if (this.query.length > 0) {
                if (Date.now() - this.lastQueryTime > 300) { // debounce
                    this.lastQueryTime = Date.now();
                    var response = await api.spotifyApi.search(this.query, ['track', 'album', 'playlist'], { limit: 4 });
                    
                    for(var key of Object.keys(response.body)) {
                        this.searchSuggestionsByCategory[key] = response.body[key].items;
                    }
                }
            } else {
                this.searchSuggestionsByCategory = {
                    tracks: [],
                    albums: [],
                    playlists: []
                };
            }
        },
    }
}
</script>

<style>
    .search-container {
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    #suggestionsDropdown {
      width: 100%;
      position: absolute;
      top: 100%;
      z-index: 999;
    }
</style>