<template>
  <LCircleMarker
    v-for="marker in stationMarkers"
    :key="marker.station.name"
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
import { ref, watch } from 'vue';
import { LCircleMarker, LTooltip } from '@vue-leaflet/vue-leaflet';

import axios from '../axios/index';
import { routeColors } from '../colors';

const props = defineProps({
  selectedRoutes: Array.of(Object),
});

const stations = ref({});
const stationMarkers = ref([]);

async function displayStationsOnSelectedRoutes() {
  const routes = props.selectedRoutes.filter((route) => !(route.route_number in stations.value));
  const trips = routes.reduce((acc, route) => {
    const routeTrips = route.trips.map((trip) => ({ tripId: trip.id, routeId: route.route_id }));
    return [...acc, ...routeTrips];
  }, []);

  const requests = trips.map((trip) => axios.get(`route/stations-on-route?trip-id=${trip.tripId}`));

  const updateStationMarkers = () => {
    stationMarkers.value = [];
    props.selectedRoutes.forEach((route) => {
      stations.value[route.route_number].forEach((station) => {
        const stationColor = routeColors[route.route_number];
        stationMarkers.value.push({
          station,
          color: stationColor,
        });
      });
    });
  };

  if (requests.length === 0) {
    updateStationMarkers();
    return;
  }

  // get not yet fetched stations
  Promise.all(requests).then((responses) => {
    responses.forEach((res, index) => {
      const fetchedStations = res.data.data;
      const routeId = trips[index].routeId;
      const route = routes.find((r) => r.route_id === routeId);

      if (route.route_number in stations.value) {
        stations.value[route.route_number] = stations.value[route.route_number].concat(fetchedStations);
      } else {
        stations.value[route.route_number] = fetchedStations;
      }
    });
    updateStationMarkers();
  });
}

watch(() => props.selectedRoutes, displayStationsOnSelectedRoutes);

</script>
