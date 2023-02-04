export interface StateData {
    [index: string]: any,
    name: string,
    countryCode: string,
    stateCode?: string,
    states?: StateData[],
    latitude: number,
    longitude: number,
    population: number,
    tests: number | null | null,
    confirmed: number | null,
    active: number | null,
    recovered: number | null,
    vaccinated: number | null,
    deaths: number | null,
}
export interface CountryData {
    [index: string]: any, //index signature
    countryCode: string;
    stateCode?: string;
    countryName: string;
    population: number;
    latitude: number; 
    longitude: number;
    vaccinated: number | null;
    deaths: number | null;
    recovered: number | null;
    confirmed: number | null;
    active: number | null;
}
export interface RegionData {
    regionName?: string,
    countryName?: string,
    stateName?: string,
    areaType: string,
    tests: number | null,
    vaccinated: number | null,
    confirmed: number | null,
    active: number | null,
    recovered: number | null,
    deaths: number | null
}
export interface GlobalStats {
    updatedAt: Date,
    worldwide: {
        tests: number | null,
        confirmed: number | null,
        active: number | null,
        recovered: number | null,
        vaccinated: number | null,
        deaths: number | null,
    },
    countries: StateData[]
}

