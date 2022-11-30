import { createApp } from 'vue';
import VueDragscroll from 'vue-dragscroll';
import App from './App.vue';
import router from './router';

import './assets/main.css';

const app = createApp(App);

app.use(router);
app.use(VueDragscroll);
app.mount('#app');
