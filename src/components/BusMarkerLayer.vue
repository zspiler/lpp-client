<template>
  <LMarker
    v-for="marker in busMarkers"
    :key="marker.bus.bus_name"
    :lat-lng="[marker.bus.latitude, marker.bus.longitude]"
    :icon="getBusIcon(marker.bus)"
  >
    <LTooltip>
      <div :style="{ color: marker.color }">
        {{ marker.bus.route_number }}
      </div>
      <h4> {{ marker.bus.route_name }} </h4>
      <p>To: {{ marker.bus.destination }}</p>
    </LTooltip>
  </LMarker>
</template>

<script setup>
import {
  computed, ref, onMounted, onUnmounted, watch,
} from 'vue';
import { LTooltip, LMarker } from '@vue-leaflet/vue-leaflet';

import leaflet from 'leaflet';

import { routeColors } from '../colors';
import axios from '../axios';
import { busIcon, busIconMirrored } from '../assets/icons/svgIcons';

const props = defineProps({
  selectedRoutes: Array.of(Object),
  activeRoutes: Array.of(Object),
});

const emit = defineEmits(['loaded']);

const buses = ref({});
const busMarkers = ref([]);
const fetchBusesInterval = ref(null);

const selectedRouteIds = computed(() => {
  return props.selectedRoutes.map((selectedRoute) => selectedRoute.route_id);
});

function getBusIcon(bus) {
  const busDirection = bus.cardinal_direction;
  const svg = busDirection >= 0 && busDirection <= 180 ? busIconMirrored : busIcon;
  const angle = (busDirection >= 0 && busDirection <= 180) ? busDirection + 270 : busDirection + 90;

  const markerSize = 36;

  const icon = leaflet.divIcon({
    className: 'bus-icon',
    html: leaflet.Util.template(svg, { color: routeColors[bus.route_number], angle }),
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  });

  return icon;
}

function updateBusMarkers() {
  // TODO: update latlng
  busMarkers.value = [];
  for (const busId in buses.value) {
    const routeId = buses.value[busId].route_id;
    if (props.selectedRoutes.length === 0 || selectedRouteIds.value.includes(routeId)) {
      const bus = buses.value[busId];
      const color = routeColors[bus.route_number];
      busMarkers.value.push({ bus, color });
    }
  }
}

function fetchBuses() {
  const requests = props.activeRoutes.reduce((prevRequests, route) => {
    if (props.selectedRoutes.length === 0 || selectedRouteIds.value.includes(route.route_id)) {
      prevRequests.push(axios.get(`bus/buses-on-route?route-group-number=${route.route_number}&specific=1`));
    }
    return prevRequests;
  }, []);

  Promise.all(requests).then((responses) => {
    responses.forEach((res) => {
      const fetchedBuses = res.data.data;
      fetchedBuses.forEach((bus) => {
        buses.value[bus.bus_name] = bus;
      });
    });
    emit('loaded');
    updateBusMarkers();
  }).catch((errors) => {
    emit('loaded');
    // TODO: handle errors
    console.log(errors);
  });
}

onMounted(() => {
  fetchBusesInterval.value = setInterval(fetchBuses, 5000);
});

onUnmounted(() => {
  clearInterval(fetchBusesInterval.value);
});

watch(() => props.selectedRoutes, updateBusMarkers);

</script>

<style scoped>
</style>
