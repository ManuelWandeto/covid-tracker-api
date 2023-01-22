import puppeteer from 'puppeteer';
import {CountryData} from './interfaces'
interface responseData {
    lastUpdated: Date;
    vaccinated: number;
    recovered: number;
    infected: number;
    id: string;
    pop: number;
    country: string;
    longitude: number;
    name: string;
    latitude: number;
    dead: number;
    sick: number;
    invisible: boolean;
    state?: string;
}


export default async function getGlobalCountryData(timeout = 40000) {
    let placeData: CountryData[] = [];
    const browser = await puppeteer.launch({headless: true});

    try {
        const [page] = await browser.pages();

        page.on('response', async (res) => {
            const request = res.request();
            if(request.url().includes('/data/placelist.js')) {
                // response is application/javascript with 'window.dataPlaceList = [json array of items];'
                let json = JSON.parse((await res.text()).replace('window.dataPlaceList = ', '').replace(';', ''))
                // remove ones with invisible set to true as they contain unknown population
                placeData = (json as responseData[]).filter(region => region.invisible !== true).map(region => 
                    {
                        const {name, country, dead, infected, state, latitude, longitude, pop, recovered, sick, vaccinated} = region;
                        return {
                            countryCode: country,
                            ...state ? {stateCode: state} : {},
                            countryName: name,
                            active: sick,
                            deaths: dead,
                            confirmed: infected,
                            vaccinated,
                            latitude,
                            longitude,
                            population: pop,
                            recovered
                        }
                    }
                );
            }
        })
        let retries = 3;
        do {
            await page.goto('https://coronavirus.app/map', {timeout});
            await page.waitForNetworkIdle();
            if(retries <= 0) {
                break;
            } else {
                retries--;
            }
        } while (placeData.length <= 0);

        if(!(placeData.length > 0)) {
            throw new Error('Scrape operation yieled empty array');
        } else {
            return placeData;
        }

    } catch (error) {
        throw new Error(`scrape process yielded error: ${error}`);
    } finally {
        await browser.close();
    }
}


