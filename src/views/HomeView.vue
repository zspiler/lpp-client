<template>
  <div class="map-container">
    <VueMultiselect
      class="route-select"
      v-model="selectedRoutes"
      :options="activeRoutes"
      :multiple="true"
      placeholder="Select routes to display"
    />
    <div id="map" />
    <LoadingIndicator :loading="loading" />

  </div>
</template>


<script>
import leaflet from 'leaflet';
import 'leaflet-rotatedmarker';

import VueMultiselect from 'vue-multiselect';
import LoadingIndicator from '../components/LoadingIndicator.vue';

import axios from '../axios/index';
import colors from '../colors';

import { busIcon, busIconMirrored } from '../assets/icons/svgIcons';

export default {
  name: 'HomeView',
  components: {
    VueMultiselect,
    LoadingIndicator,
  },
  data() {
    return {
      loading: true,
      map: null,
      markers: [],
      activeRoutes: [],
      buses: {},
      fetchInterval: null,
      selectedRoutes: [],
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
    stopFetching() {
      clearInterval(this.fetchInterval);
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
      const requests = this.activeRoutes.reduce((prevRequests, route) => {
        if (this.selectedRoutes.length === 0 || this.selectedRoutes.includes(route)) {
          prevRequests.push(axios.get(`bus/buses-on-route?route-group-number=${route}&specific=1`));
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
        console.log(errors);
      });
    },
    refreshMap() {
      for (let i = 0; i < this.markers.length; i++) {
        this.map.removeLayer(this.markers[i]);
      }

      for (const busId in this.buses) {
        const routeNumber = this.buses[busId].route_number;
        if (this.selectedRoutes.length === 0 || this.selectedRoutes.includes(routeNumber)) {
          const busMarker = this.createBusMarker(this.buses[busId]);
          busMarker.addTo(this.map);
          this.markers.push(busMarker);
        }
      }
    },
    createBusMarker(bus) {
      const routeColor = colors[this.activeRoutes.indexOf(bus.route_number)];

      const markerIconSize = 40;
      const svgIcon = bus.cardinal_direction >= 0 && bus.cardinal_direction <= 180 ? busIconMirrored : busIcon;
      const divIcon = leaflet.divIcon({
        className: 'bus-icon',
        html: leaflet.Util.template(svgIcon, { color: routeColor }),
        iconSize: [markerIconSize, markerIconSize],
        iconAnchor: [markerIconSize / 2, markerIconSize / 2],
      });

      const rotationAngle = bus.cardinal_direction >= 0 && bus.cardinal_direction <= 180 ? bus.cardinal_direction + 90 + 180 : bus.cardinal_direction + 90; // rotated 90 by default
      const marker = leaflet.marker(
        [bus.latitude, bus.longitude],
        {
          rotationAngle,
          icon: divIcon,
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
      console.log('refreshing map!');
      this.refreshMap();
    },
  },
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style>

.bus-icon {
  background-color: rgb(32, 32, 32, 0.4);
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

.route-select {
  position: absolute;
  top: 5%;
}

#map {
  height: 100vh;
  width: 100vw;
}

.route-select {
  z-index: 9999;
  text-align: center;
  width: 400px;
  left: 50%;
  margin-left: -200px;
}
</style>
