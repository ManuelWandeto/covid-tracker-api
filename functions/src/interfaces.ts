export interface StatData {
    countryName?: string,
    countryCode?: string,
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
