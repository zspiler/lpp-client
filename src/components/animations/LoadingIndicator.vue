<template>
  <div v-show="props.delayed ? showLoader : loading" />
</template>

<script setup>
import { ref, watchEffect } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    required: true,
  },
  delayed: {
    type: Boolean,
    default: false,
  },
});

const showLoader = ref(false);

function delayLoadingAnimation() {
  if (props.loading) {
    setTimeout(() => {
      if (props.loading) {
        showLoader.value = true;
      }
    }, 500);
  } else {
    showLoader.value = false;
  }
}

if (props.delayed) {
  watchEffect(delayLoadingAnimation);
}
</script>

<style scoped>
div {
  position: fixed;
  width: 40px;
  height: 40px;
  margin:auto;
  left:0;
  right:0;
  top:0;
  bottom:0;
  border: 12px solid rgba(81, 81, 81, 0.5);
  border-top: 12px solid rgba(0, 128, 0, 0.3);
  border-radius: 50%;
  animation: spin 0.75s ease-in-out infinite;
  z-index: 9000;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
