import { Route, Station, Arrival } from '@/api/types'

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

export type Location = {
    lat: number,
    lng: number,
}

export type ArrivalGroup = {
    eta: number,
    arrivals: Arrival[]
}
