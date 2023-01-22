import express from 'express';
import cors from 'cors';
import {GlobalStats, RegionData, CountryData} from './interfaces'
import scrapeRegionStats from './regionScraper';
import scrapeGlobalStats from './globalDataScraper';
import { readStatsFromFile, writeStatsToFile } from './utils';
import organizeData from './organiser';

const app = express();
const corsOptions: cors.CorsOptions = {
    origin: true
}

const regions = ['world', 'unitedstates', 'canada', 'australia', 'russia', 'italy'];
app.use(cors(corsOptions))
app.get('/regionalStats', async (req, res) => {
    try {
        const regionStats = await scrapeRegionStats(regions)
        const statusMsg = await writeStatsToFile<RegionData[]>('./data/region_stats.json', regionStats)
        console.log(statusMsg)
        res.send(JSON.stringify(regionStats));
    } catch (error) {
        console.log(error);
        res.status(500).send(JSON.stringify(error))
    }
});
app.get("/globalStats", async (req, res) => {
    try {
        const globalStats = await scrapeGlobalStats()
        const statusMsg = await writeStatsToFile<CountryData[]>('./data/global_country_data.json', globalStats)
        console.log(statusMsg)
        res.send(JSON.stringify(globalStats));
    } catch (error) {
        console.log(error);
        res.status(500).send(JSON.stringify(error))
    }
})
app.get('/organised', async (req, res) => {
    try {
        const regionStats = readStatsFromFile<RegionData[]>("./data/region_stats.json")
        const countryStats = readStatsFromFile<CountryData[]>("./data/global_country_data.json")
        const organised = await organizeData(countryStats, regionStats)
        const statusMsg = await writeStatsToFile<GlobalStats>("./data/global_stats.json", organised)
        console.log(statusMsg)
        res.send(JSON.stringify(organised));
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
})
app.listen(3000, () => console.log('server started'));

// exports.api = functions.https.onRequest(app);
// exports.globalScraper = functions
//             .runWith({memory: '1GB', timeoutSeconds: 60})
//             .pubsub.schedule('every 25 minutes')
//             .onRun(async (context) => {
//                 try {
//                     const globalStats = await scrapeGlobalStats();
//                     const statusMsg = await writeStatsToFile<CountryData[]>(bucket.file('Data/globalStats.json'), globalStats);
//                     console.log(statusMsg);
//                 } catch (error) {
//                     console.log(`error occured getting global stats: ${error}`);
//                 }
//             });

// exports.regionScraper = functions
//             .runWith({memory: '1GB', timeoutSeconds: 100})
//             .pubsub.schedule('every 25 minutes')
//             .onRun(async (context) => {
//                 const regions = ['world', 'unitedstates', 'canada', 'australia', 'russia', 'italy'];
//                 try {
//                     const regionStats = await scrapeRegionStats(regions);
//                     const statusMsg = await writeStatsToFile<RegionData[]>(bucket.file('Data/regionStats.json'), regionStats);
//                     console.log(statusMsg);
//                 } catch (error) {
//                     console.log(`error getting region stats: ${error}`);
//                 }
//             })

// exports.organiseData = functions
//             .runWith({memory: '512MB'})
//             .storage
//             .object().onFinalize(async (object) => {
//                 if((object.name?.includes('stats.json'))) {
//                     console.log(`skipping execution for file ${object.name}`);
//                     return;
//                 } else {
//                     try {
//                         const globalStats = await readStatsFromFile<CountryData[]>(bucket.file('Data/globalStats.json'));
//                         const regionStats = await readStatsFromFile<RegionData[]>(bucket.file('Data/regionStats.json'));
//                         if(regionStats && globalStats) {
//                             const stats = await getData(globalStats, regionStats);
//                             const statusMsg = await writeStatsToFile<GlobalStats>(file, stats);
//                             console.log(statusMsg);
//                         } else {
//                             throw new Error(`error getting data from file sources`);
//                         }
//                     } catch (error) {
//                         console.log(`error organising data into stats: ${error}`);
//                     }    
//                 }
//             })