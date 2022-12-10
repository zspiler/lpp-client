<template>
  <div class="control-buttons">
    <ModeToggleButton :disabled="props.isModeButtonDisabled" />
    <ThemeToggleButton />
  </div>
</template>

<script setup>
import ThemeToggleButton from './ThemeToggleButton.vue';
import ModeToggleButton from './ModeToggleButton.vue';

const props = defineProps({
  isModeButtonDisabled: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.control-buttons {
  position: absolute;
  bottom: 5%;
  right: 2%;
  margin-left: -175px;
  z-index: 10000;
}
</style>
