<template>
  <div class="container">
    <VueMultiselect
      class="route-select"
      v-model="selectedRoutes"
      :options="activeRoutes"
      track-by="route_id"
      label="route_number"
      :multiple="true"
      :disabled="initialLoading"
      placeholder="Select routes to display"
      select-label=""
    />

    <div class="map-container" :class="mapContainerClass">
      <LMap v-bind="mapConfig">
        <LTileLayer :url="tilesUrl" :attribution="mapTilesAttribution" />
        <BusMarkerLayer
          v-if="activeRoutes.length > 0"
          :selectedRoutes="selectedRoutes"
          :activeRoutes="activeRoutes"
          @loaded="initialLoading = false"
          @clickBus="selectBus"
        />
        <StationMarkerLayer :selectedRoutes="selectedRoutes" />
        <BusRouteShapesLayer
          :selectedRoutes="selectedRoutes"
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

const tilesUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const mapTilesAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>';

const activeRoutes = ref([]);
const selectedRoutes = ref([]);
const loading = ref(false);
const initialLoading = ref(true);
const selectedBus = ref(null);

async function fetchActiveRoutes() {
  try {
    const res = await axios.get('route/active-routes');
    const fetchedRoutes = res.data.data;
    const routes = [];
    fetchedRoutes.forEach((route) => {
      if (routes.length === 0 || routes[routes.length - 1].route_id !== route.route_id) {
        routes.push(route);
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

watch(selectedRoutes, (newSelectedRoutes) => {
  if (selectedBus.value) {
    // unselect bus if selected bus is not on one of the selected routes
    const selectedBusRoute = newSelectedRoutes.find((route) => {
      return route.route_number === selectedBus.value.route_number;
    });
    if (selectedBusRoute === undefined) {
      selectedBus.value = null;
    }
  }
});
</script>

<style>
.bus-icon {
  filter: drop-shadow(0px 0px 10px #000000);
  border-radius: 50%;
  height: 40px;
  width: 40px;
  opacity: 0.98;
}

.leaflet-tile-pane {
  filter: invert(1) saturate(0%) contrast(60%) brightness(60%);
}

.loading-map {
  filter: blur(4px) contrast(100%) ;
  pointer-events: none;
}
</style>

<style scoped>
.bus-info-card-enter-active,
.bus-info-card-leave-active {
  transition: opacity 0.3s ease;
}

.bus-info-card-enter-from,
.bus-info-card-leave-to {
  opacity: 0;
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
.route-select {
  position: absolute;
  top: 5%;
  z-index: 9999;
  text-align: center;
  width: 300px;
  left: 50%;
  margin-left: -150px;
}
</style>
