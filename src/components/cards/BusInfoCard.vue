<template>
  <div class="card" :style="{ background: color }">
    <div class="route-number-icon">
      <div :style="{ color }">
        {{ props.bus.route_number }}
      </div>
    </div>
    <h4> {{ props.bus.route_name }} </h4>
    <p>To: {{ props.bus.destination }}</p>
    <button class="close-button" @click="closeCard" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { routeColors } from '@/colors'

const props = defineProps({
  bus: {
    type: Object,
    required: true,
  },
})
const emit = defineEmits(['close'])

const color = computed(() => {
  return routeColors[props.bus.route_number]
})

function closeCard() {
  emit('close')
}
</script>

<style scoped>
.card {
  position: absolute;
  top: 5%;
  right: 2%;
  color: white;
  opacity: 0.85;
  border-radius: 2em;
  z-index: 9999;
  text-align: center;
  width: 350px;
  font-size: 1rem;
  filter: saturate(70%);
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  user-select: none;
}
.route-number-icon {
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  margin: 10px auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.close-button {
  background: none;
  border: none;
  position: absolute;
  top: 10%;
  right: 5%;
  height: 22px;
  width: 22px;
  opacity: 0.4;
  cursor: pointer;
}
.close-button:hover {
  opacity: 1;
}
.close-button:before, .close-button:after {
  position: absolute;
  content: '';
  height: 22px;
  width: 2px;
  top: 0px;
  background-color: rgb(253, 253, 253);
}
.close-button:before {
  transform: rotate(45deg);
}
.close-button:after {
  transform: rotate(-45deg);
}
</style>
