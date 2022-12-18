<template>
  <LMarker
    :lat-lng="[location.lat, location.lng]"
    :icon="getMarkerIcon()"
    :z-index-offset="10000"
  />
</template>

<script setup>
import { computed } from 'vue'
import { LMarker } from '@vue-leaflet/vue-leaflet'
import leaflet from 'leaflet'

const props = defineProps({
  location: {
    type: Object,
    required: true,
  },
})

const location = computed(() => props.location)

function getMarkerIcon() {
  const markerSize = 25

  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
       <defs>
          <linearGradient id="myGradient" gradientTransform="rotate(90)">
            <stop offset="0%" stop-color="blue">
                <animate attributeName="stop-color" values="#7A5FFF; #01FF89; #7A5FFF" dur="4s" repeatCount="indefinite"></animate>
            </stop>
            <stop offset="100%" stop-color="#01FF89">
                <animate attributeName="stop-color" values="#01FF89; #7A5FFF; #01FF89" dur="4s" repeatCount="indefinite"></animate>
            </stop>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url('#myGradient')" />
       </svg>`

  const icon = leaflet.divIcon({
    className: 'user-marker',
    html: svg,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  })

  return icon
}
</script>

<style>

.user-marker {
  box-shadow: 0px 0px 3px 3px rgba(0, 0, 0, 0.2);
  border-radius: 50%;
}

.user-marker svg {
  filter: saturate(200%);
  animation: pulse 3s infinite ease-out;
  border-radius: 50%;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(187, 201, 242);
    transform: scale(1)
  }
  50% {
    box-shadow: 0 0 0 20px rgba(124, 255, 168, 0);
    transform: scale(1.05)
  }
  100% {
    box-shadow: 0 0 0 30px rgba(255, 255, 255, 0);
    transform: scale(1)
  }
}

</style>
