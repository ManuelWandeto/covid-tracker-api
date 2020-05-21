import * as puppeteer from 'puppeteer';
import * as interfaces from './interfaces';

export async function scrapeGlobalStats() {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox'
        ]
    });
    const page = await browser.newPage();

    await page.goto("https://ncov2019.live", {waitUntil: "networkidle2"});
    const stats = await page.evaluate(() => {
        const worldRows = document.querySelectorAll('#container_world .dataTables_scrollBody tbody > tr');
        const statsJson: interfaces.CountryData[] = [];

        const getCellData = (row: Element, className: string) => {
            const cellValue = row.querySelector(`td.${className}`)?.getAttribute("data-order");
            if(cellValue) {
                return parseInt(cellValue);
            } else {
                throw new Error(`no data-order value for: td.${className}`);
            }
        }

        if(worldRows?.length > 0) {
            Array.from(worldRows).forEach(row => {
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
            
            const globalTotals = statsJson.shift();
            let totals: interfaces.GlobalData;
            if(globalTotals) {
                delete globalTotals["countryName"];
                totals = globalTotals as interfaces.GlobalData

                const worldwideStats: interfaces.WorldwideStats = {
                    worldwide: totals,
                    countries: statsJson
                }

                return worldwideStats;
            } else {
                throw new Error("global totals is null");
            }

        } else {
            throw new Error("problem scraping rows from world stats in ncovLive.com")
        }

    })
    return stats;
}