<template>
  <div class="map-container">
    <VueMultiselect
      class="route-select"
      v-model="selectedRoutes"
      :options="activeRoutes"
      track-by="route_id"
      label="route_number"
      :multiple="true"
      placeholder="Select routes to display"
      select-label=""
    />
    <Transition name="bus-info-card">
      <BusInfoCard
        v-if="selectedBus"
        class="info-card"
        :color="routeColors[selectedBus.route_number]"
        :bus="selectedBus"
        @close="hideBusInfoCard"
      />
    </Transition>
    <div id="map" />
    <LoadingIndicator :loading="loading" />
  </div>
</template>

<script>
import leaflet from 'leaflet';
import 'leaflet-rotatedmarker';
import VueMultiselect from 'vue-multiselect';
import axios from '../axios/index';

import LoadingIndicator from '../components/LoadingIndicator.vue';
import BusInfoCard from '../components/BusInfoCard.vue';

import colors from '../colors';
import { busIcon, busIconMirrored } from '../assets/icons/svgIcons';

export default {
  name: 'HomeView',
  components: {
    VueMultiselect,
    LoadingIndicator,
    BusInfoCard,
  },
  data() {
    return {
      map: null,
      routeColors: {},
      activeRoutes: [],
      buses: {},
      fetchInterval: null,
      selectedRoutes: [],
      selectedBus: null,
      markersLayerGroup: null,
      routePathLayerGroup: null,
      displayedRoute: null,
      loading: true,
    };
  },
  mounted() {
    this.initializeMap();
    this.fetchActiveRoutes();
  },
  methods: {
    initializeMap() {
      const map = leaflet.map('map').setView([46.05772817637372, 14.505734444531713], 14);
      leaflet.tileLayer(
        'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
        {
          minZoom: 12,
          attribution: `&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">
                       OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors`,
        },
      ).addTo(map);

      this.routePathLayerGroup = new leaflet.LayerGroup();
      this.routePathLayerGroup.addTo(map);

      this.map = map;
    },
    async displayRoutePath(route) {
      try {
        const res = await axios.get(`route/routes?route-id=${route.route_id}&shape=1`);
        const routeShape = res.data.data[0].geojson_shape;
        this.routePathLayerGroup.addLayer(leaflet.geoJSON(routeShape).addTo(this.map));
        this.displayedRoute = route;
      } catch (error) {
        console.log(error);
      }
    },
    async fetchActiveRoutes() {
      try {
        const res = await axios.get('route/active-routes');
        const routes = [];
        res.data.data.forEach((route, index) => {
          if (routes.length === 0 || routes[routes.length - 1].route_id !== route.route_id) {
            routes.push({ route_number: route.route_number, route_id: route.route_id });
            this.routeColors[route.route_number] = colors[index] || '#aaaaaa';
          }
        });
        this.activeRoutes = routes;

        this.fetchBuses();
        this.fetchInterval = setInterval(this.fetchBuses, 5000);
      } catch (error) {
        this.loading = false;
        console.log(error);
      }
    },
    fetchBuses() {
      const requests = this.activeRoutes.reduce((prevRequests, route) => {
        if (this.selectedRoutes.length === 0 || this.selectedRouteIds.includes(route.route_id)) {
          prevRequests.push(axios.get(`bus/buses-on-route?route-group-number=${route.route_number}&specific=1`));
        }
        return prevRequests;
      }, []);

      Promise.all(requests).then((responses) => {
        responses.forEach((res) => {
          const data = res.data.data;
          data.forEach((bus) => {
            this.buses[bus.bus_name] = bus;
          });
        });
        this.loading = false;
        this.refreshMap();
      }).catch((errors) => {
        // TODO: handle errors
        this.loading = false;
        console.log(errors);
      });
    },
    refreshMap() {
      this.updateRoutePaths();
      this.updateBusMarkers();
    },
    updateRoutePaths() {
      if (this.selectedRoutes.length === 1 && this.displayedRoute === null) {
        this.routePathLayerGroup.clearLayers();
        this.displayRoutePath(this.selectedRoutes[0]);
      }
      if (this.selectedRoutes.length !== 1 && this.displayedRoute !== null) {
        this.routePathLayerGroup.clearLayers();
        this.displayedRoute = null;
      }
    },
    updateBusMarkers() {
      // clear bus marker layer
      if (this.markersLayerGroup) {
        this.map.removeLayer(this.markersLayerGroup);
      }

      // create new bus markers
      const markers = [];
      for (const busId in this.buses) {
        const routeId = this.buses[busId].route_id;
        if (this.selectedRoutes.length === 0 || this.selectedRouteIds.includes(routeId)) {
          const busMarker = this.createBusMarker(this.buses[busId]);
          markers.push(busMarker);
        }
      }

      // create bus marker layer
      this.markersLayerGroup = leaflet.featureGroup(markers).on('click', (e) => {
        const clickedMarker = e.layer;
        this.showBusInfoCard(clickedMarker.data);
      })
        .on('mouseover', (e) => {
          const marker = e.layer;
          marker.valueOf()._icon.style.background = 'white';
          marker.valueOf()._icon.style.filter = 'drop-shadow(0px 0px 10px #ffffff)';
        }).on('mouseout', (e) => {
          const marker = e.layer;
          marker.valueOf()._icon.style.background = 'none';
          marker.valueOf()._icon.style.filter = 'drop-shadow(0px 0px 10px #000000)';
        })
        .addTo(this.map);
    },
    showBusInfoCard(bus) {
      this.selectedBus = bus;
      this.map.setView([bus.latitude, bus.longitude]);
    },
    hideBusInfoCard() {
      this.selectedBus = null;
    },
    createBusMarker(bus) {
      const routeColor = this.routeColors[bus.route_number];

      const markerIconSize = 40;
      const svgIcon = bus.cardinal_direction >= 0 && bus.cardinal_direction <= 180 ? busIconMirrored : busIcon;
      const icon = leaflet.divIcon({
        className: 'bus-icon',
        html: leaflet.Util.template(svgIcon, { color: routeColor }),
        iconSize: [markerIconSize, markerIconSize],
        iconAnchor: [markerIconSize / 2, markerIconSize / 2],
      });

      let iconRotationAngle = bus.cardinal_direction + 90;
      if (bus.cardinal_direction >= 0 && bus.cardinal_direction <= 180) {
        iconRotationAngle += 180;
      }

      const marker = leaflet.marker(
        [bus.latitude, bus.longitude],
        {
          rotationAngle: iconRotationAngle,
          icon,
          riseOnHover: true,
        },
      );
      marker.data = bus;
      return marker;
    },
    showAllRoutes() {
      this.selectedRoute = null;
      this.refreshMap();
    },
    updateSelectedBus() {
      if (this.selectedBus) {
        const selectedBusIsOnASelectedRoute = this.selectedRoutes.find(
          (selectedRoute) => selectedRoute.route_id === this.selectedBus.route_id,
        );
        if (!selectedBusIsOnASelectedRoute) {
          this.selectedBus = null;
        }
      }
    },
  },
  computed: {
    selectedRouteIds() {
      return this.selectedRoutes.map((selectedRoute) => selectedRoute.route_id);
    },
  },
  watch: {
    selectedRoutes() {
      this.refreshMap();
      this.updateSelectedBus();
    },
  },
};
</script>

<style>
.bus-icon {
  filter: drop-shadow(0px 0px 10px #000000);
  border-radius: 50%;
  height: 40px;
  width: 40px;
  opacity: 0.98;
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
