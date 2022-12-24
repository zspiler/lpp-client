<template>
  <div v-if="visible">
    <LMarker
      v-for="marker in busMarkers"
      :key="marker.bus.bus_name"
      :lat-lng="[marker.bus.latitude, marker.bus.longitude]"
      :icon="getBusIcon(marker.bus)"
      :options="{ bus: marker.bus }"
      :z-index-offset="marker.bus.bus_name === selectedBusName ? 1000 : null"
      @click="onBusClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import { LMarker } from '@vue-leaflet/vue-leaflet'
import leaflet, { LeafletEvent } from 'leaflet'
import { useToast } from 'vue-toastification'

import { usePreferencesStore } from '@/stores/preferences'
import { routeColors } from '@/colors'
import { busIcon, busIconMirrored, outlinedBusIcon, outlinedBusIconMirrored } from '@/assets/icons/svgIcons'
import { getBusesOnRoute } from '@/api/api'
import { Route, BusData, Bus } from '@/api/types'

type BusMarker = {
  bus: Bus,
  color: string,
}

interface Props {
  activeRoutes: Route[],
  visible: boolean,
  selectedRoute?: Route,
  selectedTripId?: string,
  selectedBus?: Bus,
}

const props = defineProps<Props>()

const emit = defineEmits(['loadingBuses', 'loadedBuses', 'busClick'])

const buses: Ref<Record<string, Bus>> = ref({})
const busMarkers: Ref<BusMarker[]> = ref([])
const fetchBusesInterval: Ref<number | null> = ref(null)
const selectedBusName = ref(null)

const toast = useToast()
const store = usePreferencesStore()

function onBusClick(e: LeafletEvent) {
  const busName = e.target?.options?.options?.bus?.bus_name
  if (!busName) return
  const bus = buses.value[busName]
  selectedBusName.value = busName
  emit('busClick', bus)
}

function getBusIcon(bus: Bus) {
  const busDirection = bus.cardinal_direction

  let svg
  if (busDirection >= 0 && busDirection <= 180) {
    svg = store.darkTheme ? outlinedBusIconMirrored : busIconMirrored
  } else {
    svg = store.darkTheme ? outlinedBusIcon : busIcon
  }

  const angle = (busDirection >= 0 && busDirection <= 180) ? busDirection + 270 : busDirection + 90

  const markerSize = 40

  const selectedIconClass = store.darkTheme ? 'selected-bus-dark' : 'selected-bus'
  const icon = leaflet.divIcon({
    className: bus.bus_name === selectedBusName.value ? selectedIconClass : '',
    html: leaflet.Util.template(svg, {
      color: routeColors[bus.route_number], angle,
    }),
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  })

  return icon
}

function updateBusMarkers() {
  // TODO: update latlng
  busMarkers.value = []
  for (const busId in buses.value) {
    const routeId = buses.value[busId].route_id
    const tripId = buses.value[busId].trip_id

    if ((!props.selectedRoute || props.selectedRoute.route_id === routeId)
      && (!props.selectedTripId || props.selectedTripId === tripId)) {
      const bus = buses.value[busId]
      const color = routeColors[bus.route_number]
      busMarkers.value.push({ bus, color })
    }
  }
}

function fetchBuses() {
  const requests = props.activeRoutes.reduce<Promise<BusData>[]>((acc, route) => {
    if (!props.selectedRoute || props.selectedRoute.route_id === route.route_id) {
      acc.push(getBusesOnRoute(route.route_number))
    }
    return acc
  }, [])

  Promise.all(requests).then((responses) => {
    responses.forEach((res) => {
      res.data.forEach((bus) => {
        buses.value[bus.bus_name] = bus
      })
    })
    emit('loadedBuses')
    updateBusMarkers()
  }).catch((errors) => {
    emit('loadedBuses')
    if (errors.code === 'ECONNABORTED') return // TODO
    toast.error('Error fetching bus locations')
    if (fetchBusesInterval.value) {
      clearInterval(fetchBusesInterval.value)
    }
  })
}

onMounted(() => {
  emit('loadingBuses')
  fetchBuses()
  fetchBusesInterval.value = setInterval(fetchBuses, 5000)
})

onUnmounted(() => {
  if (fetchBusesInterval.value) {
    clearInterval(fetchBusesInterval.value)
  }
})

watch([() => props.selectedRoute, () => props.selectedTripId], updateBusMarkers)

watch(() => store.darkTheme, updateBusMarkers)

watch(() => props.selectedBus, () => {
  if (!props.selectedBus) {
    selectedBusName.value = null
  }
})
</script>

<style scoped>
div {
  display: none;
}
</style>

<style>
.selected-bus {
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid rgba(255, 255, 255, 0.95);
  filter: contrast(100%) saturate(150%);
}

.selected-bus-dark {
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0px 0px 10px #ffffff);
}
</style>
