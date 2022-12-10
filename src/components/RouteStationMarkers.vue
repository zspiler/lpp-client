<template>
  <LMarker
    v-for="marker in stationMarkers"
    :key="marker.station.station_code"
    :lat-lng="[marker.station.latitude, marker.station.longitude]"
    :icon="getMarkerIcon(marker)"
    :options="{ station: marker.station }"
    @click="onStationClick"
    :zIndexOffset="getStationZIndex(marker.station)"
  />
</template>

<script setup>
import {
  ref, watch, onMounted,
} from 'vue';
import { LMarker } from '@vue-leaflet/vue-leaflet';
import leaflet from 'leaflet';

import axios from '../axios/index';
import { routeColors } from '../colors';
import { stationIcon } from '../assets/icons/svgIcons';
import { usePreferencesStore } from '@/stores/preferences';

const store = usePreferencesStore();

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
});

const emit = defineEmits(['stationClick']);

const stations = ref({});
const stationMarkers = ref([]);
const selectedStationCode = ref(null);

function getStationZIndex(station) {
  return station.station_code === selectedStationCode.value ? 1000 : null;
}

function getMarkerIcon(marker) {
  const markerSize = 20;

  const isMarkerSelected = marker.station.station_code === selectedStationCode.value;

  const selectedMarkerColor = store.darkTheme ? 'white' : 'white';
  const color = isMarkerSelected ? selectedMarkerColor : marker.color;
  const icon = leaflet.divIcon({
    className: isMarkerSelected ? 'selected-station-icon' : 'station-icon',
    html: leaflet.Util.template(stationIcon, { color }),
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  });

  return icon;
}

function onStationClick(e) {
  const stationCode = e.target.options.options.station.station_code;
  const station = stations.value[props.selectedRoute.route_number].find((s) => s.station_code === stationCode);
  selectedStationCode.value = stationCode;
  emit('stationClick', station);
}

function updateStationMarkers() {
  stationMarkers.value = [];
  stationMarkers.value = stations.value[props.selectedRoute.route_number]
    .filter((station) => !props.selectedTrip || station.tripId === props.selectedTrip.id)
    .reduce((acc, station) => {
      // filter out duplicate stations
      if (acc.find((s) => s.station.station_code === station.station_code) !== undefined) return acc;

      const stationColor = routeColors[props.selectedRoute.route_number];
      const marker = {
        station,
        color: stationColor,
      };
      acc.push(marker);
      return acc;
    }, []);
}

async function fetchStationsOnSelectedRoute() {
  const selectedTrips = props.selectedRoute.trips
    .map((trip) => ({ tripId: trip.id, routeId: props.selectedRoute.route_id }))
    .filter((trip) => !props.selectedTrip || trip.tripId === props.selectedTrip.id);

  const requests = selectedTrips.map((trip) => axios.get(`route/stations-on-route?trip-id=${trip.tripId}`));

  Promise.all(requests).then((responses) => {
    responses.forEach((res, index) => {
      const fetchedStations = res.data.data;
      const tripId = selectedTrips[index].tripId;
      const selectedRouteNumber = props.selectedRoute.route_number;

      if (selectedRouteNumber in stations.value) {
        stations.value[selectedRouteNumber] = stations.value[selectedRouteNumber].concat(fetchedStations.map((station) => ({ ...station, tripId })));
      } else {
        stations.value[selectedRouteNumber] = fetchedStations.map((station) => ({ ...station, tripId }));
      }
    });
    updateStationMarkers();
  });
}

function updateStations() {
  if (props.selectedRoute.route_number in stations.value) {
    updateStationMarkers();
  } else {
    fetchStationsOnSelectedRoute();
  }
}

onMounted(() => {
  updateStations();
});

watch([() => props.selectedRoute, () => props.selectedTrip], updateStations);

watch(() => props.selectedStation, () => {
  if (!props.selectedStation) {
    selectedStationCode.value = null;
  }
});

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
