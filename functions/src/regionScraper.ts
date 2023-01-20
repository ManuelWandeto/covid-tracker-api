import puppeteer, {Page} from 'puppeteer';
import { ConsoleMessage } from 'puppeteer';

export interface RegionData {
    region?: string,
    countryName?: string,
    tests: number | null,
    vaccinated: number | null,
    confirmed: number | null,
    active: number | null,
    recovered: number | null,
    deaths: number | null
}

export default async function scrapeRegionStats(regions: string[]): Promise<RegionData[]> {
    const browser = await puppeteer.launch({
        headless: true,
    });
    try {
        const pages = await  Promise.all(regions.map(async () => await browser.newPage()));
        const regionData = regions.map(async (region, index) => {
            return await scrapeRegionTable(pages[index],region, 0)
                            .catch(err => {
                                throw new Error(`error scraping table of ${region}: ${err}`)
                            });
        });
        const stats = await Promise.all(regionData);

        if(stats) {
            return ([] as RegionData[]).concat(...stats);
        } else {
            throw new Error(`region scrape yielded untruthy data`);
        }
    } catch (error) {
        throw error;
    } finally {
        await browser.close();
    }  
}
function logger(msg: ConsoleMessage) {
    for (let i = 0; i < msg.args().length; ++i)
    // only show console logs that begin with "eval:" (to only see our console logs)
    if(msg.args()[i].toString().includes('eval:')) {
        console.log(`${msg.args()[i]}`);
    }
}
async function scrapeRegionTable(page: Page, regionName: string, timeout = 30000) {
    // below enables console logs within page.evaluate context to be shown on node's console output
    page.on('console', logger);

    await page.goto("https://ncov2019.live", {timeout});
    await page.waitForNetworkIdle();
    const rowsSelector = `#container_${regionName.toLowerCase()} #sortable_table_${regionName.toLowerCase()}_wrapper .dataTables_scroll .dataTables_scrollBody table[id="sortable_table_${regionName.toLowerCase()}"] tbody > tr`
    await page.waitForSelector(rowsSelector)

    // tslint:disable-next-line: no-shadowed-variable
    const stats = await page.$$eval(rowsSelector, (dataRows, regionName) => {
        return new Promise<RegionData[]>((resolve, reject) => {
            if (dataRows.length == 0) {
                reject("no data row elements");
            }
            const statData: RegionData[] = [];
            
            const getCellData = (row: Element, className: string): number | null => {
                const cell = row.querySelector<HTMLTableCellElement>(`td.${className}`)
                if(!cell) {
                    reject(`eval: no cell found for td.${className}`);
                } 
                const cellValue = cell!.getAttribute("data-order");
                if(cellValue == null) {
                    console.log(`eval: could not get "data-order" attribute of cell: ${cell}`)
                    return null;
                } 
                return parseFloat(cellValue!) === -1 ? null : Math.round(parseFloat(cellValue!));
                
            }

            Array.from(dataRows).forEach((row, index) => {
                const country = index == 0 ? row.querySelector("td.text--gray")?.textContent : row.querySelector("td.text--gray > div.flex > span:last-child")?.textContent?.trim();
                if (country) {
                    statData.push({
                        ...country!.toLowerCase() === 'total'
                            ? {region: `${regionName}`}
                            : {countryName: country},
                        tests: getCellData(row, 'text--amber'),
                        confirmed: getCellData(row, "sorting_1"),
                        active: getCellData(row, "text--yellow"),
                        recovered: getCellData(row, "text--blue"),
                        deaths: getCellData(row, "text--red"),
                        vaccinated: getCellData(row, 'text--cyan')
                    })
                } else {
                    console.log(`eval: country field is undefined for table row: ${index}`)
                }
            })

            if (statData.length == 0) {
                reject("eval: yielded no statData")
            }
            resolve(statData)
        
    })}, regionName.toLowerCase());
    if (stats) {
        return stats;
    } else {
        throw new Error('scrape operation yielded non truthy data')
    }
}
