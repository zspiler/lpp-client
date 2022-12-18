<template>
  <LGeoJson
    v-for="selectedRouteShape in selectedRouteShapes"
    :key="selectedRouteShape.tripId"
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
import { ref, watchEffect, computed } from 'vue'
import { LGeoJson } from '@vue-leaflet/vue-leaflet'
import { useToast } from 'vue-toastification'

import { routeColors } from '@/colors'
import axios from '@/axios/index'

const props = defineProps({
  selectedRoute: {
    type: Object,
    required: true,
  },
  selectedTrip: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['loading', 'loaded'])

const routeShapes = ref({})

const toast = useToast()

const selectedRouteShapes = computed(() => {
  const routeNumber = props.selectedRoute.route_number
  if (!(routeNumber in routeShapes.value)) return null

  const selectedTrips = Object.keys(routeShapes.value[routeNumber])
    .filter((tripId) => !props.selectedTrip || tripId === props.selectedTrip.id)

  return selectedTrips.map((tripId) => (
    {
      ...routeShapes.value[routeNumber][tripId],
      color: routeColors[routeNumber],
      tripId,
    }
  ))
})

async function fetchSelectedRoutesShape() {
  emit('loading')
  try {
    const res = await axios.get(`route/routes?route-id=${props.selectedRoute.route_id}&shape=1`)
    const data = res.data.data

    data.forEach((trip) => {
      const routeNumber = trip.route_number
      const tripId = trip.trip_id
      const routeShape = trip.geojson_shape

      if (!routeShape) return

      if (!(routeNumber in routeShapes.value)) {
        routeShapes.value[routeNumber] = {}
      }

      routeShapes.value[routeNumber][tripId] = routeShape
    })
    emit('loaded')
  } catch {
    toast.error('Error fetching route shape')
    emit('loaded')
  }
}

watchEffect(() => {
  if (props.selectedRoute.route_number in routeShapes.value) return
  fetchSelectedRoutesShape()
})

</script>
