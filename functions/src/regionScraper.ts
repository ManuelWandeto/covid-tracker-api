import puppeteer, {Page} from 'puppeteer';
import { ConsoleMessage } from 'puppeteer';
import {RegionData} from './interfaces';

export default async function scrapeRegionStats(regions: string[]): Promise<RegionData[]> {
    const browser = await puppeteer.launch({
        headless: true,
    });
    try {
        const pages = await  Promise.all(regions.map(async () => await browser.newPage()));
        const regionData = regions.map(async (region, index) => {
            return await scrapeRegionTable(pages[index],region, 120000)
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
    await page.waitForSelector(rowsSelector, {timeout})

    // tslint:disable-next-line: no-shadowed-variable
    const stats = await page.$$eval(rowsSelector, (dataRows, regionName) => {

        return new Promise<RegionData[]>((resolve, reject) => {
            if (dataRows.length == 0) {
                reject("no data row elements");
            }
            const statData: RegionData[] = [];
            
            const getCellValue = (row: Element, className: string, fromAttribute ="data-order"): number | null => {
                const cell = row.querySelector<HTMLTableCellElement>(`td.${className}`)
                if(!cell) {
                    reject(`eval: no cell found for td.${className}`);
                } 
                const cellValue = cell!.getAttribute(fromAttribute);
                if(cellValue == null) {
                    console.log(`eval: could not get "data-order" attribute of cell: ${cell}`)
                    return null;
                } 
                return parseFloat(cellValue!) === -1 ? null : Math.round(parseFloat(cellValue!));
                
            }
            const getAreaType = (row: Element, fromAttribute="data-type"): string | null => {
                const areaType = row.querySelector("td.text--gray > div.flex > span:first-child")?.getAttribute(fromAttribute)
                if (!areaType) {
                    return null
                }
                return areaType.toLowerCase()
            }
            Array.from(dataRows).forEach((row, index) => {
                let areaType : string | null, areaField: string | null;
                if (index === 0) {
                    areaField = row.querySelector("td.text--gray")?.textContent ?? null
                    areaType = "region"
                } else {
                    areaType = getAreaType(row)
                    areaField = row.querySelector("td.text--gray > div.flex > span:last-child")?.textContent?.trim() ?? null;

                }
                if (!areaType) {
                    reject(`eval: area type could not be found`)
                }
                if (!areaField) {
                    console.log(`eval: area field is undefined for table row: ${index}`)
                }
                statData.push({
                    ...areaType! === "region"
                        ? {regionName: `${regionName}`} 
                        : areaType === "country"
                        ? {countryName: areaField!}
                        : {stateName: areaField!},
                    areaType: areaType!,
                    tests: getCellValue(row, 'text--amber'),
                    confirmed: getCellValue(row, "sorting_1"),
                    active: getCellValue(row, "text--yellow"),
                    recovered: getCellValue(row, "text--blue"),
                    deaths: getCellValue(row, "text--red"),
                    vaccinated: getCellValue(row, 'text--cyan')
                })
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
