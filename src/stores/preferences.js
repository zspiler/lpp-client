import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

const modes = {
  buses: 'BUSES',
  stations: 'STATIONS',
}

function userPrefersDarkTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    darkTheme: useStorage('darkTheme', userPrefersDarkTheme()),
    mode: useStorage('mode', modes.stations),
  }),
  actions: {
    toggleMode() {
      this.mode = this.mode === modes.buses ? modes.stations : modes.buses
    },
  },
  getters: {
    isInStationsMode: (state) => state.mode === modes.stations,
  },
})
