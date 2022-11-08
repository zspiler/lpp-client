<template>
  <div class="map-container">
    <VueMultiselect
      class="route-select"
      v-model="selectedRoutes"
      :options="activeRoutes"
      :multiple="true"
      placeholder="Select routes to display"
      select-label=""
    />
    <BusInfoCard
      v-if="selectedBus"
      class="info-card"
      :color="getRouteColor(selectedBus.route_number)"
      :bus="selectedBus"
    />
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
      selectedBus: null,
      loading: true,
      map: null,
      activeRoutes: [],
      buses: {},
      fetchInterval: null,
      selectedRoutes: [],
      markersLayerGroup: null,
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
      this.map = map;
    },
    async fetchActiveRoutes() {
      try {
        const res = await axios.get('route/active-routes');
        const routeNumbers = res.data.data.map((route) => route.route_number);
        this.activeRoutes = [...new Set(routeNumbers)];
        this.fetchBuses();
        this.fetchInterval = setInterval(this.fetchBuses, 5000);
      } catch (error) {
        console.log(error);
      }
    },
    fetchBuses() {
      const requests = this.activeRoutes.reduce((accumulator, route) => {
        if (this.selectedRoutes.length === 0 || this.selectedRoutes.includes(route)) {
          accumulator.push(axios.get(`bus/buses-on-route?route-group-number=${route}&specific=1`));
        }
        return accumulator;
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
        console.log(errors);
      });
    },
    refreshMap() {
      // clear old marker layer
      if (this.markersLayerGroup) {
        this.map.removeLayer(this.markersLayerGroup);
      }

      // create new markers
      const markers = [];
      for (const busId in this.buses) {
        const routeNumber = this.buses[busId].route_number;
        if (this.selectedRoutes.length === 0 || this.selectedRoutes.includes(routeNumber)) {
          const busMarker = this.createBusMarker(this.buses[busId]);
          markers.push(busMarker);
        }
      }

      // create marker layer
      this.markersLayerGroup = leaflet.featureGroup(markers).on('click', (e) => {
        const clickedMarker = e.layer;
        this.showBusInfo(clickedMarker.data);
      })
        .on('mouseover', (e) => {
          const marker = e.layer;
          marker.valueOf()._icon.style.backgroundColor = 'white';
        }).on('mouseout', (e) => {
          const marker = e.layer;
          marker.valueOf()._icon.style.backgroundColor = 'rgba(32, 32, 32, 0.5)';
        })
        .addTo(this.map);
    },
    showBusInfo(bus) {
      this.selectedBus = bus;
      this.map.setView([bus.latitude, bus.longitude]);
    },
    getRouteColor(routeNumber) {
      return colors[this.activeRoutes.indexOf(routeNumber)];
    },
    createBusMarker(bus) {
      const routeColor = this.getRouteColor(bus.route_number);

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
          iconRotationAngle,
          icon,
          riseOnHover: true,
        },
      );
      marker.data = bus;

      // TODO: tooltip breaking zoom
      // marker.bindTooltip(
      //   `<b>${bus.route_number}</b><br>'${bus.cardinal_direction}'<br>${bus.destination}<br>`,
      //   {
      //     direction: 'right',
      //     sticky: true,
      //     offset: [10, 0],
      //     opacity: 0.9,
      //   },
      // );

      return marker;
    },
    showAllRoutes() {
      this.selectedRoute = null;
      this.refreshMap();
    },
  },
  watch: {
    selectedRoutes() {
      this.refreshMap();
    },
  },
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style>
.bus-icon {
  background-color: rgba(32, 32, 32, 0.5);
  border-radius: 50%;
  height: 40px;
  width: 40px;
  opacity: 0.98;
}

.leaflet-tooltip-content-wrapper {
  background-color: black;
  color: white;
  font-size: 14;
}
</style>

<style scoped>
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
