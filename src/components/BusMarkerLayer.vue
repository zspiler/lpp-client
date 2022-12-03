<template>
  <LMarker
    v-for="marker in busMarkers"
    :key="marker.bus.bus_name"
    :lat-lng="[marker.bus.latitude, marker.bus.longitude]"
    :icon="getBusIcon(marker.bus)"
    :options="{ bus: marker.bus }"
    @click="onBusClick"
    :zIndexOffset="marker.bus.bus_name === selectedBusName ? 1000 : null"
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
import { useThemeStore } from '@/stores/theme';

const store = useThemeStore();

const props = defineProps({
  selectedRoute: {
    type: Object,
    default: null,
  },
  selectedTrip: {
    type: Object,
    default: null,
  },
  activeRoutes: Array.of(Object),
});

const emit = defineEmits(['loaded', 'busClick']);

const buses = ref({});
const busMarkers = ref([]);
const fetchBusesInterval = ref(null);
const selectedBusName = ref(null);

function onBusClick(e) {
  const busName = e.target.options.options.bus.bus_name;
  const bus = buses.value[busName];
  selectedBusName.value = busName;
  emit('busClick', bus);
}

function getBusIcon(bus) {
  const busDirection = bus.cardinal_direction;
  const svg = busDirection >= 0 && busDirection <= 180 ? busIconMirrored : busIcon;
  const angle = (busDirection >= 0 && busDirection <= 180) ? busDirection + 270 : busDirection + 90;

  const markerSize = 40;

  const selectedIconClass = store.darkTheme ? 'selected-bus-dark' : 'selected-bus';
  const icon = leaflet.divIcon({
    className: bus.bus_name === selectedBusName.value ? selectedIconClass : '',
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
    const tripId = buses.value[busId].trip_id;

    if ((!props.selectedRoute || props.selectedRoute.route_id === routeId)
      && (!props.selectedTrip || props.selectedTrip.id === tripId)) {
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

watch([() => props.selectedRoute, () => props.selectedTrip], updateBusMarkers);
watch(() => store.darkTheme, updateBusMarkers);
</script>

<style>
.selected-bus {
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid rgba(255, 255, 255, 0.95);
  filter: contrast(100%) saturate(150%);
}

.selected-bus-dark {
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0px 0px 10px #ffffff);
}
</style>
