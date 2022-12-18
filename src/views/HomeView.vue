<template>
  <div class="container">
    <div class="dropdown-inputs">
      <VueMultiselect
        v-if="!initialLoading"
        v-model="selectedRoute"
        class="dropdown"
        :options="activeRoutes"
        track-by="route_id"
        label="route_number"
        placeholder="Select route"
        select-label=""
      >
        <template #clear>
          <button v-if="selectedRoute" class="multiselect__clear" @click="clearSelectedRoute" />
        </template>
      </VueMultiselect>
      <Transition name="fade">
        <VueMultiselect
          v-if="!initialLoading && selectedRoute"
          v-model="selectedTrip"
          class="dropdown"
          :options="selectedRoute.trips"
          track-by="id"
          label="name"
          placeholder="Select trip"
          select-label=""
        >
          <template #clear>
            <button v-if="selectedTrip" class="multiselect__clear" @click="clearSelectedTrip" />
          </template>
        </VueMultiselect>
      </Transition>
    </div>

    <div class="map-container" :class="mapContainerClass">
      <LMap
        v-bind="mapConfig"
        ref="map"
        @ready="initTilePane"
        @update:center="onMapMove"
      >
        <LTileLayer :url="tilesUrl" />
        <BusMarkers
          v-if="activeRoutes.length > 0"
          :visible="(!store.isInStationsMode || !!selectedRoute)"
          :active-routes="activeRoutes"
          :selected-route="selectedRoute"
          :selected-trip="selectedTrip"
          :selected-bus="selectedBus"
          @bus-click="selectBus"
          @loading-buses="onLoadingBuses"
          @loaded-buses="onLoadedBuses"
        />
        <StationMarkers
          :visible="store.isInStationsMode && (!selectedRoute && !selectedTrip)"
          :location="mapCenter"
          :selected-station="selectedStation"
          @station-click="selectStation"
          @loaded-stations="onLoadedStations"
        />
        <RouteStationMarkers
          v-if="selectedRoute"
          :selected-route="selectedRoute"
          :selected-trip="selectedTrip"
          :selected-station="selectedStation"
          @station-click="selectStation"
        />
        <RouteShapes
          v-if="selectedRoute"
          :selected-route="selectedRoute"
          :selected-trip="selectedTrip"
          @loading="loadingRouteShapes = true"
          @loaded="loadingRouteShapes = false"
        />
        <UserLocationMarker v-if="userLocation" :location="userLocation" />
      </LMap>

      <div v-if="!initialLoading" class="control-buttons">
        <ModeToggleButton :disabled="!!selectedRoute" />
        <ThemeToggleButton />
        <UserLocationButton :active="!!userLocation" @click="getUserLocation" />
      </div>

      <Transition name="slide">
        <StationInfoCard
          v-if="selectedStation"
          class="station-info-card"
          :station="selectedStation"
          :selected-route="selectedRoute"
          @close="unselectStation"
          @toggle-selected-route="onSelectedRouteToggle"
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
    <LoadingIndicator :loading="loadingRouteShapes || loadingUserLocation || loadingBuses" delayed fixed />
  </div>
</template>

<script setup>
import {
  ref, onMounted, computed, watch,
} from 'vue'

import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'

import VueMultiselect from 'vue-multiselect'
import { useToast } from 'vue-toastification'

import axios from '../axios/index'

import BusMarkers from '../components/map-layers/BusMarkers.vue'
import RouteStationMarkers from '../components/map-layers/RouteStationMarkers.vue'
import StationMarkers from '../components/map-layers/StationMarkers.vue'
import RouteShapes from '../components/map-layers/RouteShapes.vue'
import LoadingIndicator from '../components/animations/LoadingIndicator.vue'
import BusLoadingIndicator from '../components/animations/BusLoadingIndicator.vue'
import BusInfoCard from '../components/cards/BusInfoCard.vue'
import StationInfoCard from '../components/cards/StationInfoCard.vue'
import ThemeToggleButton from '../components/controls/ThemeToggleButton.vue'
import ModeToggleButton from '../components/controls/ModeToggleButton.vue'
import UserLocationButton from '../components/controls/UserLocationButton.vue'
import UserLocationMarker from '../components/map-layers/UserLocationMarker.vue'

import { usePreferencesStore } from '../stores/preferences'
import { useGeolocation } from '../composables/geolocation'

const store = usePreferencesStore()

const ljubljanaCenter = { lat: 46.0577, lng: 14.5057 }

const mapConfig = ref({
  zoom: 15,
  center: [ljubljanaCenter.lat, ljubljanaCenter.lng],
  minZoom: 12,
  maxZoom: 18,
  options: {
    zoomSnap: 1,
    zoomControl: false,
  },
})

const tilesUrl = `${import.meta.env.VITE_TILESERVER_URL}styles/klokantech-basic/{z}/{x}/{y}.png?`

const activeRoutes = ref([])
const selectedRoute = ref(null)
const selectedTrip = ref(null)
const loadingBuses = ref(false)
const loadingRouteShapes = ref(false)
const loadingActiveRoutes = ref(true)
const selectedBus = ref(null)
const selectedStation = ref(null)
const mapCenter = ref(ljubljanaCenter)
const map = ref(null)
const requestingLocation = ref(false)
const initialLoading = ref(true)

let leafletTilePane

const { userLocation, loadingUserLocation, userLocationError } = useGeolocation(requestingLocation)
const toast = useToast()

const mapContainerClass = computed(() => {
  return initialLoading.value ? 'loading-map' : ''
})

async function fetchActiveRoutes() {
  try {
    const res = await axios.get('route/active-routes')
    const fetchedRoutes = res.data.data
    const routes = []

    fetchedRoutes.forEach((route) => {
      const previousRoute = routes[routes.length - 1]

      const trip = {
        id: route.trip_id,
        name: route.route_name,
        shortName: route.short_route_name,
      }

      if (routes.length > 0 && previousRoute.route_id === route.route_id) {
        previousRoute.trips.push(trip)
      } else {
        routes.push({
          route_id: route.route_id,
          route_name: route.route_name,
          route_number: route.route_number,
          short_route_name: route.short_route_name,
          trips: [trip],
        })
      }
    })
    activeRoutes.value = routes
    loadingActiveRoutes.value = false
  } catch {
    toast.error('Error fetching bus routes')
    loadingActiveRoutes.value = false
  }
}

function selectBus(bus) {
  selectedBus.value = bus
  mapConfig.value.center = [bus.latitude, bus.longitude]
}

function unselectBus() {
  selectedBus.value = null
}

function selectStation(station) {
  const stationsTrip = selectedRoute.value?.trips.find((trip) => trip.id === station.tripId)
  selectedStation.value = station
  selectedStation.value.trip = stationsTrip
  mapConfig.value.center = [station.latitude, station.longitude]
}

function unselectStation() {
  selectedStation.value = null
}

function updateMapTheme() {
  if (store.darkTheme) {
    leafletTilePane.classList.add('dark-map-tiles')
  } else {
    leafletTilePane.classList.remove('dark-map-tiles')
  }
}

function initTilePane() {
  leafletTilePane = document.querySelector('.leaflet-tile-pane')
  updateMapTheme()
}

function onMapMove(newCenter) {
  mapCenter.value = newCenter
}

function onSelectedRouteToggle(routeNumber) {
  if (selectedRoute.value?.route_number === routeNumber) {
    selectedRoute.value = null
    return
  }
  const newSelectedRoute = activeRoutes.value.find((route) => route.route_number === routeNumber)
  if (newSelectedRoute) {
    selectedRoute.value = newSelectedRoute
  }
}

function focusMapOnUserLocation() {
  const { lat, lng } = userLocation.value
  const [currentMapLat, currentMapLng] = mapConfig.value.center
  if (currentMapLat === lat && currentMapLng === lng) {
    // force pan by adding random noise
    const randomDiff = (Math.random() - 0.5) / 1000000
    mapConfig.value.center = [currentMapLat + randomDiff, currentMapLng + randomDiff]
  } else {
    mapConfig.value.center = [lat, lng]
  }
}

function getUserLocation() {
  if (userLocation.value) {
    focusMapOnUserLocation()
    return
  }

  if (userLocationError.value && userLocationError.value.code === 1) {
    toast.info('To display your location on the map you must allow the browser to use your location')
    userLocation.value = undefined
  }

  requestingLocation.value = true
}

function onLoadingBuses() {
  if (!initialLoading.value && !store.isInStationsMode) loadingBuses.value = true
}

function onLoadedBuses() {
  if (!store.isInStationsMode) initialLoading.value = false
  loadingBuses.value = false
}

function clearSelectedTrip() {
  selectedTrip.value = null
}

function clearSelectedRoute() {
  selectedTrip.value = null
  selectedRoute.value = null
}

function onLoadedStations() {
  if (store.isInStationsMode) initialLoading.value = false
}

onMounted(() => {
  fetchActiveRoutes()
})

watch(selectedRoute, (newSelectedRoute) => {
  selectedTrip.value = null

  if (selectedBus.value
  && (!newSelectedRoute || (selectedBus.value.route_number !== newSelectedRoute.route_number))) {
    selectedBus.value = null
  }
})

watch(() => store.darkTheme, updateMapTheme)

watch(() => store.isInStationsMode, (isInStationsMode) => {
  if (isInStationsMode) selectedBus.value = null
})

watch(userLocation, (newUserLocation) => {
  const { lat, lng } = newUserLocation
  mapConfig.value.center = [lat, lng]
})

</script>

<style>
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

.control-buttons {
  position: absolute;
  display: flex;
  gap: 15px;
  flex-direction: column;
  bottom: 5%;
  right: 2%;
  margin-left: -175px;
  z-index: 10000;
}
</style>
