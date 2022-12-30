<template>
  <button class="control-button" :class="{ 'dark-control-button': store.darkTheme, active: props.active }">
    <svg
      id="Capa_1"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 447.342 447.342"
      style="enable-background:new 0 0 447.342 447.342;"
      xml:space="preserve"
      fill="currentColor"
    >
      <path
        d="M443.537,3.805c-3.84-3.84-9.686-4.893-14.625-2.613L7.553,195.239c-4.827,2.215-7.807,7.153-7.535,12.459
          c0.254,5.305,3.727,9.908,8.762,11.63l129.476,44.289c21.349,7.314,38.125,24.089,45.438,45.438l44.321,129.509
          c1.72,5.018,6.325,8.491,11.63,8.762c5.306,0.271,10.244-2.725,12.458-7.535L446.15,18.429
          C448.428,13.491,447.377,7.644,443.537,3.805z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { usePreferencesStore } from '@/stores/preferences'

const props = defineProps({
    active: {
        type: Boolean,
        default: false,
    },
})

const store = usePreferencesStore()
</script>

<style scoped>

.control-button {
  padding: 15px;
}
.active {
  color: rgba(29, 89, 242, 0.5);
  background: white !important;
}
</style>
