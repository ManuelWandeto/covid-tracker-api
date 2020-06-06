import puppeteer from 'puppeteer';

export interface RegionData {
    region?: string,
    countryName?: string,
    tests: number,
    confirmed: number,
    active: number,
    recovered: number,
    critical: number,
    deaths: number
}

export default async function scrapeRegionStats(regions: string[]) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    try {
        const pages = await  Promise.all(regions.map(async region => await browser.newPage()));
        const dataPromises = regions.map(async (region, index) => {
            const data = await scrapeRegionTable(pages[index],region, 50000)
                            .catch(err => {throw new Error(`error scraping table of ${region}: ${err}`)});
            return data;
        });
        const stats = await Promise.all(dataPromises);

        if(stats) {
            return ([] as RegionData[]).concat(...stats);
        } else {
            throw new Error(`region scrape yielded untruthy data`);
        }
    } catch (error) {
        throw new Error(error);
    } finally {
        await browser.close();
    }  
}

async function scrapeRegionTable(page: puppeteer.Page, regionName: string, timeout = 30000) {
    await page.goto("https://ncov2019.live", {waitUntil: "networkidle2", timeout: timeout});

    // tslint:disable-next-line: no-shadowed-variable
    const stats = await page.evaluate((regionName) => {
        const region = regionName as string;

        const dataRows = document.querySelectorAll(`#container_${region} .dataTables_scrollBody tbody > tr`);
        const statData: RegionData[] = [];

        const getCellData = (row: Element, className: string) => {
            const cellValue = row.querySelector(`td.${className}`)?.getAttribute("data-order");
            if(cellValue) {
                return parseInt(cellValue);
            } else {
                throw new Error(`no data-order value for: td.${className}`);
            }
        }

        if(dataRows?.length > 0) {
            Array.from(dataRows).forEach(async row => {
                const country = row.querySelector("td.text--gray")?.textContent?.replace('★', '').trim();
                if(country) {
                    statData.push({
                        ...country.toLowerCase() === 'total'
                            ? {region: `${region}`}
                            : {countryName: country},
                        tests: getCellData(row, 'text--amber'),
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
            throw new Error(`problem scraping rows from ${region} stats in ncovLive.com`)
        }
    }, regionName.toLowerCase());
    if (stats) {
        return stats;
    } else {
        throw new Error('scrape operation yielded non truthy data')
    }
}
