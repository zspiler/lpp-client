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
  >
    <LTooltip>
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
    default: null,
  },
});

const stations = ref({});
const stationMarkers = ref([]);

function updateStationMarkers() {
  stationMarkers.value = [];
  stations.value[props.selectedRoute.route_number].forEach((station) => {
    const stationColor = routeColors[props.selectedRoute.route_number];
    stationMarkers.value.push({
      station,
      color: stationColor,
    });
  });
}

async function fetchStationsOnSelectedRoute() {
  const trips = props.selectedRoute.trips.map((trip) => ({ tripId: trip.id, routeId: props.selectedRoute.route_id }));
  const requests = trips.map((trip) => axios.get(`route/stations-on-route?trip-id=${trip.tripId}`));

  Promise.all(requests).then((responses) => {
    responses.forEach((res) => {
      const fetchedStations = res.data.data;
      if (props.selectedRoute.route_number in stations.value) {
        fetchedStations.forEach((station) => {
          // ignore repeating stations
          const foundStation = stations.value[props.selectedRoute.route_number].find((s) => s.station_int_id === station.station_int_id);
          if (foundStation === undefined) {
            stations.value[props.selectedRoute.route_number].push(station);
          }
        });
      } else {
        stations.value[props.selectedRoute.route_number] = fetchedStations;
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

watch(() => props.selectedRoute, updateStations);

</script>
