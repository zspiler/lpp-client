import { StationsData, StationsResponse } from '@/api/types'

export function mapToStationData(response: StationsResponse): StationsData {
    const stations = response.data.map((station) => ({
        name: station.name,
        latitude: station.latitude,
        longitude: station.longitude,
        code: 'ref_id' in station ? station.ref_id.toString() : station.station_code,
    }))
    return { data: stations }
}
