<template>
  <LMarker
    v-for="marker in stationMarkers"
    :key="marker.station.code"
    :lat-lng="[marker.station.latitude, marker.station.longitude]"
    :icon="getMarkerIcon(marker)"
    :options="{ station: marker.station }"
    :z-index-offset="getStationZIndex(marker.station)"
    @click="onStationClick"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, Ref } from 'vue'
import { LMarker } from '@vue-leaflet/vue-leaflet'
import leaflet, { LeafletEvent } from 'leaflet'

import { stationIcon } from '@/assets/icons/svgIcons'
import { usePreferencesStore } from '@/stores/preferences'
import { routeColors } from '@/colors'
import { getStationsOnTrip } from '@/api/api'
import { Station } from '@/api/types'
import { RouteWithTrips, StationOnTrip } from '@/types'

type StationMarker = {
  station: Station,
  color: string,
}

interface StationsByRoute {
  [routeNumber: string]: StationOnTrip[];
}

interface Props {
  selectedRoute: RouteWithTrips,
  selectedTripId?: string,
  selectedStation?: Station,
}

const props = defineProps<Props>()

const emit = defineEmits(['stationClick'])

const stations: Ref<StationsByRoute> = ref({})
const stationMarkers: Ref<StationMarker[]> = ref([])
const selectedStation: Ref<Station | undefined> = ref(undefined)

const store = usePreferencesStore()

function getStationZIndex(station: Station) {
    return station.code === selectedStation.value?.code ? 1000 : null
}

function getMarkerIcon(marker: StationMarker) {
    const markerSize = 20

    const isMarkerSelected = marker.station.code === selectedStation.value?.code

    const selectedMarkerColor = store.darkTheme ? 'white' : 'white'
    const color = isMarkerSelected ? selectedMarkerColor : marker.color
    const icon = leaflet.divIcon({
        className: isMarkerSelected ? 'selected-station-icon' : 'station-icon',
        html: leaflet.Util.template(stationIcon, {
            color,
        }),
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
    })

    return icon
}

function onStationClick(e: LeafletEvent) {
    const stationCode = e.target?.options?.options?.station?.code
    if (!stationCode) return

    const stationsOnSelectedRoute = stations.value[props.selectedRoute.route_number]
    selectedStation.value = stationsOnSelectedRoute.find((station) => station.code === stationCode)

    emit('stationClick', { ...selectedStation.value })
}

function updateStationMarkers() {
    stationMarkers.value = []

    stationMarkers.value = stations.value[props.selectedRoute.route_number]
        .filter((station) => !props.selectedTripId || station.trip.id === props.selectedTripId)
        .reduce<StationMarker[]>((acc, station) => {
            // filter out duplicate stations
            if (acc.find((marker) => marker.station.code === station.code)) return acc

            const stationColor = routeColors[props.selectedRoute.route_number]
            const marker = { station, color: stationColor }
            acc.push(marker)
            return acc
        }, [])
}

async function fetchStationsOnSelectedRoute() {
    const selectedTrips = props.selectedRoute.trips
        .filter((trip) => !props.selectedTripId || trip.id === props.selectedTripId)

    const requests = selectedTrips.map((trip) => getStationsOnTrip(trip.id))

    Promise.all(requests).then((responses) => {
        responses.forEach((response, index) => {
            const fetchedStationsWithTrip = response.data.map(
                (station) => ({ ...station, trip: selectedTrips[index] }),
            )

            const routeNumber = props.selectedRoute.route_number

            if (routeNumber in stations.value) {
                stations.value[routeNumber] = stations.value[routeNumber].concat(fetchedStationsWithTrip)
            } else {
                stations.value[routeNumber] = fetchedStationsWithTrip
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

watch([() => props.selectedRoute, () => props.selectedTripId], updateStations)

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
