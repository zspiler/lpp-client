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
  };

  const onError = (err) => {
    isUserLocationLoading.value = false;
    console.log('error getting location');
    console.log(err);
    userLocationError.value = err.code;
    // TODO: show alert
    if (err.code === 1) {
      // user denied location
      userLocation.value = undefined;
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
      isUserLocationLoading.value = true;
      handlerId = navigator.geolocation.watchPosition(onSuccess, onError, options);
    }
  });

  onUnmounted(() => navigator.geolocation.clearWatch(handlerId));

  return { userLocation, userLocationError, isUserLocationLoading };
}
