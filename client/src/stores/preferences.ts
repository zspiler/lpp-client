import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

// eslint-disable-next-line no-unused-vars, no-shadow
enum Mode { buses, stations }

function userPrefersDarkTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const usePreferencesStore = defineStore('preferences', {
    state: () => ({
        darkTheme: useStorage('darkTheme', userPrefersDarkTheme()),
        mode: useStorage('mode', Mode.stations),
    }),
    actions: {
        toggleMode() {
            this.mode = this.mode === Mode.buses ? Mode.stations : Mode.buses
        },
    },
    getters: {
        isInStationsMode: (state) => state.mode === Mode.stations,
    },
})
