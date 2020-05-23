export interface StatData {
    countryName?: string,
    countryCode?: string,
    latLng?: {
        latitude: number,
        longitude: number
    }
    confirmed: number,
    active: number,
    recovered: number,
    critical: number,
    deaths: number
}


export interface WorldwideStats {
    worldwide: StatData,
    countries: StatData[]
}
