<template>
  <div v-if="loading" />
</template>

<script>
export default {
  name: 'LoadingIndicator',
  props: {
    loading: {
      type: Boolean,
      required: true,
    },
  },
};
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
  border: 16px solid rgba(224, 238, 255, 0.5);
  border-top: 16px solid rgba(252, 123, 123, 0.9);
  border-radius: 50%;
  animation: spin 0.75s ease-in-out infinite;
  z-index: 9000;

  z-index: 9000;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
