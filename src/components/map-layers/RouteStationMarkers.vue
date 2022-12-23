<template>
  <LMarker
    v-for="marker in stationMarkers"
    :key="marker.station.station_code"
    :lat-lng="[marker.station.latitude, marker.station.longitude]"
    :icon="getMarkerIcon(marker)"
    :options="{ station: marker.station }"
    :z-index-offset="getStationZIndex(marker.station)"
    @click="onStationClick"
  />
</template>

<script setup>
import {
  ref, watch, onMounted,
} from 'vue'
import { LMarker } from '@vue-leaflet/vue-leaflet'
import leaflet from 'leaflet'

import { stationIcon } from '@/assets/icons/svgIcons.ts'
import { usePreferencesStore } from '@/stores/preferences'
import axios from '@/axios/index.ts'
import { routeColors } from '@/colors.ts'

const store = usePreferencesStore()

const props = defineProps({
  selectedRoute: {
    type: Object,
    required: true,
  },
  selectedTrip: {
    type: Object,
    default: null,
  },
  selectedStation: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['stationClick'])

const stations = ref({})
const stationMarkers = ref([])
const selectedStation = ref(null)

function getStationZIndex(station) {
  return station.station_code === selectedStation.value?.station_code ? 1000 : null
}

function getMarkerIcon(marker) {
  const markerSize = 20

  const isMarkerSelected = marker.station.station_code === selectedStation.value?.station_code

  const selectedMarkerColor = store.darkTheme ? 'white' : 'white'
  const color = isMarkerSelected ? selectedMarkerColor : marker.color
  const icon = leaflet.divIcon({
    className: isMarkerSelected ? 'selected-station-icon' : 'station-icon',
    html: leaflet.Util.template(stationIcon, { color }),
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  })

  return icon
}

function onStationClick(e) {
  const stationCode = e.target.options.options.station.station_code
  const stationsOnSelectedRoute = stations.value[props.selectedRoute.route_number]
  selectedStation.value = stationsOnSelectedRoute.find((station) => station.station_code === stationCode)
  emit('stationClick', selectedStation.value)
}

function updateStationMarkers() {
  stationMarkers.value = []
  stationMarkers.value = stations.value[props.selectedRoute.route_number]
    .filter((station) => !props.selectedTrip || station.tripId === props.selectedTrip.id)
    .reduce((acc, station) => {
      // filter out duplicate stations
      if (acc.find((s) => s.station.station_code === station.station_code) !== undefined) return acc

      const stationColor = routeColors[props.selectedRoute.route_number]
      const marker = {
        station,
        color: stationColor,
      }
      acc.push(marker)
      return acc
    }, [])
}

async function fetchStationsOnSelectedRoute() {
  const selectedTrips = props.selectedRoute.trips
    .map((trip) => ({ tripId: trip.id, routeId: props.selectedRoute.route_id }))
    .filter((trip) => !props.selectedTrip || trip.tripId === props.selectedTrip.id)

  const requests = selectedTrips.map((trip) => axios.get(`route/stations-on-route?trip-id=${trip.tripId}`))

  Promise.all(requests).then((responses) => {
    responses.forEach((res, index) => {
      const data = res.data.data
      const tripId = selectedTrips[index].tripId
      const selectedRouteNumber = props.selectedRoute.route_number

      const fetchedStations = data.map((station) => ({ ...station, tripId }))

      if (selectedRouteNumber in stations.value) {
        stations.value[selectedRouteNumber] = stations.value[selectedRouteNumber].concat(fetchedStations)
      } else {
        stations.value[selectedRouteNumber] = fetchedStations
      }
    })
    updateStationMarkers()
  })
}

function updateStations() {
  if (props.selectedRoute.route_number in stations.value) {
    updateStationMarkers()
  } else {
    fetchStationsOnSelectedRoute()
  }
}

onMounted(() => {
  selectedStation.value = props.selectedStation
  updateStations()
})

watch([() => props.selectedRoute, () => props.selectedTrip], updateStations)

watch(() => props.selectedStation, () => {
  selectedStation.value = props.selectedStation
})

</script>

<style>
.station-icon {
  background: none;
  opacity: 0.7;
}

.selected-station-icon {
  background: none;
  filter: drop-shadow(0px 0px 10px #ffffff);
}
</style>
