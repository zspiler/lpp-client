import axios from '@/api/axios'
import { AxiosResponse } from 'axios'
import { ArrivalData } from '@/api/types'

const responseBody = <T>(response: AxiosResponse<T>) => response.data

export const getArrivals = (stationCode: string) => axios.get<ArrivalData>(`station/arrival?station-code=${stationCode}`).then(responseBody)
