import * as puppeteer from 'puppeteer';
import * as interfaces from './interfaces';
import * as CountriesJson from './assets/countries.json';

export async function scrapeGlobalStats() {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    const page = await browser.newPage();
    
    await page.goto("https://ncov2019.live", {waitUntil: "networkidle2"});
    

    const stats = await page.evaluate(() => {
        const worldRows = document.querySelectorAll('#container_world .dataTables_scrollBody tbody > tr');
        const statData: interfaces.StatData[] = [];

        const getCellData = (row: Element, className: string) => {
            const cellValue = row.querySelector(`td.${className}`)?.getAttribute("data-order");
            if(cellValue) {
                return parseInt(cellValue);
            } else {
                throw new Error(`no data-order value for: td.${className}`);
            }
        }

        if(worldRows?.length > 0) {
            Array.from(worldRows).forEach(async row => {
                const country = row.querySelector("td.text--gray")?.textContent?.replace('★', '').trim();
                if(country) {
                    statData.push({
                        ...country !== 'TOTAL' ? {countryName: country} : {},
                        confirmed: getCellData(row, "sorting_1"),
                        active: getCellData(row, "text--yellow"),
                        recovered: getCellData(row, "text--blue"),
                        critical: getCellData(row, "text--orange"),
                        deaths: getCellData(row, "text--red"),
                    })
                } else {
                    throw new Error("Error scraping from document elements")
                }
            })
            
            return statData;
        } else {
            throw new Error("problem scraping rows from world stats in ncovLive.com")
        }
    })
    await browser.close();
    const totals = stats.shift();
    if (totals !== undefined) {
        const worldwideStats: interfaces.WorldwideStats = {
            worldwide: totals,
            countries: stats.map(country => {
                if(country.countryName) {
                    const countryInfo = getGeoInfo(country.countryName);
                    const countryData : interfaces.StatData =  {
                        // ...countryInfo?.code ? {countryCode: code} : {},
                        ...countryInfo?.code ? {countryCode: countryInfo.code} : {},
                        ...countryInfo? {
                            latLng: {
                                latitude: countryInfo.lat,
                                longitude: countryInfo.lng
                            }
                        }: {},
                        ...country
                    }
                    return countryData;
                } else {
                    return country;
                }
            })
        }
        return worldwideStats;
    } else {
        throw new Error('scrape operation yielded non truthy data')
    }
}

function getGeoInfo(countryName: string) : {code: string, lat: number, lng: number} | undefined {
    const countries = CountriesJson.countryList;
    const countryInfo = countries.find(country => {
        return country.name.includes(countryName);
    });
    if(countryInfo !== undefined) {
        return {
            code: countryInfo.country,
            lat: <number>countryInfo?.latitude,
            lng: <number>countryInfo?.longitude
        }
    } else {
        console.error(`no country object found for ${countryName}`);
        return;
    }
}