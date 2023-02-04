import express from 'express';
import cors from 'cors';
import {GlobalStats, RegionData, CountryData} from './interfaces'
import scrapeRegionStats from './regionScraper';
import scrapeGlobalStats from './globalDataScraper';
import { readStatsFromFile, writeStatsToFile, olderThan } from './utils';
import organizeData from './organiser';
import schedule from 'node-schedule'


schedule.scheduleJob('getGlobalCountryData', '*/10 * * * *', async () => {
    try {
        const countryData = await scrapeGlobalStats(60000)
        const statusMsg = await writeStatsToFile<CountryData[]>('./data/global_country_data.json', countryData)
        console.log(statusMsg)
    } catch (error) {
        console.log(`Error occured scraping countryData: ${error} at: ${new Date()}`);
    }
})

schedule.scheduleJob('getRegionData', '*/10 * * * *', async () => {
    const regions = ['world', 'unitedstates', 'canada', 'australia', 'russia', 'italy'];
    try {
        const regionData = await scrapeRegionStats(regions)
        const statusMsg = await writeStatsToFile<RegionData[]>('./data/region_stats.json', regionData)
        console.log(statusMsg)
    } catch (error) {
        console.log(`Error occured scraping regionData: ${error} at: ${new Date()}`);
        
    }
})

schedule.scheduleJob('organiseData', '*/15 * * * *', async () => {
    try {
        if(await olderThan("./data/region_stats.json", 1440) || await olderThan("./data/global_country_data.json", 1440)) {
            console.log(`WARN: Data is getting stale`)
        }
        const regionStats = readStatsFromFile<RegionData[]>("./data/region_stats.json")
        const countryStats = readStatsFromFile<CountryData[]>("./data/global_country_data.json")
        if(!regionStats || !countryStats) throw new Error("Error getting data from file sources");
        const organised = await organizeData(countryStats, regionStats)
        const statusMsg = await writeStatsToFile<GlobalStats>("./data/global_stats.json", organised)
        console.log(statusMsg)
    } catch (error) {
        console.log(`Error occured organizing data: ${error} at: ${new Date()}`);
    }
})

const app = express();
const corsOptions: cors.CorsOptions = {
    origin: true
}

app.use(cors(corsOptions))
app.get('/getCovidStats', async (req, res) => {
    try {
        const globalStats = readStatsFromFile<GlobalStats[]>("./data/global_stats.json")
        res.send(JSON.stringify(globalStats));
    } catch (error) {
        res.statusMessage = `Error occured getting global stats: ${error}`
        res.status(500).send(error)
    }
})
app.listen(3000, () => console.log('server started'));