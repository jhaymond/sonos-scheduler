<template>
    <div class="search-container">
        <input v-if="!selectedPlayable" placeholder="Search Spotify" v-model="query" type="text" @input="updateResults" />
        <div v-else class="callout" data-closable>
            <button class="close-button" @click="selectedPlayable = null" type="button" data-close>&times;</button>
            <TrackSuggestion :playable="selectedPlayable" v-if="selectedPlayable.category === 'tracks'" />
            <AlbumSuggestion :playable="selectedPlayable" v-if="selectedPlayable.category === 'albums'" />
            <ArtistSuggestion :playable="selectedPlayable" v-if="selectedPlayable.category === 'artists'" />
            <PlaylistSuggestion :playable="selectedPlayable" v-if="selectedPlayable.category === 'playlists'" />
        </div>

        <div class="dropdown-pane" :class="{ 'is-open': showSuggestions }" id="suggestionsDropdown">
            <ul class="tabs" data-tabs id="suggestionsTabs">
                <li v-for="category in Object.keys(searchSuggestionsByCategory)" :key="category" class="tabs-title" :class="{ 'is-active': category === 'tracks' }">
                    <a :data-tabs-target="category + 'Panel'">{{ category }}</a>
                </li>
            </ul>
            
            <div v-for="category in Object.keys(searchSuggestionsByCategory)" :key="category" class="tabs-content" data-tabs-content="suggestionsTabs">
                <div class="tabs-panel" :id="category + 'Panel'" :class="{ 'is-active': category === 'tracks' }">
                    <ul class="vertical menu" v-show="searchSuggestionsByCategory[category].length > 0">
                        <li v-for="suggestion in searchSuggestionsByCategory[category]" :key="suggestion.id">
                            <div @click="updateSelection(suggestion, category)">
                                <TrackSuggestion :playable="suggestion" v-if="category === 'tracks'" />
                                <AlbumSuggestion :playable="suggestion" v-if="category === 'albums'" />
                                <ArtistSuggestion :playable="suggestion" v-if="category === 'artists'" />
                                <PlaylistSuggestion :playable="suggestion" v-if="category === 'playlists'" />
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import api from '../scripts/api.js';
import TrackSuggestion from './track-suggestion.vue';
import AlbumSuggestion from './album-suggestion.vue';
import ArtistSuggestion from './artist-suggestion.vue';
import PlaylistSuggestion from './playlist-suggestion.vue';

export default {
    name: "PlayableSearch",
    emits: ['input'],
    components: {
        TrackSuggestion,
        AlbumSuggestion,
        ArtistSuggestion,
        PlaylistSuggestion
    },
    data() {
        return {
            query: '',
            selectedPlayable: null,
            searchFocused: false,
            lastQueryTime: 0,
            searchSuggestions: [],
            searchSuggestionsByCategory: {
                tracks: [],
                albums: [],
                artists: [],
                playlists: []
            },
        };
    },
    computed: {
        searchSuggestionsExist() {
            return Object.values(this.searchSuggestionsByCategory).some(v => v.length > 0);
        },
        showSuggestions() {
            return this.query.length > 0 && this.searchSuggestionsExist && this.selectedPlayable === null //&& this.searchFocused;
        }
    },
    methods: {
        updateSelection(newSelection, category) {
            this.selectedPlayable = newSelection;
            this.selectedPlayable.category = category;
            this.$emit("input", newSelection);
        },
        async updateResults() {
            if (this.query.length > 0) {
                if (Date.now() - this.lastQueryTime > 300) { // debounce
                    this.lastQueryTime = Date.now();
                    var response = await api.spotifyApi.search(this.query, ['track', 'album', 'artist', 'playlist'], { limit: 10 });
                    
                    for(var key of Object.keys(response.body)) {
                        this.searchSuggestionsByCategory[key] = response.body[key].items;
                    }
                }
            } else {
                this.searchSuggestions = [];
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
    }
</style>