import axios from '@/api/axios'
import { AxiosResponse } from 'axios'
import {
  ArrivalsResponse,
  BusesResponse,
  RoutesResponse,
  StationsOnTripResponse,
  StationsInRangeResponse,
} from '@/api/types'
import { mapToStationData } from '@/api/mappers'

const responseBody = <T>(response: AxiosResponse<T>) => response.data

export const getArrivals = (stationCode: string) => axios
  .get<ArrivalsResponse>(`station/arrival?station-code=${stationCode}`)
  .then(responseBody)

export const getBusesOnRoute = (routeNumber: string) => axios
  .get<BusesResponse>(`bus/buses-on-route?route-group-number=${routeNumber}&specific=1`)
  .then(responseBody)

export const getRouteShapes = (routeId: string) => axios
  .get<RoutesResponse>(`route/routes?route-id=${routeId}&shape=1`)
  .then(responseBody)

export const getStationsOnTrip = (tripId: string) => axios
  .get<StationsOnTripResponse>(`route/stations-on-route?trip-id=${tripId}`)
  .then(responseBody)
  .then(mapToStationData)

export const getStationsInRange = (latitude: number, longitude: number, radius = 30000) => axios
  .get<StationsInRangeResponse>(`station/stations-in-range?latitude=${latitude}&longitude=${longitude}&radius=${radius}`)
  .then(responseBody)
  .then(mapToStationData)
