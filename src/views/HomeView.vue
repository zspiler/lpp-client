<template>
  <div class="map-container">
    <VueMultiselect
      class="route-select"
      v-model="selectedRoutes"
      @input="console.log('nice')"
      :options="activeRoutes"
      :multiple="true"
      placeholder="Select routes to display"
    />
    <div id="map" />
  </div>
</template>

<script>
import leaflet from 'leaflet';
import VueMultiselect from 'vue-multiselect';

import axios from '../axios/index';
import colors from '../colors';

export default {
  name: 'HomeView',
  components: {
    VueMultiselect,
  },
  data() {
    return {
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
      const marker = leaflet.circle([bus.latitude, bus.longitude], {
        color: routeColor,
        fillColor: routeColor,
        fillOpacity: 0.8,
        radius: 30,
        weight: 1,
      });

      marker.data = bus;
      marker.bindTooltip(
        `<b>${bus.route_number}</b><br>'${bus.route_name}'<br>${bus.destination}<br>`,
        {
          direction: 'right',
          sticky: true,
          offset: [10, 0],
          opacity: 0.7,
        },
      );
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
.map-container {
  height: 100vh;
  width: 100vw;
  position: relative;
}

.route-select {
  position: absolute;
  top: 5%;
}
</style>

<style scoped>
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
