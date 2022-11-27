<template>
  <div class="container">
    <div class="dropdown-inputs">
      <VueMultiselect
        v-if="!initialLoading"
        class="route-select"
        v-model="selectedRoute"
        :options="activeRoutes"
        track-by="route_id"
        label="route_number"
        placeholder="Select route"
        select-label=""
      />

      <Transition name="bus-info-card">
        <VueMultiselect
          v-if="!initialLoading && selectedRoute"
          class="trip-select"
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
      <LMap v-bind="mapConfig">
        <LTileLayer :url="tilesUrl" />
        <BusMarkerLayer
          v-if="activeRoutes.length > 0"
          :activeRoutes="activeRoutes"
          :selectedRoute="selectedRoute"
          :selectedTrip="selectedTrip"
          @loaded="initialLoading = false"
          @clickBus="selectBus"
        />
        <StationMarkerLayer v-if="selectedRoute" :selectedRoute="selectedRoute" :selectedTrip="selectedTrip" />
        <BusRouteShapesLayer
          v-if="selectedRoute"
          :selectedRoute="selectedRoute"
          @loading="loading = true"
          @loaded="loading = false"
        />
        <Transition name="bus-info-card">
          <BusInfoCard
            v-if="selectedBus"
            class="info-card"
            :bus="selectedBus"
            @close="unselectBus"
          />
        </Transition>
      </LMap>
    </div>

    <BusLoadingIndicator :loading="initialLoading" />
    <LoadingIndicator :loading="loading" delayed />
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
import StationMarkerLayer from '../components/StationMarkerLayer.vue';
import BusRouteShapesLayer from '../components/BusRouteShapesLayer.vue';
import LoadingIndicator from '../components/animations/LoadingIndicator.vue';
import BusLoadingIndicator from '../components/animations/BusLoadingIndicator.vue';
import BusInfoCard from '../components/BusInfoCard.vue';

const mapConfig = ref({
  zoom: 14,
  center: [46.0577, 14.5057],
  minZoom: 13,
  maxZoom: 18,
  options: {
    zoomSnap: 1,
  },
});

const tilesUrl = `${import.meta.env.VITE_TILESERVER_URL}styles/klokantech-basic/{z}/{x}/{y}.png?`;

const activeRoutes = ref([]);
const selectedRoute = ref(null);
const selectedTrip = ref(null);
const loading = ref(false);
const initialLoading = ref(true);
const selectedBus = ref(null);

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

const mapContainerClass = computed(() => {
  return initialLoading.value ? 'loading-map' : '';
});

onMounted(() => {
  fetchActiveRoutes();
});

watch(selectedRoute, (newSelectedRoute) => {
  selectedTrip.value = null;

  if (selectedBus.value && selectedBus.value.route_number !== newSelectedRoute.route_number) {
    selectedBus.value = null;
  }
});
</script>

<style>
.bus-icon {
  /* background: black; */
  /* height: 60px; */
  /* width: 60px; */
  /* border-radius: 50%; */
  /* filter: drop-shadow(0px 0px 10px #ffffff); */
  /* height: 40px;
  width: 40px;
  opacity: 0.98; */
}

.leaflet-tile-pane {
  /* filter: invert(1) saturate(0%) contrast(80%) brightness(80%); */
}

.loading-map {
  filter: blur(10px) contrast(100%) ;
  pointer-events: none;
}
</style>

<style scoped>
.bus-info-card-enter-active,
.bus-info-card-leave-active {
  transition: opacity 0.5s ease;
}

.bus-info-card-enter-from,
.bus-info-card-leave-to {
  opacity: 0;
}
/*
.bus-info-card-enter-active,
.bus-info-card-leave-active {
  transition: opacity 0.3s ease;
}

.bus-info-card-enter-from,
.bus-info-card-leave-to {
  opacity: 0;
} */

.container {
  height: 100vh;
  width: 100vw;
  position: relative;
}

.map-container {
  height: 100vh;
  width: 100vw;
}

.info-card {
  position: absolute;
  top: 5%;
  right: 2%;
  margin-left: -175px;
}

@media only screen and (max-width: 1000px) {
  .info-card {
    bottom: 10%;
    left: 50%;
    top: auto;
  }
}

#map {
  height: 100vh;
  width: 100vw;
}
.dropdown-inputs {
  position: absolute;
  top: 5%;
  z-index: 9999;
  text-align: center;
  width: 300px;
  left: 50%;
  margin-left: -150px;

}

.route-select {
  text-align: center;
}
.trip-select {
  text-align: center;
}
</style>
