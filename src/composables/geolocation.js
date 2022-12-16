import {
  ref, onUnmounted, unref, watch,
} from 'vue';

export function useGeolocation(requestingLocation, geolocationOptions) {
  let handlerId;
  const userLocation = ref(null);
  const userLocationError = ref(null);

  const onSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    userLocation.value = { lat: latitude, lng: longitude };
  };

  const onError = (err) => {
    userLocationError.value = err.code;
    if (err.code === 1) {
      // user denied location
      userLocation.value = undefined;
      userLocationError.value = err.code;
    } else {
      // error getting location
    }
  };

  const options = unref(geolocationOptions) || {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 0,
  };

  watch(requestingLocation, () => {
    if (requestingLocation) {
      handlerId = navigator.geolocation.watchPosition(onSuccess, onError, options);
    }
  });

  onUnmounted(() => navigator.geolocation.clearWatch(handlerId));

  return { userLocation, userLocationError };
}
