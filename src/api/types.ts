import { GeoJsonObject } from 'geojson'

export type Arrival = {
  route_id: string;
  trip_id: string;
  vehicle_id: string;
  type: number;
  eta_min: number;
  route_name: string;
  trip_name: string;
  depot: number;
  stations: {
    departure: string;
    arrival: string;
  };
};

export type ArrivalsResponse = {
  data: {
    station: {
      ref_id: string,
      name: string,
      code_id: string
    },
    arrivals: Arrival[]
  }
}

export type Bus = {
  route_number: string,
  route_id: string,
  trip_id: string,
  route_name: string,
  destination: string,
  bus_unit_id: string,
  bus_name: string,
  bus_timestamp: string,
  longitude: number,
  latitude: number,
  altitude: number,
  ground_speed: number,
  cardinal_direction: number
}

export type BusesResponse = {
  data: Bus[]
}

export type Route = {
  trip_id: string,
  route_id: string,
  route_number: string,
  route_name: string,
  short_route_name: string
  trip_int_id: string
  geojson_shape?: GeoJsonObject
}

export type RoutesResponse = {
  data: Route[]
}

export type Station = {
  code: string,
  name: string,
  latitude: number,
  longitude: number,
}

export type StationsData = {
  data: Station[]
}

export type StationsOnTripResponse = {
  data: Array<{
    latitude: number,
    longitude: number,
    name: string,
    int_id: string,
    ref_id: number,
    distance: number,
  }>
}

export type StationsInRangeResponse = {
  data: Array<{
    latitude: number,
    longitude: number,
    name: string,
    station_code: string,
    order_no: number,
  }>
}

export type StationsResponse = StationsOnTripResponse | StationsInRangeResponse
