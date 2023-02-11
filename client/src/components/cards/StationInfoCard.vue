<template>
  <div class="card">
    <div class="card-header">
      {{ props.station.name }}
      <div v-if="'trip' in props.station" class="destination-text">
        To: {{ props.station.trip?.name }}
      </div>
    </div>

    <TimeFormatToggleButtons v-if="!loading && arrivals.length > 0" class="time-format-buttons" />

    <div v-dragscroll class="card-content">
      <LoadingIndicator :loading="loading" delayed fixed />
      <template v-if="!loading">
        <ArrivalList
          :arrivals="arrivals"
          :selected-route-number="selectedRouteNumber"
          @toggle-selected-route="(routeNumber) => $emit('toggleSelectedRoute', routeNumber)"
        />
      </template>
    </div>

    <CloseButton @click="closeCard" />
  </div>
</template>

<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted, computed, Ref } from 'vue'
import { useToast } from 'vue-toastification'

import { compareRouteNumbers } from '@/utils'
import { getArrivals } from '@/api'
import { Station } from '@/api/types'
import { RouteWithTrips, StationOnTrip, ArrivalGroup } from '@/types'

import LoadingIndicator from '@/components/animations/LoadingIndicator.vue'
import TimeFormatToggleButtons from '@/components/cards/TimeFormatToggleButtons.vue'
import ArrivalList from '@/components/cards/ArrivalList.vue'
import CloseButton from '@/components/cards/CloseButton.vue'

interface Props {
  station: Station | StationOnTrip
  selectedRoute?: RouteWithTrips
}

const arrivalsRefreshInterval = 30000

const props = defineProps<Props>()
const emit = defineEmits(['close', 'toggleSelectedRoute'])

const loading = ref(true)
const arrivals: Ref<ArrivalGroup[]> = ref([])
const fetchInterval: Ref<number | null> = ref(null)

const toast = useToast()

const selectedRouteNumber = computed(() => props.selectedRoute?.route_number)

function closeCard() {
    emit('close')
}

async function fetchArrivals() {
    try {
        const response = await getArrivals(props.station.code)
        const arrivalData = response.data

        let previousEstimatedTime: number
        const arrivalsByEstimatedTime: ArrivalGroup[] = []

        arrivalData.arrivals.forEach((arrival) => {
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
        loading.value = false
    } catch {
        toast.error('Error fetching arrival data')
        if (fetchInterval.value) {
            clearInterval(fetchInterval.value)
        }
        loading.value = false
    }
}

onMounted(() => {
    loading.value = true
    fetchInterval.value = setInterval(fetchArrivals, arrivalsRefreshInterval)
    fetchArrivals()
})

onUnmounted(() => {
    if (fetchInterval.value) {
        clearInterval(fetchInterval.value)
    }
})

watch(() => props.station, fetchArrivals)

</script>

<style scoped>
.card-header {
  height: 23%;
  font-size: x-large;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
  width: 350px;
  backdrop-filter: blur(10px) brightness(75%) saturate(120%);
  -webkit-backdrop-filter: blur(10px);
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  user-select: none;
}

@media only screen and (max-width: 1000px) {
  .card {
    border-radius: 2em 2em 2em 2em;
    height: 40%;
  }
}

.time-format-buttons {
    height: 3%;
    width: 75%;
    margin: 0 auto;
}

.card-content {
  overflow: hidden;
  height: 74%;
  cursor: grab;
}

.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
}

</style>
