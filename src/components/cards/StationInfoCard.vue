<template>
  <div class="card">
    <div class="card-header">
      <div>
        {{ props.station.name }}
      </div>
      <div v-if="props.station.trip?.shortName" class="destination-text">
        To: {{ props.station.trip?.shortName }}
      </div>
    </div>
    <div v-dragscroll class="card-content">
      <LoadingIndicator :loading="loading" delayed fixed />
      <template v-if="!loading">
        <div v-if="(arrivals.length === 0)" class="no-arrivals-message">
          No scheduled arrivals at this moment
        </div>
        <div v-else class="arrival-list">
          <div v-for="arrivalGroup in arrivals" :key="arrivalGroup.eta" class="arrivals">
            <div class="arrival">
              <div class="eta-text">
                {{ arrivalGroup.eta }} min
              </div>
              <div class="route-icons">
                <span
                  v-for="arrival in arrivalGroup.arrivals"
                  :key="arrival.vehicle_id"
                  class="route-icon"
                  :class="{
                    'selected-route-icon': arrival.route_name === selectedRouteNumber,
                    'non-selected-route-icon': selectedRouteNumber && arrival.route_name !== selectedRouteNumber,
                  }"
                  :style="{ backgroundColor: routeColors[arrival.route_name] }"
                  @click="selectArrival(arrival)"
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
  watch, ref, onMounted, onUnmounted, computed,
} from 'vue'
import { useToast } from 'vue-toastification'

import { routeColors } from '@/colors'
import axios from '@/axios'
import { compareRouteNumbers } from '@/utils'
import LoadingIndicator from '../animations/LoadingIndicator.vue'

const props = defineProps({
  station: {
    type: Object,
    required: true,
  },
  selectedRoute: {
    type: Object,
    default: null,
  },
})
const emit = defineEmits(['close', 'toggleSelectedRoute'])

const loading = ref(true)
const arrivals = ref([])
const fetchInterval = ref(null)

const toast = useToast()

const selectedRouteNumber = computed(() => props.selectedRoute?.route_number)

function closeCard() {
  emit('close')
}

async function fetchArrivals() {
  try {
    const res = await axios.get(`station/arrival?station-code=${props.station.station_code}`)

    let previousEstimatedTime
    const arrivalsByEstimatedTime = []

    res.data.data.arrivals.forEach((arrival) => {
      const estimatedTime = arrival.eta_min
      if (estimatedTime !== previousEstimatedTime) {
        arrivalsByEstimatedTime.push({
          eta: arrival.eta_min,
          arrivals: [arrival],
        })
        previousEstimatedTime = estimatedTime
      } else {
        arrivalsByEstimatedTime[arrivalsByEstimatedTime.length - 1].arrivals.push(arrival)
      }
    })

    arrivalsByEstimatedTime.forEach((arrivalGroup) => {
      arrivalGroup.arrivals.sort((a, b) => compareRouteNumbers(a.route_name, b.route_name))
    })

    arrivals.value = arrivalsByEstimatedTime
    console.log('arrivals: ')
    console.log(arrivals.value)
    loading.value = false
  } catch {
    toast.error('Error fetching arrival data')
    clearInterval(fetchInterval.value)
    loading.value = false
  }
}

function selectArrival(arrival) {
  emit('toggleSelectedRoute', arrival.route_name)
}

onMounted(() => {
  loading.value = true
  fetchInterval.value = setInterval(fetchArrivals, 10000)
  fetchArrivals()
})

onUnmounted(() => {
  clearInterval(fetchInterval.value)
})

watch(
  () => props.station,
  fetchArrivals,
)

</script>

<style scoped>
.no-arrivals-message {
  height: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.card-header {
  height: 23%;
  font-size: x-large;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.destination-text {
  font-size: small;
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
  flex-shrink: 0;
}

.card-content {
  overflow: hidden;
  height: 77%;
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
  margin: 10px 3px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}

.route-icon:hover {
  filter: drop-shadow(0px 0px 2px #ffffff) saturate(120%);
}

.non-selected-route-icon {
  filter: brightness(70%);
}

.selected-route-icon {
  filter: drop-shadow(0px 0px 2px #ffffff) saturate(120%);
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
