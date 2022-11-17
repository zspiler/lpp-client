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
      routeShapes: {},
      routeColors: {},
      activeRoutes: [],
      buses: {},
      stations: {},
      fetchBusesInterval: null,
      selectedRoutes: [],
      selectedBus: null,
      busMarkerLayerGroup: null,
      stationMarkerLayerGroup: null,
      routeLayerGroup: null,
      loading: true,
    };
  },
  mounted() {
    this.initializeMap();
    this.fetchActiveRoutes();
  },
  unmounted() {
    clearInterval(this.fetchBusesInterval);
  },
  methods: {
    initializeMap() {
      const map = leaflet.map('map').setView([46.0577, 14.5057], 14);

      leaflet.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        minZoom: 12,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
      }).addTo(map);

      this.routeLayerGroup = new leaflet.LayerGroup();
      this.routeLayerGroup.addTo(map);

      this.map = map;
    },
    async displayStationsOnSelectedRoutes() {
      const routes = this.selectedRoutes.filter(
        (route) => !(route.route_number in this.stations),
      );
      const requests = routes.map((route) => axios.get(`route/stations-on-route?trip-id=${route.trip_id}`));

      // get not yet fetched stations
      Promise.all(requests).then((responses) => {
        responses.forEach((res, index) => {
          const stations = res.data.data;
          const route = routes[index];
          this.stations[route.route_number] = stations; // cache stations
        });

        // clear station marker layer
        if (this.stationMarkerLayerGroup) {
          this.map.removeLayer(this.stationMarkerLayerGroup);
        }

        // create new markers
        const stationMarkers = [];
        this.selectedRoutes.forEach((route) => {
          this.stations[route.route_number].forEach((station) => {
            const newStationMarker = this.createStationMarker(route, station);
            stationMarkers.push(newStationMarker);
          });
        });

        // (re)create station marker layer group
        this.stationMarkerLayerGroup = leaflet.featureGroup(stationMarkers).addTo(this.map);
      });
    },
    async displaySelectedRoutes() {
      if (this.selectedRoutes.length === 0) {
        this.routeLayerGroup.clearLayers();
        return;
      }

      const requests = this.selectedRoutes.reduce((prevRequests, route) => {
        if (!(route.route_number in this.routeShapes)) {
          prevRequests.push(axios.get(`route/routes?route-id=${route.route_id}&shape=1`));
        }
        return prevRequests;
      }, []);

      Promise.all(requests).then((responses) => {
        responses.forEach((res) => {
          const routeNumber = res.data.data[0].route_number;
          const routeShape = res.data.data[0].geojson_shape;
          const routeGeoJSONLayer = leaflet.geoJSON(
            routeShape,
            {
              style: {
                color: this.routeColors[routeNumber],
                opacity: 0.65,
              },
            },
          );
          this.routeShapes[routeNumber] = routeGeoJSONLayer; // cache route GeoJSON
        });

        // (re)create route shape layers
        this.routeLayerGroup.clearLayers();
        this.selectedRoutes.forEach((selectedRoute) => {
          const routeShapeLayer = this.routeShapes[selectedRoute.route_number];
          this.routeLayerGroup.addLayer(routeShapeLayer.addTo(this.map));
        });
      }).catch((errors) => {
        // TODO: handle errors
        console.log(errors);
      });
    },
    async fetchActiveRoutes() {
      try {
        const res = await axios.get('route/active-routes');
        const data = res.data.data;
        const routes = [];
        data.forEach((route, index) => {
          if (routes.length === 0 || routes[routes.length - 1].route_id !== route.route_id) {
            routes.push(route);
            this.routeColors[route.route_number] = colors[index] || '#aaaaaa';
          }
        });
        this.activeRoutes = routes;
        this.fetchBuses();
        this.fetchBusesInterval = setInterval(this.fetchBuses, 5000);
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
          const busData = res.data.data;
          busData.forEach((bus) => {
            this.buses[bus.bus_name] = bus;
          });
        });
        this.loading = false;
        this.updateBusMarkers();
      }).catch((errors) => {
        // TODO: handle errors
        this.loading = false;
        console.log(errors);
      });
    },
    updateBusMarkers() {
      // clear bus marker layer
      if (this.busMarkerLayerGroup) {
        this.map.removeLayer(this.busMarkerLayerGroup);
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

      // (re)create bus marker layer group
      this.busMarkerLayerGroup = leaflet.featureGroup(markers).on('click', (e) => {
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
    createStationMarker(route, station) {
      const marker = leaflet.circle(
        [station.latitude, station.longitude],
        {
          color: this.routeColors[route.route_number],
          opacity: 0.8,
          radius: 25,
        },
      );
      return marker;
    },
    showAllRoutes() {
      this.selectedRoute = null;
      this.updateBusMarkers();
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
      this.updateBusMarkers();
      this.displaySelectedRoutes();
      this.displayStationsOnSelectedRoutes();
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
