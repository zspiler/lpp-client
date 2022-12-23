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
