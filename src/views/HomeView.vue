<template>
  <button @click="stopFetching">Stop fetching data</button>

  <select v-model="selectedRoute" @change="refreshMap">
    <option v-for="route in activeRoutes" :key="route">{{ route }}</option>
  </select>
  <button :disabled="!selectedRoute" @click="showAllRoutes">Show all</button>
  <div id="map" />
</template>

<script>

import leaflet from 'leaflet';
import axios from '../axios/index';
import colors from '../colors';

export default {
  name: 'HomeView',
  data() {
    return {
      map: null,
      markers: [],
      activeRoutes: [],
      buses: {},
      fetchInterval: null,
      selectedRoute: null,
    };
  },
  mounted() {
    this.initializeMap();
    this.fetchActiveRoutes();
  },
  methods: {
    initializeMap() {
      this.map = leaflet.map('map').setView([46.05772817637372, 14.505734444531713], 13, { zoomAnimation: false });
      leaflet.tileLayer(
        'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
        {
          minZoom: 12,
          attribution: `&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">
                       OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors`,
        },
      ).addTo(this.map);
    },
    stopFetching() {
      console.log('clearing interval');
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
        // TODO: add multi select
        if (!this.selectedRoute || (this.selectedRoute && route === this.selectedRoute)) {
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

      let busMarker;
      for (const busId in this.buses) {
        if (!this.selectedRoute
            || (this.selectedRoute && this.buses[busId].route_number === this.selectedRoute)) {
          busMarker = this.createBusMarker(this.buses[busId]);
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
};
</script>

<style scoped>
#map {
  height: 100vh;
  width: 100vw;
}
</style>
