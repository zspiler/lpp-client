import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

// eslint-disable-next-line no-unused-vars, no-shadow
enum Mode { buses, stations }

// eslint-disable-next-line no-unused-vars, no-shadow
enum ArrivalTimeFormat { minutesUntil, hhMM }

function userPrefersDarkTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const usePreferencesStore = defineStore('preferences', {
    state: () => ({
        darkTheme: useStorage('darkTheme', userPrefersDarkTheme()),
        mode: useStorage('mode', Mode.stations),
        arrivalTimeFormat: useStorage('arrival-time-format', ArrivalTimeFormat.minutesUntil),
    }),
    actions: {
        toggleMode() {
            this.mode = this.mode === Mode.buses ? Mode.stations : Mode.buses
        },
        toggleArrivalTimeFormat() {
            this.arrivalTimeFormat = this.arrivalTimeFormat === ArrivalTimeFormat.minutesUntil
                ? ArrivalTimeFormat.hhMM : ArrivalTimeFormat.minutesUntil
        },
    },
    getters: {
        isInStationsMode: (state) => state.mode === Mode.stations,
        isHHMMArivalTimeFormat: (state) => state.arrivalTimeFormat === ArrivalTimeFormat.hhMM,
    },
})
