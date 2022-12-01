<template>
  <LCircleMarker
    v-for="marker in stationMarkers"
    :key="marker.station.station_code"
    :lat-lng="[marker.station.latitude, marker.station.longitude]"
    :radius="8"
    :color="marker.color"
    :fill="true"
    :stroke="false"
    :fillColor="marker.color"
    :fillOpacity="0.5"
    @click="onStationClick"
    :options="{ station: marker.station }"
  >
    <LTooltip :options="{ className: 'tooltip' }">
      <div>
        {{ marker.station.name }}
      </div>
    </LTooltip>
  </LCircleMarker>
</template>

<script setup>
import {
  ref, watch, onMounted,
} from 'vue';
import { LCircleMarker, LTooltip } from '@vue-leaflet/vue-leaflet';

import axios from '../axios/index';
import { routeColors } from '../colors';

const props = defineProps({
  selectedRoute: {
    type: Object,
    required: true,
  },
  selectedTrip: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['stationClick']);

const stations = ref({});
const stationMarkers = ref([]);

function onStationClick(e) {
  const stationCode = e.target.options.options.station.station_code;
  const station = stations.value[props.selectedRoute.route_number].find((s) => s.station_code === stationCode);
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
</script>

<style>
.tooltip {
  background: rgba(92, 92, 92, 0.65);
  color: white;
  font-size: 1.3em;
  padding: 10px 30px;
  border-radius: 1em;
  border: none;
}
</style>
