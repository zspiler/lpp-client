<template>
  <div class="container">
    <div class="dropdown-inputs">
      <VueMultiselect
        v-if="!initialLoading"
        class="dropdown"
        v-model="selectedRoute"
        :options="activeRoutes"
        track-by="route_id"
        label="route_number"
        placeholder="Select route"
        select-label=""
      />

      <Transition name="fade">
        <VueMultiselect
          v-if="!initialLoading && selectedRoute"
          class="dropdown"
          v-model="selectedTrip"
          :options="selectedRoute.trips"
          track-by="id"
          label="name"
          placeholder="Select trip"
          select-label=""
        />
      </Transition>
    </div>

    <div class="map-container" :class="mapContainerClass">
      <LMap v-bind="mapConfig" @ready="initTilePane" @update:center="onMapMove">
        <LTileLayer :url="tilesUrl" />
        <BusMarkerLayer
          v-if="activeRoutes.length > 0"
          :activeRoutes="activeRoutes"
          :selectedRoute="selectedRoute"
          :selectedTrip="selectedTrip"
          :selectedBus="selectedBus"
          @loaded="initialLoading = false"
          @busClick="selectBus"
        />
        <StationMarkers
          :visible="(!selectedRoute && !selectedTrip)"
          :location="mapCenter"
          @stationClick="selectStation"
        />
        <RouteStationMarkers
          v-if="selectedRoute"
          :selectedRoute="selectedRoute"
          :selectedTrip="selectedTrip"
          :selectedStation="selectedStation"
          @stationClick="selectStation"
        />
        <RouteShapeLayer
          v-if="selectedRoute"
          :selectedRoute="selectedRoute"
          :selectedTrip="selectedTrip"
          @loading="loading = true"
          @loaded="loading = false"
        />
      </LMap>
      <div class="control-buttons">
        <ThemeToggleButton />
      </div>
      <Transition name="slide">
        <StationInfoCard
          v-if="selectedStation"
          class="station-info-card"
          :station="selectedStation"
          @close="unselectStation"
        />
      </Transition>
      <Transition name="fade">
        <BusInfoCard
          v-if="selectedBus"
          class="bus-info-card"
          :bus="selectedBus"
          @close="unselectBus"
        />
      </Transition>
    </div>
    <BusLoadingIndicator :loading="initialLoading" />
    <LoadingIndicator :loading="loading" delayed fixed />
  </div>
</template>

<script setup>
import {
  ref, onMounted, computed, watch,
} from 'vue';

import 'leaflet/dist/leaflet.css';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';

import VueMultiselect from 'vue-multiselect';

import axios from '../axios/index';

import BusMarkerLayer from '../components/BusMarkerLayer.vue';
import RouteStationMarkers from '../components/RouteStationMarkers.vue';
import StationMarkers from '../components/StationsMarkers.vue';
import RouteShapeLayer from '../components/RouteShapeLayer.vue';
import LoadingIndicator from '../components/animations/LoadingIndicator.vue';
import BusLoadingIndicator from '../components/animations/BusLoadingIndicator.vue';
import BusInfoCard from '../components/BusInfoCard.vue';
import StationInfoCard from '../components/StationInfoCard.vue';
import ThemeToggleButton from '../components/ThemeToggleButton.vue';

import { useThemeStore } from '@/stores/theme';

const store = useThemeStore();

const ljubljanaCenter = { lat: 46.0577, lng: 14.5057 };

const mapConfig = ref({
  zoom: 14,
  center: [ljubljanaCenter.lat, ljubljanaCenter.lng],
  minZoom: 12,
  maxZoom: 18,
  options: {
    zoomSnap: 1,
    zoomControl: false,
  },
});

const tilesUrl = `${import.meta.env.VITE_TILESERVER_URL}styles/klokantech-basic/{z}/{x}/{y}.png?`;

const activeRoutes = ref([]);
const selectedRoute = ref(null);
const selectedTrip = ref(null);
const loading = ref(false);
const initialLoading = ref(true);
const selectedBus = ref(null);
const selectedStation = ref(null);
const mapCenter = ref(ljubljanaCenter);

let leafletTilePane;

const mapContainerClass = computed(() => {
  return initialLoading.value ? 'loading-map' : '';
});

async function fetchActiveRoutes() {
  try {
    const res = await axios.get('route/active-routes');
    const fetchedRoutes = res.data.data;
    const routes = [];

    fetchedRoutes.forEach((route) => {
      const previousRoute = routes[routes.length - 1];

      const trip = {
        id: route.trip_id,
        name: route.route_name,
        shortName: route.short_route_name,
      };

      if (routes.length > 0 && previousRoute.route_id === route.route_id) {
        previousRoute.trips.push(trip);
      } else {
        routes.push({
          route_id: route.route_id,
          route_name: route.route_name,
          route_number: route.route_number,
          short_route_name: route.short_route_name,
          trips: [trip],
        });
      }
    });
    activeRoutes.value = routes;
    loading.value = false;
  } catch (error) {
    loading.value = false;
    // TODO: handle error
    console.log(error);
  }
}

function selectBus(bus) {
  selectedBus.value = bus;
  mapConfig.value.center = [bus.latitude, bus.longitude];
}

function unselectBus() {
  selectedBus.value = null;
}

function selectStation(station) {
  const stationsTrip = selectedRoute.value?.trips.find((trip) => trip.id === station.tripId);
  selectedStation.value = station;
  selectedStation.value.trip = stationsTrip;
  mapConfig.value.center = [station.latitude, station.longitude];
}

function unselectStation() {
  selectedStation.value = null;
}

function updateMapTheme() {
  if (store.darkTheme) {
    leafletTilePane.classList.add('dark-map-tiles');
  } else {
    leafletTilePane.classList.remove('dark-map-tiles');
  }
}

function initTilePane() {
  leafletTilePane = document.querySelector('.leaflet-tile-pane');
  updateMapTheme();
}

function onMapMove(newCenter) {
  mapCenter.value = newCenter;
}

onMounted(() => {
  fetchActiveRoutes();
});

watch(selectedRoute, (newSelectedRoute) => {
  selectedTrip.value = null;

  if (selectedBus.value && (!newSelectedRoute || (selectedBus.value.route_number !== newSelectedRoute.route_number))) {
    selectedBus.value = null;
  }
});

watch(() => store.darkTheme, () => {
  updateMapTheme();
});
</script>

<style>
.control-buttons {
  position: absolute;
  bottom: 5%;
  right: 2%;
  margin-left: -175px;
  z-index: 10000;
}

.dark-map-tiles {
  filter: invert(1) saturate(0%) contrast(80%) brightness(80%);
}

.loading-map {
  filter: blur(10px) contrast(100%) ;
  pointer-events: none;
}
</style>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: 0.35s ease;
}

.slide-enter-from {
  transform: translate(-100%, 0);
}
.slide-leave-to {
  transform: translate(-100%, 0);
}

.container {
  height: 100vh;
  width: 100vw;
  position: relative;
}

.map-container {
  height: 100vh;
  width: 100vw;
}

@media only screen and (max-width: 1000px) {
  .bus-info-card {
    bottom: 10%;
    top: auto;
    left: 50%;
    margin-left: -175px
  }
}

@media only screen and (max-width: 1000px) {
  .station-info-card  {
    top: 20%;
    left: 50%;
    margin-left: -175px;
  }
}

#map {
  height: 100vh;
  width: 100vw;
}
.dropdown-inputs {
  position: absolute;
  top: 6%;
  z-index: 9999;
  text-align: center;
  left: 50%;
  margin-left: -175px;
  width: 350px;
}

.dropdown {
  text-align: center;
}
</style>
