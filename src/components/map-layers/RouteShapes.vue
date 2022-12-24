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

<script setup lang="ts">
import { ref, watchEffect, computed } from 'vue'
import type { Ref } from 'vue'
import { LGeoJson } from '@vue-leaflet/vue-leaflet'
import { useToast } from 'vue-toastification'
import { GeoJsonObject } from 'geojson'

import { routeColors } from '@/colors'
import { getRouteShape } from '@/api/api'
import { Route } from '@/api/types'

type RouteShapesByRoute = {
  [routeNumber: string]: {
    [tripId: string]: GeoJsonObject
  };
}

interface Props {
  selectedRoute: Route,
  selectedTripId?: string,
}

const props = defineProps<Props>()

const emit = defineEmits(['loading', 'loaded'])

const routeShapes: Ref<RouteShapesByRoute> = ref({})

const toast = useToast()

const selectedRouteShapes = computed(() => {
  const routeNumber = props.selectedRoute.route_number
  if (!(routeNumber in routeShapes.value)) return null

  const selectedTrips = Object.keys(routeShapes.value[routeNumber])
    .filter((tripId) => !props.selectedTripId || tripId === props.selectedTripId)

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
    const response = await getRouteShape(props.selectedRoute.route_id)
    const routeShapeData = response.data

    routeShapeData.forEach((trip) => {
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
