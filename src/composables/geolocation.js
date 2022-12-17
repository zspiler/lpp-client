import {
  ref, onUnmounted, unref, watch,
} from 'vue';

export function useGeolocation(requestingLocation, geolocationOptions) {
  let handlerId;
  const userLocation = ref(undefined);
  const userLocationError = ref(null);
  const isUserLocationLoading = ref(false);

  const onSuccess = (position) => {
    isUserLocationLoading.value = false;
    const { latitude, longitude } = position.coords;
    userLocation.value = { lat: latitude, lng: longitude };
    userLocationError.value = null;
  };

  const onError = (error) => {
    isUserLocationLoading.value = false;
    userLocationError.value = error;
  };

  const options = unref(geolocationOptions) || {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 0,
  };

  watch(requestingLocation, () => {
    if (requestingLocation) {
      isUserLocationLoading.value = true;
      handlerId = navigator.geolocation.watchPosition(onSuccess, onError, options);
    }
  });

  onUnmounted(() => navigator.geolocation.clearWatch(handlerId));

  return { userLocation, userLocationError, isUserLocationLoading };
}