import { Route } from '@/api/types'

export type Trip = {
  id: string,
  name: string,
}

export type RouteWithTrips = Route & {
  trips: Trip[]
}

export type Location = {
  lat: number,
  lng: number,
}
