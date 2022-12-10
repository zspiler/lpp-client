<template>
  <div v-if="visible">
    <LMarker
      v-for="marker in stationMarkers"
      :key="marker.station.station_code"
      :lat-lng="[marker.station.latitude, marker.station.longitude]"
      :icon="getMarkerIcon(marker)"
      :options="{ station: marker.station }"
      @click="onStationClick"
      :zIndexOffset="getStationZIndex(marker.station)"
    />
  </div>
</template>

<script setup>
import {
  ref, watch, onMounted, computed,
} from 'vue';
import { LMarker } from '@vue-leaflet/vue-leaflet';
import leaflet from 'leaflet';

import axios from '../axios/index';
import { stationIcon } from '../assets/icons/svgIcons';
import { usePreferencesStore } from '@/stores/preferences';

const maxDistanceToStation = 2000;

const store = usePreferencesStore();

const props = defineProps({
  location: {
    type: Object,
    required: true,
  },
  visible: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['stationClick', 'loaded']);

const stationMarkers = ref([]);
const selectedStationCode = ref(null);
const stations = ref([]);

const nearbyStations = computed(() => {
  return stations.value.filter((station) => {
    const stationLatLng = leaflet.latLng([station.latitude, station.longitude]);
    const locationLatLng = leaflet.latLng(props.location);
    return stationLatLng.distanceTo(locationLatLng) < maxDistanceToStation;
  });
});

function getStationZIndex(station) {
  return station.station_code === selectedStationCode.value ? 1000 : null;
}

function getMarkerIcon(marker) {
  const markerSize = 20;

  const isMarkerSelected = marker.station.station_code === selectedStationCode.value;

  const selectedMarkerColor = store.darkTheme ? 'white' : 'white';
  const color = isMarkerSelected ? selectedMarkerColor : marker.color;
  const icon = leaflet.divIcon({
    className: isMarkerSelected ? 'selected-station-icon fade-in-station-icon' : 'station-icon fade-in-station-icon',
    html: leaflet.Util.template(stationIcon, { color }),
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  });

  return icon;
}

function onStationClick(e) {
  const stationCode = e.target.options.options.station.station_code;
  const station = stations.value.find((s) => s.station_code === stationCode);
  selectedStationCode.value = stationCode;
  emit('stationClick', station);
}

function updateStationMarkers() {
  const displayedStations = new Set(stationMarkers.value.map((marker) => marker.station.station_code));

  const newNearbyStationMarkers = nearbyStations.value
    .filter((station) => !displayedStations.has(station.station_code))
    .map((station) => {
      const marker = {
        station,
        color: 'rgba(0, 106, 46, 0.8)',
      };
      return marker;
    });

  stationMarkers.value = stationMarkers.value.concat(newNearbyStationMarkers);
}

async function fetchAllStations() {
  try {
    const res = await axios.get(`station/stations-in-range?latitude=${props.location.lat}&longitude=${props.location.lng}&radius=30000`);
    stations.value = res.data.data.map(((station) => ({ ...station, station_code: station.ref_id })));
    updateStationMarkers();
    emit('loaded');
  } catch (error) {
    // TODO: handle error
    console.log(error);
  }
}

onMounted(() => {
  fetchAllStations();
});

watch(() => props.selectedStation, () => {
  if (!props.selectedStation) {
    selectedStationCode.value = null;
  }
});

watch(() => props.location, updateStationMarkers);

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
