<template>
  <LGeoJson
    v-if="selectedRouteShape"
    :key="selectedRouteShape.routeNumber"
    :geojson="selectedRouteShape"
    :options="{
      style: {
        color: selectedRouteShape.color,
        opacity: 0.4,
        weight: 3,
      },
    }"
  />
</template>

<script setup>
import { ref, watchEffect, computed } from 'vue';
import { LGeoJson } from '@vue-leaflet/vue-leaflet';

import { routeColors } from '../colors';
import axios from '../axios/index';

const props = defineProps({
  selectedRoute: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['loading', 'loaded']);

const routeShapes = ref({});

const selectedRouteShape = computed(() => {
  const routeNumber = props.selectedRoute.route_number;
  if (!(routeNumber in routeShapes.value)) return null;
  const routeShape = routeShapes.value[routeNumber];
  return {
    ...routeShape,
    color: routeColors[routeNumber],
    routeNumber,
  };
});

async function fetchSelectedRoutesShape() {
  if (props.selectedRoute.route_number in routeShapes.value) return;
  emit('loading');
  try {
    const res = await axios.get(`route/routes?route-id=${props.selectedRoute.route_id}&shape=1`);
    const routeNumber = res.data.data[0].route_number;
    const routeShape = res.data.data[0].geojson_shape;
    routeShapes.value[routeNumber] = routeShape; // cache shape
    emit('loaded');
  } catch (error) {
    emit('loaded');
    // TODO: handle error
    console.log(error);
  }
}

watchEffect(fetchSelectedRoutesShape);

</script>
