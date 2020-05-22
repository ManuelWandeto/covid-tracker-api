import * as puppeteer from 'puppeteer';
import * as interfaces from './interfaces';
import * as countryLookup from 'country-code-lookup';

export async function scrapeGlobalStats() {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    const page = await browser.newPage();

    await page.goto("https://ncov2019.live", {waitUntil: "networkidle2"});

    const scrapedStats = await page.evaluate(() => {
        const worldRows = document.querySelectorAll('#container_world .dataTables_scrollBody tbody > tr');
        const statsJson: any[] = [];

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
                    statsJson.push({
                        countryName: country,
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
            
            return statsJson;
        } else {
            throw new Error("problem scraping rows from world stats in ncovLive.com")
        }
    })
    await browser.close();
    const worlwideStats = parseStats(scrapedStats);
    return worlwideStats;
}

function parseStats(rawStats: any[]): interfaces.WorldwideStats {
    const scrapedStats = rawStats;
    try {
        const globalTotals = scrapedStats.shift();
        delete globalTotals["countryName"];
        const totals = globalTotals as interfaces.GlobalData;
        const countries: interfaces.CountryData[] = scrapedStats.map(country => {
            return {
                countryCode: getCountryCode(country.countryName),
                ...country
            }
        });
        const worlwideStats: interfaces.WorldwideStats = {
            worldwide: totals,
            countries: countries
        }
        return worlwideStats;
    } catch (error) {
        throw new Error(error);
    }
    
}

function getCountryCode(countryName: string): string {
    const code = countryLookup.byCountry(countryName)?.internet;
    return code;
}