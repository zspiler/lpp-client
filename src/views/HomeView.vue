<template>
  <div class="map-container">
    <VueMultiselect
      class="route-select"
      v-model="selectedRoutes"
      :options="activeRoutes"
      track-by="route_id"
      label="route_number"
      :multiple="true"
      :disabled="loading"
      placeholder="Select routes to display"
      select-label=""
    />

    <LMap
      v-bind="mapConfig"
      :options="mapOptions"
    >

      <LTileLayer :url="tilesUrl" :attribution="tileAttribution" />

      <LCircleMarker
        v-for="marker in busMarkers"
        :key="marker.bus.bus_name"
        :lat-lng="[marker.bus.latitude, marker.bus.longitude]"
        :radius="10"
        :color="marker.color"
        :fill="true"
        :fillColor="marker.color"
        :fillOpacity="1"
        :opacity="0.5"
      >
        <LTooltip>
          <div class="route-number-icon">
            <div :style="{ color: marker.color }">
              {{ marker.bus.route_number }}
            </div>
          </div>
          <h4> {{ marker.bus.route_name }} </h4>
          <p>To: {{ marker.bus.destination }}</p>
        </LTooltip>
      </LCircleMarker>

      <LCircleMarker
        v-for="marker in stationMarkers"
        :key="marker.station.name"
        :lat-lng="[marker.station.latitude, marker.station.longitude]"
        :radius="10"
        :color="marker.color"
        :fill="true"
        :fillColor="marker.color"
        :fillOpacity="0.4"
        :opacity="0.2"
      >
        <LTooltip>
          <div>
            {{ marker.station.name }}
          </div>
        </LTooltip>
      </LCircleMarker>

      <LGeoJson
        v-for="selectedRouteShape in selectedRouteShapes"
        :key="selectedRouteShape.routeNumber"
        :geojson="selectedRouteShape"
        :options="{
          style: {
            color: selectedRouteShape.color,
            opacity: 0.65,
          },
        }"
      />
    </LMap>

    <LoadingIndicator :loading="loading" />

  </div>
</template>

<script setup>

import {
  ref, onMounted, onUnmounted, watch, computed,
} from 'vue';

import 'leaflet/dist/leaflet.css';
import {
  LMap, LTileLayer, LCircleMarker, LTooltip, LGeoJson,
} from '@vue-leaflet/vue-leaflet';

import VueMultiselect from 'vue-multiselect';

import axios from '../axios/index';
import { routeColors } from '../colors';

import LoadingIndicator from '../components/LoadingIndicator.vue';

const mapConfig = {
  zoom: 14,
  center: [46.0577, 14.5057],
  minZoom: 3,
  maxZoom: 18,
  zoomAnimation: true,
};

const mapOptions = {
  zoomSnap: 1,
};

const tilesUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>';

const routeShapes = ref({});
const activeRoutes = ref([]);

const buses = ref({});
const busMarkers = ref([]);
const stations = ref({});
const stationMarkers = ref([]);

const selectedRoutes = ref([]);
const fetchBusesInterval = ref(null);

const loading = ref(true);

const selectedRouteNumbers = computed(() => {
  return selectedRoutes.value.map((selectedRoute) => selectedRoute.route_number);
});

const selectedRouteShapes = computed(() => {
  return Object.keys(routeShapes.value)
    .filter((routeNumber) => selectedRouteNumbers.value.includes(routeNumber))
    .map((routeNumber) => {
      const routeShape = routeShapes.value[routeNumber];
      return {
        ...routeShape,
        color: routeColors[routeNumber],
        routeNumber,
      };
    });
});

async function displayStationsOnSelectedRoutes() {
  const routes = selectedRoutes.value.filter((route) => !(route.route_number in stations.value));
  const requests = routes.map((route) => axios.get(`route/stations-on-route?trip-id=${route.trip_id}`));

  const updateStationMarkers = () => {
    stationMarkers.value = [];
    selectedRoutes.value.forEach((route) => {
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
      const route = routes[index];
      stations.value[route.route_number] = fetchedStations; // cache stations
    });
    updateStationMarkers();
  });
}

async function displaySelectedRoutes() {
  const requests = selectedRoutes.value.reduce((prevRequests, route) => {
    if (!(route.route_number in routeShapes.value)) {
      prevRequests.push(axios.get(`route/routes?route-id=${route.route_id}&shape=1`));
    }
    return prevRequests;
  }, []);

  if (requests.length === 0) {
    return;
  }

  loading.value = true;
  Promise.all(requests).then((responses) => {
    responses.forEach((res) => {
      const routeNumber = res.data.data[0].route_number;
      const routeShape = res.data.data[0].geojson_shape;
      loading.value = false;
      routeShapes.value[routeNumber] = routeShape;
    });
  }).catch((errors) => {
    loading.value = true;
    // TODO: handle errors
    console.log(errors);
  });
}

function updateBusMarkers() {
  // TODO: update latlng
  busMarkers.value = [];
  for (const busId in buses.value) {
    const routeNumber = buses.value[busId].route_number;
    if (selectedRoutes.value.length === 0 || selectedRouteNumbers.value.includes(routeNumber)) {
      const bus = buses.value[busId];
      const color = routeColors[bus.route_number];
      busMarkers.value.push({ bus, color });
    }
  }
}

function fetchBuses() {
  const requests = activeRoutes.value.reduce((prevRequests, route) => {
    if (selectedRoutes.value.length === 0 || selectedRouteNumbers.value.includes(route.route_number)) {
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
    loading.value = false;
    updateBusMarkers();
  }).catch((errors) => {
    // TODO: handle errors
    loading.value = false;
    console.log(errors);
  });
}

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
    fetchBuses();
    fetchBusesInterval.value = setInterval(fetchBuses, 5000);
  } catch (error) {
    loading.value = false;
    // TODO: handle error
    console.log(error);
  }
}

onMounted(() => {
  fetchActiveRoutes();
});

onUnmounted(() => {
  clearInterval(fetchBusesInterval.value);
});

watch(selectedRoutes, () => {
  updateBusMarkers();
  displaySelectedRoutes();
  displayStationsOnSelectedRoutes();
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
  filter: invert(1) saturate(0%) contrast(60%) brightness(80%)
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

.map-container {
  height: 100vh;
  width: 100vw;
  position: relative;
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
