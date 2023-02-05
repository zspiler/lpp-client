<template>
  <div
    v-show="props.delayed ? showLoader : loading"
    class="loader"
    :class="{ fixed: props.fixed, dark: store.darkTheme }"
  />
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { usePreferencesStore } from '@/stores/preferences'

const props = defineProps({
    loading: {
        type: Boolean,
        required: true,
    },
    delayed: {
        type: Boolean,
        default: false,
    },
    fixed: {
        type: Boolean,
        default: false,
    },
})

const store = usePreferencesStore()

const showLoader = ref(false)

function delayLoadingAnimation() {
    if (props.loading) {
        setTimeout(() => {
            if (props.loading) {
                showLoader.value = true
            }
        }, 500)
    } else {
        showLoader.value = false
    }
}

if (props.delayed) {
    watchEffect(delayLoadingAnimation)
}
</script>

<style scoped>

.fixed {
  position: fixed;
}

.loader {
  width: 26px;
  height: 26px;
  margin: auto;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  border: 5px solid rgba(0, 0, 0, 0.2);
  border-top: 5px solid rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  animation: spin 0.85s ease-in-out infinite;
  z-index: 9000;
}

.loader.dark {
  border-color: rgba(255, 255, 255, 0.5);
  border-top-color: rgba(255, 255, 255, 0.8);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
