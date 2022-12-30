import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueDragscroll from 'vue-dragscroll'
import Toast from 'vue-toastification'
import App from './App.vue'

import 'vue-toastification/dist/index.css'

import './assets/main.css'

const pinia = createPinia()

const toastOptions = {
    transition: 'Vue-Toastification__fade',
    maxToasts: 5,
    newestOnTop: true,
    position: 'bottom-left',
    timeout: 6000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: false,
    showCloseButtonOnHover: false,
    hideProgressBar: true,
    icon: true,
}

createApp(App)
    .use(VueDragscroll)
    .use(Toast, toastOptions)
    .use(pinia)
    .mount('#app')
