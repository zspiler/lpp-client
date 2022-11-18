import leaflet from 'leaflet';

import { busIcon, busIconMirrored } from '../assets/icons/svgIcons';

export function createBusMarker(bus, color) {
  const busDirection = bus.cardinal_direction;

  const markerIconSize = 40;
  const svgIcon = busDirection >= 0 && busDirection <= 180 ? busIconMirrored : busIcon;
  const icon = leaflet.divIcon({
    className: 'bus-icon',
    html: leaflet.Util.template(svgIcon, { color }),
    iconSize: [markerIconSize, markerIconSize],
    iconAnchor: [markerIconSize / 2, markerIconSize / 2],
  });

  const iconRotationAngle = (busDirection >= 0 && busDirection <= 180)
    ? busDirection + 270 : busDirection + 90;

  const marker = leaflet.marker(
    [bus.latitude, bus.longitude],
    {
      rotationAngle: iconRotationAngle,
      icon,
      riseOnHover: true,
    },
  );
  marker.data = bus;
  return marker;
}

export function createStationMarker(station, color) {
  const marker = leaflet.circle(
    [station.latitude, station.longitude],
    {
      color,
      opacity: 0.8,
      radius: 25,
    },
  );
  return marker;
}
