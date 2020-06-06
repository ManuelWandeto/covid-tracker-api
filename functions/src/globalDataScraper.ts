import puppeteer from 'puppeteer';

export interface countryData {
    [index: string]: any, //index signature
    countryCode: string;
    stateCode?: string;
    countryName: string;
    latlng: {
        latitude: number,
        longitude: number
    }
    deaths: number;
    recovered: number;
    confirmed: number;
    population: number;
    active: number;
}

interface responseData {
    lastUpdated: Date;
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


export default async function getGlobalData() {
    let placeData: countryData[] = [];
    const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});

    try {
        const [page] = await browser.pages();

        page.on('response', async (res) => {
            const request = res.request();
            if(request.url().includes('https://coronavirus.app/get-places')) {
                const json = await res.json() as {data: responseData[]};
                const availableCountries = json.data.filter(region => region.invisible !== true);
                placeData = availableCountries.map(region => 
                    {
                        const {name, country, dead, infected, state, latitude, longitude, pop, recovered, sick} = region;
                        return {
                            countryCode: country,
                            ...state ? {stateCode: state} : {},
                            countryName: name,
                            active: sick,
                            deaths: dead,
                            confirmed: infected,
                            latlng: {
                                latitude: latitude,
                                longitude: longitude
                            },
                            population: pop,
                            recovered: recovered
                        }
                    }
                );
            }
        })
        let retries = 3;
        do {
            await page.goto('https://coronavirus.app/map', {waitUntil: 'networkidle2'});
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


