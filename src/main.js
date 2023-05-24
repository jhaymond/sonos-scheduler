import $ from 'jquery';
import 'foundation-sites';
import 'foundation-sites/dist/css/foundation.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app');

$(document).foundation();
