<template>
  <div v-if="visible">
    <LMarker
      v-for="marker in stationMarkers"
      :key="marker.station.code"
      :lat-lng="[marker.station.latitude, marker.station.longitude]"
      :icon="getMarkerIcon(marker)"
      :options="{ station: marker.station }"
      :z-index-offset="getStationZIndex(marker.station)"
      @click="onStationClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, Ref } from 'vue'
import { LMarker } from '@vue-leaflet/vue-leaflet'
import leaflet, { LeafletEvent } from 'leaflet'
import { useToast } from 'vue-toastification'

import { stationIcon } from '@/assets/icons/svgIcons'
import { usePreferencesStore } from '@/stores/preferences'
import { getStationsInRange } from '@/api/api'
import { Location } from '@/types'
import { Station } from '@/api/types'

const maxDistanceToStation = 2000

type StationMarker = {
  station: Station,
  color: string,
}

interface Props {
  location: Location,
  visible: boolean,
  selectedStation?: Station,
}

const props = defineProps<Props>()

const emit = defineEmits(['stationClick', 'loadedStations', 'loadingStations'])

const stations: Ref<Station[]> = ref([])
const stationMarkers: Ref<StationMarker[]> = ref([])
const selectedStation: Ref<Station | undefined> = ref(undefined)

const toast = useToast()
const store = usePreferencesStore()

const nearbyStations = computed(() => {
    return stations.value.filter((station) => {
        const stationLatLng = leaflet.latLng([station.latitude, station.longitude])
        const locationLatLng = leaflet.latLng(props.location)
        return stationLatLng.distanceTo(locationLatLng) < maxDistanceToStation
    })
})

function getStationZIndex(station: Station) {
    return station.code === selectedStation.value?.code ? 1000 : null
}

function getMarkerIcon(marker: StationMarker) {
    const markerSize = 20

    const isMarkerSelected = marker.station.code === selectedStation.value?.code

    const selectedMarkerColor = store.darkTheme ? 'white' : 'white'
    const color = isMarkerSelected ? selectedMarkerColor : marker.color
    const icon = leaflet.divIcon({
        className: isMarkerSelected
            ? 'selected-station-icon fade-in-station-icon'
            : 'station-icon fade-in-station-icon',
        html: leaflet.Util.template(stationIcon, { color }),
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
    })

    return icon
}

function onStationClick(e: LeafletEvent) {
    const stationCode = e.target.options.options.station.code
    selectedStation.value = stations.value.find((station) => station.code === stationCode)
    emit('stationClick', selectedStation.value)
}

function updateStationMarkers() {
    const stationCodes = stationMarkers.value.map((marker) => marker.station.code)
    const displayedStations = new Set(stationCodes)

    const newNearbyStationMarkers = nearbyStations.value
        .filter((station) => !displayedStations.has(station.code))
        .map((station) => ({ station, color: 'rgba(0, 106, 46, 0.8)' }))

    stationMarkers.value = stationMarkers.value.concat(newNearbyStationMarkers)
}

async function fetchAllStations() {
    try {
        emit('loadingStations')
        const response = await getStationsInRange(props.location.lat, props.location.lng)
        stations.value = response.data
        updateStationMarkers()
        emit('loadedStations')
    } catch {
        toast.error('Error fetching stations')
        emit('loadedStations')
    }
}

onMounted(() => {
    fetchAllStations()
})

watch(() => props.selectedStation, () => {
    selectedStation.value = props.selectedStation
})

watch(() => props.location, updateStationMarkers)

</script>

<style>
.leaflet-marker-icon.fade-in-station-icon,
.leaflet-marker-shadow.fade-in-station-icon {
  -webkit-animation: fadein-station 1s; /* Safari, Chrome and Opera > 12.1 */
  -moz-animation: fadein-station 1s; /* Firefox < 16 */
  -ms-animation: fadein-station 1s; /* Internet Explorer */
  -o-animation: fadein-station 1s; /* Opera < 12.1 */
  animation: fadein-station 1s;
}

@keyframes fadein-station {
    from { opacity: 0; }
    to   { opacity: 0.7; }
}

/* Firefox < 16 */
@-moz-keyframes fadein-station {
    from { opacity: 0; }
    to   { opacity: 0.7; }
}

/* Safari, Chrome and Opera > 12.1 */
@-webkit-keyframes fadein-station {
    from { opacity: 0; }
    to   { opacity: 0.7; }
}

/* Internet Explorer */
@-ms-keyframes fadein-station {
    from { opacity: 0; }
    to   { opacity: 0.7; }
}

/* Opera < 12.1 */
@-o-keyframes fadein-station {
    from { opacity: 0; }
    to   { opacity: 0.7; }
}

.station-icon {
  background: none;
  opacity: 0.7;
}

.selected-station-icon {
  background: none;
  filter: drop-shadow(0px 0px 10px #ffffff);
}

</style>
