import puppeteer, { Page } from 'puppeteer';
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
    const browser = await puppeteer.launch(
        {
            headless: true,
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

    try {
        const pages = await browser.pages();
        let page: Page
        if (pages.length) {
            page = await browser.newPage()
        } else {
            page = pages[0]
        }


        page.on('response', async (res) => {
            const request = res.request();
            if(request.url().includes('/data/placelist.js')) {
                // response is application/javascript with 'window.dataPlaceList = [json array of items];'
                let json = JSON.parse((await res.text()).replace('window.dataPlaceList = ', '').replace(';', ''))
                let regionArray = (json as responseData[])
                for (let i = 0; i < regionArray.length; i++) {
                    if (regionArray[i].invisible) {
                        continue
                    }
                    const {name, country, dead, infected, state, latitude, longitude, pop, recovered, sick, vaccinated} = regionArray[i];
                    placeData.push({
                        countryCode: country,
                        ...state && {stateCode: state},
                        countryName: name,
                        active: sick,
                        deaths: dead,
                        confirmed: infected,
                        vaccinated,
                        latitude,
                        longitude,
                        population: pop,
                        recovered
                    })
                }
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


