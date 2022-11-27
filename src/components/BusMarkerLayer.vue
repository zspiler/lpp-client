<template>
  <LMarker
    v-for="marker in busMarkers"
    :key="marker.bus.bus_name"
    :lat-lng="[marker.bus.latitude, marker.bus.longitude]"
    :icon="getBusIcon(marker.bus)"
    @click="onBusClick"
    :options="{ bus: marker.bus }"
  />
</template>

<script setup>
import {
  ref, onMounted, onUnmounted, watch,
} from 'vue';
import { LMarker } from '@vue-leaflet/vue-leaflet';

import leaflet from 'leaflet';

import { routeColors } from '../colors';
import axios from '../axios';
import { busIcon, busIconMirrored } from '../assets/icons/svgIcons';

const props = defineProps({
  selectedRoute: {
    type: Object,
    default: null,
  },
  activeRoutes: Array.of(Object),
});

const emit = defineEmits(['loaded', 'clickBus']);

const buses = ref({});
const busMarkers = ref([]);
const fetchBusesInterval = ref(null);

function onBusClick(e) {
  const busName = e.target.options.options.bus.bus_name;
  const bus = buses.value[busName];
  emit('clickBus', bus);
}

function getBusIcon(bus) {
  const busDirection = bus.cardinal_direction;
  const svg = busDirection >= 0 && busDirection <= 180 ? busIconMirrored : busIcon;
  const angle = (busDirection >= 0 && busDirection <= 180) ? busDirection + 270 : busDirection + 90;

  const markerSize = 40;

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
    if (!props.selectedRoute || props.selectedRoute.route_id === routeId) {
      const bus = buses.value[busId];
      const color = routeColors[bus.route_number];
      busMarkers.value.push({ bus, color });
    }
  }
}

function fetchBuses() {
  const requests = props.activeRoutes.reduce((prevRequests, route) => {
    if (!props.selectedRoute || props.selectedRoute.route_id === route.route_id) {
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

watch(() => props.selectedRoute, updateBusMarkers);

</script>

<style scoped>
</style>
