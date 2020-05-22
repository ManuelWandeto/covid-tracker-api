export interface CountryData {
    countryName: string,
    countryCode: string,
    confirmed: number,
    active: number,
    recovered: number,
    critical: number,
    deaths: number
}

export interface GlobalData {
    confirmed: number,
    active: number,
    recovered: number,
    critical: number,
    deaths: number
}

export interface WorldwideStats {
    worldwide: GlobalData,
    countries: CountryData[]
}
