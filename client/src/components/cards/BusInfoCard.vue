<template>
  <div class="card" :style="{ background: color }">
    <div class="route-number-icon">
      <div :style="{ color }">
        {{ props.bus.route_number }}
      </div>
    </div>
    <h4> {{ props.bus.route_name }} </h4>
    <p>To: {{ props.bus.destination }}</p>
    <CloseButton class="close-button" @click="closeCard" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { routeColors } from '@/colors'
import { Bus } from '@/api/types'
import CloseButton from '@/components/cards/CloseButton.vue'

interface Props {
  bus: Bus
}

const props = defineProps<Props>()

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
  z-index: 10000;
}

@media only screen and (max-width: 480px) {
  .card {
    opacity: 0.95;
  }
}

.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
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

</style>
