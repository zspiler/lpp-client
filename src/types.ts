import { Route, Station } from '@/api/types'

export type Trip = {
  id: string,
  name: string,
}

export type RouteWithTrips = Route & {
  trips: Trip[]
}

export type StationOnTrip = Station & {
  trip: Trip
}
