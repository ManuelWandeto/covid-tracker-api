import {StateData, RegionData, GlobalStats, CountryData} from './interfaces';
import {groupByStates, readStatsFromFile} from './utils';
import slugify from 'slug';

function getRegionName(region: RegionData):string {
    const regionName =  (region.areaType === "country") 
            ? region.countryName 
            : region.areaType === "state" 
            ? region.stateName 
            : region.regionName 
            ?? null
    if (!regionName) throw new Error(`Region without a name found! countryName: ${region.countryName}, stateName: ${region.stateName}, regionName: ${region.regionName}`);
    return regionName
}

            
export default async function organizeData(globalCountryData: CountryData[], regionData: RegionData[]):Promise<GlobalStats> {
    try {
        if(globalCountryData && regionData) {
            // Combine properties of data with matching countryNames to make up for null values in each source
            const combined: StateData[] = [];
            globalCountryData.forEach(country => {
                
                const regionMatch = regionData.find(region => {
                    let regionName = getRegionName(region)
                    // slugify will standardise region names to specific format: united states virgin islands -> united-states-virgin-islands
                    return slugify(country.countryName).includes(slugify(regionName));
                });
                const {countryName, latitude, longitude, recovered, active, vaccinated, confirmed, deaths, population, countryCode, stateCode} = country;
                combined.push({
                    name: countryName,
                    countryCode: countryCode,
                    ...stateCode ? {stateCode} : {},
                    population,
                    latitude,
                    longitude,
                    tests: regionMatch?.tests ?? null,
                    confirmed: confirmed ?? regionMatch?.vaccinated ?? null,
                    active: active ?? regionMatch?.active ?? null,
                    recovered: recovered ?? regionMatch?.recovered ?? null,
                    vaccinated: vaccinated ?? regionMatch?.vaccinated ?? null,
                    deaths: deaths ?? regionMatch?.deaths ?? null,
                })
            });
            // Group combined data by states
            const grouped = groupByStates(combined)
            // intermediate array
            const stats: StateData[] = [];
            grouped.forEach(region => {
                if(region.states.length > 1) {
                    // Intermediate interface
                    interface Country {country: string, name: string, longitude: number, latitude: number};
                    // since we want to get region stats for all states combined 
                    // and since region data doesn't come with country codes, we use countries.json
                    const countriesData = readStatsFromFile<{countryList: Country[]}>(__dirname + `/assets/countries.json`)
                    if(!countriesData) throw new Error(`Error loading country list from countries.json`);
                    const countryJsonMatch = countriesData.countryList.find(country => country.country === region.code);
                    // we need a matching record in countries.json so as to get the whole regions' cordingates and also its official name
                    if (!countryJsonMatch) throw new Error(`No match in countries.json for code: ${region.code}`);
                    // we then use the official country name to find a matching region in regionData
                    const regionMatch = regionData.find(region => getRegionName(region).includes(countryJsonMatch?.name));
                    const {tests, confirmed, active, deaths, recovered, vaccinated} = <RegionData>regionMatch;
                    // To get the population of the whole region, we use a reducer to sum up the population of all contained states
                    const population = region.states.reduce((result, currentValue) => result + currentValue.population, 0);
                    stats.push({
                        name: countryJsonMatch.name,
                        countryCode: region.code,
                        active,
                        tests,
                        population,
                        confirmed,
                        deaths,
                        recovered,
                        vaccinated,
                        latitude: countryJsonMatch.latitude,
                        longitude: countryJsonMatch.longitude,
                        states: region.states
                    })
                } else {
                    stats.push(region.states[0]);
                }
            });
            const world = regionData.find(region => region.regionName === 'world') as RegionData;
            const globalStats: GlobalStats = {
                updatedAt: new Date(),
                worldwide: {
                    tests: world.tests,
                    confirmed: world.confirmed,
                    active: world.active,
                    recovered: world.recovered,
                    vaccinated: world.vaccinated,
                    deaths: world.deaths
                },
                countries: stats
            };
            return globalStats;
            
        } else {
            throw new Error(`data retrieval yielded untruthy data`);
        }
    } catch (error) {
        throw error;
    }
}