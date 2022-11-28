<template>
  <div class="card">
    <h1> {{ props.station.name }}</h1>

    <LoadingIndicator :loading="initialLoading" delayed />

    <div v-if="!initialLoading" class="arrival-list">
      <div class="arrival" v-for="arrival in nearArrivals" :key="arrival.vehicle_id">
        <div class="route-number" :style="{ backgroundColor: routeColors[arrival.route_name] }">
          {{ arrival.route_name }}
        </div>
        <div class="estimated-time">
          {{ arrival.eta_min }} min
        </div>
      </div>
    </div>

    <button class="close-button" @click="closeCard" />
  </div>
</template>

<script setup>
import {
  computed, watch, ref, onMounted, onUnmounted,
} from 'vue';

import { routeColors } from '../colors';
import axios from '../axios';
import LoadingIndicator from './animations/LoadingIndicator.vue';

const props = defineProps({
  station: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['close']);

const initialLoading = ref(true);
const arrivals = ref([]);
const fetchInterval = ref(null);

const nearArrivals = computed(() => arrivals.value.filter((arrival) => arrival.eta_min < 30));

function closeCard() {
  emit('close');
}

async function fetchArrivals() {
  try {
    const res = await axios.get(`station/arrival?station-code=${props.station.station_code}`);
    arrivals.value = res.data.data.arrivals;
    initialLoading.value = false;
  } catch (error) {
    initialLoading.value = false;
    // TODO: handle error
    console.log(error);
  }
}

onMounted(() => {
  initialLoading.value = true;
  fetchInterval.value = setInterval(fetchArrivals, 1000);
  fetchArrivals();
});

onUnmounted(() => {
  clearInterval(fetchInterval.value);
});

watch(
  () => props.station,
  fetchArrivals,
);

</script>

<style scoped>
.route-number {
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  margin: 10px 3px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  opacity: 1
}

.arrival-list {
  overflow-y: auto;
}
.arrival {
  font-weight: bold;
  margin: 0 auto;
  width: 50%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}
.card {
  color: white;
  border-radius: 3em;
  z-index: 9999;
  text-align: center;
  width: 350px;
  backdrop-filter: blur(10px) brightness(75%) saturate(120%)

}

.close-button {
  background: none;
  border: none;
  position: absolute;
  top: 5%;
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
