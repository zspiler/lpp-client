<template>
  <div v-if="(arrivals.length === 0)" class="no-arrivals-message">
    No scheduled arrivals at this moment
  </div>
  <template v-else>
    <div v-for="arrivalGroup in arrivals" :key="arrivalGroup.eta" class="arrivals">
      <div class="arrival">
        <div class="eta-text">
          {{ formatArrivalTime(arrivalGroup.eta) }}
        </div>
        <div class="route-icons">
          <span
            v-for="arrival in arrivalGroup.arrivals"
            :key="arrival.vehicle_id"
            class="route-icon"
            :class="{
              'selected-route': arrival.route_name === selectedRouteNumber,
              'non-selected-route': selectedRouteNumber && arrival.route_name !== selectedRouteNumber,
            }"
            :style="{ backgroundColor: routeColors[arrival.route_name] }"
            @click="selectArrival(arrival)"
          >
            {{ arrival.route_name }}
          </span>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'

import { Arrival } from '@/api/types'
import { ArrivalGroup } from '@/types'
import { usePreferencesStore } from '@/stores/preferences'
import { routeColors } from '@/colors'
import { dateToHHMM } from '@/utils'

const store = usePreferencesStore()

interface Props {
  arrivals: ArrivalGroup[],
  selectedRouteNumber?: string,
}

const props = defineProps<Props>()
const emit = defineEmits(['toggleSelectedRoute'])

const { arrivals, selectedRouteNumber } = toRefs(props)

function selectArrival(arrival: Arrival) {
    emit('toggleSelectedRoute', arrival.route_name)
}

function formatArrivalTime(minutesUntilArrival: number) {
    if (!store.isHHMMArivalTimeFormat) {
        return `${minutesUntilArrival} min`
    }

    const arrivalTime = new Date()
    arrivalTime.setMinutes(arrivalTime.getMinutes() + minutesUntilArrival)
    return dateToHHMM(arrivalTime)
}
</script>

<style scoped>
.arrival {
  display: flex;
  align-items: center;
  gap: 10%;
  justify-content: space-between;
}

.arrivals {
  font-weight: bold;
  margin: 0 auto;
  width: 75%;
}

.eta-text {
  width: 60px;
  flex-shrink: 0;
  text-align: center;
}

.route-icon:hover {
  filter: drop-shadow(0px 0px 2px #ffffff) saturate(120%);
}

.non-selected-route {
  filter: brightness(70%);
}

.selected-route {
  filter: drop-shadow(0px 0px 2px #ffffff) saturate(120%);
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
  margin: 10px 3px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}

.no-arrivals-message {
  height: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
