import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueDragscroll from 'vue-dragscroll';
import App from './App.vue';
import router from './router';

import './assets/main.css';

const pinia = createPinia();

createApp(App)
  .use(router)
  .use(VueDragscroll)
  .use(pinia)
  .mount('#app');
