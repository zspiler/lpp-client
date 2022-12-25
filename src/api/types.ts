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

export type ArrivalData = {
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

export type BusData = {
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

export type RouteData = {
  data: Route[]
}

export type Station = {
  name: string,
  station_code: string,
  order_no: number,
  latitude: number,
  longitude: number,
  station_int_id: number,
}

export type StationData = {
  data: Station[]
}
