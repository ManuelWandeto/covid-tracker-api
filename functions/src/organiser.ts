import { CountryData } from './globalDataScraper';
import {RegionData} from './regionScraper';
import {StateData, GlobalStats} from './interfaces';
import {groupBy} from './utils';
import slugify from 'slug';
import * as countryJson from './assets/countries.json';

export default async function getData(globalData: CountryData[], regionData: RegionData[]) {
    try {
        if(globalData && regionData) {
            const combined: StateData[] = [];
            globalData.forEach(country => {
                const regionMatch = regionData.find(region => {
                    if(region.countryName) {
                        return slugify(country.countryName).includes(slugify(region.countryName));
                    } else {
                        return false;
                    }
                    
                });
                const {countryName, latlng, active, confirmed, deaths, population, countryCode, stateCode} = country;
                combined.push({
                    name: countryName,
                    countryCode: countryCode,
                    ...stateCode ? {stateCode: stateCode} : {},
                    population: population,
                    latLng: latlng,
                    tests: regionMatch ? regionMatch.tests : -1,
                    confirmed: confirmed,
                    active: active,
                    recovered: regionMatch ? regionMatch.recovered : -1,
                    critical: regionMatch ? regionMatch.critical : -1,
                    deaths: deaths,
                })
            });

            const grouped = groupBy(combined, 'countryCode');
            const countryStats: StateData[] = [];
            grouped.forEach(region => {
                if(region.states.length > 1) {
                    // tslint:disable: no-shadowed-variable
                    interface country {country: string, name: string, longitude: number, latitude: number};
                    const countryJsonMatch = countryJson.countryList.find(country => country.country === region.key);
                    const {country, name, latitude, longitude} = <country>countryJsonMatch;
                    const regionMatch = regionData.find(region => region.countryName?.includes(name));
                    const {tests, confirmed, active, critical, deaths, recovered} = <RegionData>regionMatch;
                    const population = region.states.reduce((result, currentValue) => result + currentValue.population, 0);
                    
                    countryStats.push({
                        name: name,
                        countryCode: country,
                        latLng: {
                            latitude: latitude,
                            longitude: longitude,
                        },
                        population: population,
                        states: region.states,
                        tests: tests,
                        confirmed: confirmed,
                        active: active,
                        recovered: recovered,
                        critical: critical,
                        deaths: deaths
                    });
                }else {
                    countryStats.push(region.states[0]);
                }
            });
            const world = regionData.find(region => region.region === 'world') as RegionData;
            const globalStats: GlobalStats = {
                updatedAt: new Date(),
                worldwide: {
                    tests: world.tests,
                    confirmed: world.confirmed,
                    active: world.active,
                    recovered: world.recovered,
                    critical: world.critical,
                    deaths: world.deaths
                },
                countries: countryStats
            };
            return globalStats;
        } else {
            throw new Error(`data retrieval yielded untruthy data`);
        }
    } catch (error) {
        throw new Error(error);
    }
}