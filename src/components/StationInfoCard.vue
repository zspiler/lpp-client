<template>
  <div class="card">
    <div class="title">
      {{ props.station.name }}
    </div>
    <div v-if="props.station.trip.shortName" class="subtitle">
      To: {{ props.station.trip.shortName }}
    </div>
    <div class="content" v-dragscroll>
      <LoadingIndicator :loading="initialLoading" delayed />
      <template v-if="!initialLoading">
        <div v-if="(arrivals.length === 0)" class="no-arrivals-message">
          No scheduled arrivals at this moment
        </div>
        <div v-else class="arrival-list">
          <div class="arrivals" v-for="arrivalGroup in arrivals" :key="arrivalGroup.eta">
            <div class="arrival">
              <div class="eta-text">
                {{ arrivalGroup.eta }} min
              </div>
              <div class="route-icons">
                <span
                  v-for="arrival in arrivalGroup.arrivals"
                  :key="arrival.vehicle_id"
                  class="route-icon"
                  :style="{ backgroundColor: routeColors[arrival.route_name] }"
                >
                  {{ arrival.route_name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    <button class="close-button" @click="closeCard" />
  </div>
</template>

<script setup>
import {
  watch, ref, onMounted, onUnmounted,
} from 'vue';

import { routeColors } from '../colors';
import axios from '../axios';
import LoadingIndicator from './animations/LoadingIndicator.vue';

import { compareRouteNumbers } from '../utils';

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

function closeCard() {
  emit('close');
}

async function fetchArrivals() {
  try {
    const res = await axios.get(`station/arrival?station-code=${props.station.station_code}`);

    let previousEstimatedTime;
    const arrivalsByEstimatedTime = [];

    res.data.data.arrivals.forEach((arrival) => {
      const estimatedTime = arrival.eta_min;
      if (estimatedTime > 30) return;
      if (estimatedTime !== previousEstimatedTime) {
        arrivalsByEstimatedTime.push({
          eta: arrival.eta_min,
          arrivals: [arrival],
        });
        previousEstimatedTime = estimatedTime;
      } else {
        arrivalsByEstimatedTime[arrivalsByEstimatedTime.length - 1].arrivals.push(arrival);
      }
    });

    arrivalsByEstimatedTime.forEach((arrivalGroup) => {
      arrivalGroup.arrivals.sort((a, b) => compareRouteNumbers(a.route_name, b.route_name));
    });

    arrivals.value = arrivalsByEstimatedTime;
    initialLoading.value = false;
  } catch (error) {
    initialLoading.value = false;
    // TODO: handle error
    console.log(error);
  }
}

onMounted(() => {
  initialLoading.value = true;
  fetchInterval.value = setInterval(fetchArrivals, 10000);
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
.no-arrivals-message {
  height: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.title {
  height: 17%;
  font-size: x-large;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subtitle {
  height: 8%;
  font-size: smaller;
}

.card {
  position: absolute;
  top: 5%;
  height: 50%;
  z-index: 1000;
  color: white;
  border-radius: 0 2em 2em 0;
  z-index: 9999;
  text-align: center;
  width: 350px;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px) brightness(75%) saturate(120%);
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  user-select: none;
}

@media only screen and (max-width: 1000px) {
  .card {
    height: 30%;
  }
}

.eta-text {
  width: 60px;
}

.content {
  overflow: hidden;
  height: 75%;
}

.route-icons {
  display: flex;
  justify-content: center;
  flex-grow: 0;
}

.route-icon {
  font-size: small;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: white;
  margin: 10px 3px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  opacity: 1
}

.arrival {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10%;
  justify-content: space-between;
}

.arrivals {
  font-weight: bold;
  margin: 0 auto;
  width: 75%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
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
