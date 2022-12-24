import axios from '@/api/axios'
import { AxiosResponse } from 'axios'
import { ArrivalData, BusData, RouteData } from '@/api/types'

const responseBody = <T>(response: AxiosResponse<T>) => response.data

export const getArrivals = (stationCode: string) => axios.get<ArrivalData>(`station/arrival?station-code=${stationCode}`).then(responseBody)
export const getBusesOnRoute = (routeNumber: string) => axios.get<BusData>(`bus/buses-on-route?route-group-number=${routeNumber}&specific=1`).then(responseBody)
export const getRouteShape = (routeId: string) => axios.get<RouteData>(`route/routes?route-id=${routeId}&shape=1`).then(responseBody)
