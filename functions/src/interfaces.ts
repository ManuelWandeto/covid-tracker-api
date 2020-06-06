export interface StateData {
    [index: string]: any,
    name: string,
    countryCode: string,
    stateCode?: string,
    states?: StateData[],
    latLng: {
        latitude: number,
        longitude: number,
    }
    population: number,
    tests?: number,
    confirmed: number,
    active: number,
    recovered: number,
    critical: number,
    deaths: number,
}

export interface GlobalStats {
    updatedAt: Date,
    worldwide: {
        tests?: number,
        confirmed: number,
        active: number,
        recovered: number,
        critical: number,
        deaths: number
    },
    countries: StateData[]
}

