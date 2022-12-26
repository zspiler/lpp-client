import { ref, onUnmounted, unref, watch } from 'vue'
import type { Ref } from 'vue'
import { Location } from '@/types'

export function useGeolocation(requestingLocation: Ref<boolean>, geolocationOptions: PositionOptions) {
  let handlerId: number
  const userLocation: Ref<Location | null> = ref(null)
  const userLocationError: Ref<GeolocationPositionError | null> = ref(null)
  const loadingUserLocation = ref(false)

  const onSuccess = (position: GeolocationPosition) => {
    loadingUserLocation.value = false
    const { latitude, longitude } = position.coords
    userLocation.value = { lat: latitude, lng: longitude }
    userLocationError.value = null
  }

  const onError = (error: GeolocationPositionError) => {
    loadingUserLocation.value = false
    userLocationError.value = error
  }

  const options = unref(geolocationOptions) || {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 0,
  }

  watch(requestingLocation, () => {
    if (requestingLocation) {
      loadingUserLocation.value = true
      handlerId = navigator.geolocation.watchPosition(onSuccess, onError, options)
    }
  })

  onUnmounted(() => navigator.geolocation.clearWatch(handlerId))

  return { userLocation, userLocationError, loadingUserLocation }
}
