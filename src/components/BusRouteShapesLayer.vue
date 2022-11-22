<template>
  <LGeoJson
    v-for="routeShape in selectedRouteShapes"
    :key="routeShape.routeNumber"
    :geojson="routeShape"
    :options="{
      style: {
        color: routeShape.color,
        opacity: 0.65,
      },
    }"
  />
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { LGeoJson } from '@vue-leaflet/vue-leaflet';

import { routeColors } from '../colors';
import axios from '../axios/index';

const props = defineProps({
  selectedRoutes: Array.of(Object),
});

const emit = defineEmits(['loading', 'loaded']);

const routeShapes = ref({});

const selectedRouteNumbers = computed(() => {
  return props.selectedRoutes.map((selectedRoute) => selectedRoute.route_number);
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

async function displaySelectedRoutes() {
  const requests = props.selectedRoutes.reduce((prevRequests, route) => {
    if (!(route.route_number in routeShapes.value)) {
      prevRequests.push(axios.get(`route/routes?route-id=${route.route_id}&shape=1`));
    }
    return prevRequests;
  }, []);

  if (requests.length === 0) {
    return;
  }

  emit('loading');
  Promise.all(requests).then((responses) => {
    responses.forEach((res) => {
      emit('loaded');
      const routeNumber = res.data.data[0].route_number;
      const routeShape = res.data.data[0].geojson_shape;
      routeShapes.value[routeNumber] = routeShape;
    });
  }).catch((errors) => {
    emit('loaded');
    // TODO: handle errors
    console.log(errors);
  });
}

watch(() => props.selectedRoutes, displaySelectedRoutes);
</script>
