<template>
  <div class="dropdown-inputs">
    <VueMultiselect
      v-if="!initialLoading"
      v-model="selectedRoute"
      class="dropdown"
      :options="activeRoutes"
      track-by="route_id"
      label="route_number"
      placeholder="Select route"
      :show-labels="false"
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
        :selected-trip-id="selectedTrip?.id"
        :selected-bus="selectedBus"
        @bus-click="selectBus"
        @loading-buses="onLoadingBuses"
        @loaded-buses="onLoadedBuses"
      />
      <StationMarkers
        :visible="store.isInStationsMode && (!selectedRoute && !selectedTrip)"
        :location="{ lat: mapConfig.center[0], lng: mapConfig.center[1] }"
        :selected-station="selectedStation"
        @station-click="selectStation"
        @loaded-stations="onLoadedStations"
      />
      <RouteStationMarkers
        v-if="selectedRoute"
        :selected-route="selectedRoute"
        :selected-trip-id="selectedTrip?.id"
        :selected-station="selectedStation"
        @station-click="selectStation"
      />
      <RouteShapes
        v-if="selectedRoute"
        :selected-route="selectedRoute"
        :selected-trip-id="selectedTrip?.id"
        @loading="loadingRouteShapes = true"
        @loaded="loadingRouteShapes = false"
      />
      <UserLocationMarker v-if="userLocation" :location="userLocation" />
    </LMap>

    <div v-if="!initialLoading" class="control-buttons">
      <ModeToggleButton :disabled="!!selectedRoute" />
      <ThemeToggleButton />
      <UserLocationButton :active="isMapFocusedOnUser" @click="getUserLocation" />
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, Ref } from 'vue'

import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'

import VueMultiselect from 'vue-multiselect'
import { useToast } from 'vue-toastification'

import BusMarkers from '@/components/map-layers/BusMarkers.vue'

import StationMarkers from '@/components/map-layers/StationMarkers.vue'
import RouteShapes from '@/components/map-layers/RouteShapes.vue'
import LoadingIndicator from '@/components/animations/LoadingIndicator.vue'
import BusLoadingIndicator from '@/components/animations/BusLoadingIndicator.vue'
import BusInfoCard from '@/components/cards/BusInfoCard.vue'
import StationInfoCard from '@/components/cards/StationInfoCard.vue'
import ThemeToggleButton from '@/components/controls/ThemeToggleButton.vue'
import ModeToggleButton from '@/components/controls/ModeToggleButton.vue'
import UserLocationButton from '@/components/controls/UserLocationButton.vue'
import UserLocationMarker from '@/components/map-layers/UserLocationMarker.vue'

import { usePreferencesStore } from '@/stores/preferences'
import { useGeolocation } from '@/composables/geolocation'
import RouteStationMarkers from '@/components/map-layers/RouteStationMarkers.vue'
import { getActiveRoutes } from '@/api'
import { Bus, Station } from '@/api/types'
import { RouteWithTrips, Trip, Location, StationOnTrip } from '@/types'

const store = usePreferencesStore()

const ljubljanaCenter: Location = { lat: 46.0577, lng: 14.5057 }

const mapConfig = ref({
    zoom: 15,
    center: [ljubljanaCenter.lat, ljubljanaCenter.lng],
    minZoom: 12,
    maxZoom: 18,
    zoomAnimation: true,
    markerZoomAnimation: true,
    options: {
        zoomControl: false,
    },
})

// const tilesUrl = `${import.meta.env.VITE_TILESERVER_URL}styles/basic-preview/{z}/{x}/{y}.png?`
const tilesUrl = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'

const activeRoutes: Ref<RouteWithTrips[]> = ref([])
const selectedRoute: Ref<RouteWithTrips | undefined> = ref(undefined)
const selectedTrip: Ref<Trip | undefined> = ref(undefined)
const loadingBuses = ref(false)
const loadingRouteShapes = ref(false)
const loadingActiveRoutes = ref(true)
const selectedBus: Ref<Bus | undefined> = ref(undefined)
const selectedStation: Ref<Station | StationOnTrip | undefined> = ref(undefined)
const map = ref(null)
const requestingLocation = ref(false)
const initialLoading = ref(true)

let leafletTilePane: HTMLElement | null

const { userLocation, loadingUserLocation, userLocationError } = useGeolocation(requestingLocation)
const toast = useToast()

const mapContainerClass = computed(() => {
    return initialLoading.value ? 'loading-map' : ''
})

const isMapFocusedOnUser = computed(() => {
    if (!userLocation.value) return false
    const [mapCenterLat, mapCenterLng] = mapConfig.value.center

    // we have to round the coordinates because mapConfig.center is more precise than user location
    return mapCenterLat.toFixed(3) === userLocation.value.lat.toFixed(3)
    && mapCenterLng.toFixed(3) === userLocation.value.lng.toFixed(3)
})

async function fetchActiveRoutes() {
    try {
        const response = await getActiveRoutes()
        const fetchedRoutes = response.data
        const routes: RouteWithTrips[] = []

        fetchedRoutes.forEach((route) => {
            const trip = {
                id: route.trip_id,
                name: route.short_route_name,
            }

            if (routes.length > 0 && routes[routes.length - 1].route_id === route.route_id) {
                routes[routes.length - 1].trips.push(trip)
            } else {
                routes.push({ ...route, trips: [trip] })
            }
        })

        activeRoutes.value = routes
        loadingActiveRoutes.value = false
    } catch {
        toast.error('Error fetching bus routes')
        loadingActiveRoutes.value = false
    }
}

function selectBus(bus: Bus) {
    selectedBus.value = bus
    mapConfig.value.center = [bus.latitude, bus.longitude]
}

function unselectBus() {
    selectedBus.value = undefined
}

function selectStation(station: Station) {
    selectedStation.value = station
    mapConfig.value.center = [station.latitude, station.longitude]
}

function unselectStation() {
    selectedStation.value = undefined
}

function updateMapTheme() {
    if (leafletTilePane) {
        if (store.darkTheme) {
            leafletTilePane.classList.add('dark-map-tiles')
        } else {
            leafletTilePane.classList.remove('dark-map-tiles')
        }
    }
}

function initTilePane() {
    leafletTilePane = document.querySelector('.leaflet-tile-pane')
    updateMapTheme()
}

function onMapMove(newCenter: Location) {
    mapConfig.value.center = [newCenter.lat, newCenter.lng]
}

function onSelectedRouteToggle(routeNumber: string) {
    if (selectedRoute.value?.route_number === routeNumber) {
        selectedRoute.value = undefined
        return
    }
    const newSelectedRoute = activeRoutes.value.find((route) => route.route_number === routeNumber)
    if (newSelectedRoute) {
        selectedRoute.value = newSelectedRoute
    }
}

function focusMapOnUserLocation() {
    if (!userLocation.value) return
    const { lat, lng } = userLocation.value

    mapConfig.value.center = [lat, lng]
}

function getUserLocation() {
    if (userLocation.value) {
        focusMapOnUserLocation()
        return
    }

    if (userLocationError.value && userLocationError.value.code === 1) {
        toast.info('To display your location on the map you must allow the browser to use your location')
        userLocation.value = null
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
    selectedTrip.value = undefined
}

function clearSelectedRoute() {
    selectedTrip.value = undefined
    selectedRoute.value = undefined
}

function onLoadedStations() {
    if (store.isInStationsMode) initialLoading.value = false
}

onMounted(() => {
    fetchActiveRoutes()
})

watch(selectedRoute, (newSelectedRoute) => {
    selectedTrip.value = undefined

    if (selectedBus.value
     && (!newSelectedRoute || (selectedBus.value.route_number !== newSelectedRoute.route_number))) {
        selectedBus.value = undefined
    }
})

watch(() => store.darkTheme, updateMapTheme)

watch(() => store.isInStationsMode, (isInStationsMode) => {
    if (isInStationsMode) selectedBus.value = undefined
})

watch(userLocation, (newUserLocation, oldUserLocation) => {
    if (newUserLocation && oldUserLocation === null) {
        const { lat, lng } = newUserLocation
        mapConfig.value.center = [lat, lng]
    }
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
