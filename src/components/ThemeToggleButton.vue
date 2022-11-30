<template>
  <button class="icon-button" :class="{ 'dark-button': store.darkTheme }" @click="toggleTheme">
    <svg
      class="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        v-if="store.darkTheme"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
      <path
        v-else
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  </button>

</template>

<script setup>
import { useThemeStore } from '@/stores/theme';

const store = useThemeStore();

function toggleTheme() {
  console.log('toggle theme!');
  store.darkTheme = !store.darkTheme;
}
</script>

<style scoped>
.icon-button {
    margin-top: 10%;
    margin-right: 15%;
    height: 50px;
    width: 50px;
    background: none;
    border: none;
    border-radius: 50%;
    color: rgb(255, 255, 255);
    background-color: rgba(61, 61, 61, 0.5);;
}

.dark-button {
    background: rgba(0,0,0,0.5);
    filter: drop-shadow(0px 0px 5px #ffffff);
}

</style>
