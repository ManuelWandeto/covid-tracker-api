import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import {GlobalStats} from './interfaces';
import cors from 'cors';
import scrapeGlobalStats, {CountryData} from './globalDataScraper';
import scrapeRegionStats, {RegionData} from './regionScraper';
import {readStatsFromFile, writeStatsToFile} from './utils';
import getData from './organiser';

const serviceAccount: admin.ServiceAccount = require('../assets/firebasePermissions.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'covid-tracker-api-c2a95.appspot.com/'
})

const app = express();
const corsOptions: cors.CorsOptions = {
    origin: true
}
const bucket = admin.storage().bucket();
const file = bucket.file('Data/stats.json');

app.use(cors(corsOptions))

app.get('/globalStats', async (req, res) => {
    readStatsFromFile<GlobalStats>(file).then(stats => {
        res.status(200).send(JSON.stringify(stats));
    }).catch(err => {
        res.statusMessage = `server error occured retrieving stats: ${err}`;
        res.status(500).end();
    })
});


exports.api = functions.https.onRequest(app);
exports.globalScraper = functions
            .runWith({memory: '1GB', timeoutSeconds: 60})
            .pubsub.schedule('every 25 minutes')
            .onRun(async (context) => {
                try {
                    const globalStats = await scrapeGlobalStats();
                    const statusMsg = await writeStatsToFile<CountryData[]>(bucket.file('Data/globalStats.json'), globalStats);
                    console.log(statusMsg);
                } catch (error) {
                    console.log(`error occured getting global stats: ${error}`);
                }
            });

exports.regionScraper = functions
            .runWith({memory: '1GB', timeoutSeconds: 100})
            .pubsub.schedule('every 25 minutes')
            .onRun(async (context) => {
                const regions = ['world', 'unitedstates', 'canada', 'australia', 'russia', 'italy'];
                try {
                    const regionStats = await scrapeRegionStats(regions);
                    const statusMsg = await writeStatsToFile<RegionData[]>(bucket.file('Data/regionStats.json'), regionStats);
                    console.log(statusMsg);
                } catch (error) {
                    console.log(`error getting region stats: ${error}`);
                }
            })

exports.organiseData = functions
            .runWith({memory: '512MB'})
            .storage
            .object().onFinalize(async (object) => {
                if((object.name?.includes('stats.json'))) {
                    console.log(`skipping execution for file ${object.name}`);
                    return;
                } else {
                    try {
                        const globalStats = await readStatsFromFile<CountryData[]>(bucket.file('Data/globalStats.json'));
                        const regionStats = await readStatsFromFile<RegionData[]>(bucket.file('Data/regionStats.json'));
                        if(regionStats && globalStats) {
                            const stats = await getData(globalStats, regionStats);
                            const statusMsg = await writeStatsToFile<GlobalStats>(file, stats);
                            console.log(statusMsg);
                        } else {
                            throw new Error(`error getting data from file sources`);
                        }
                    } catch (error) {
                        console.log(`error organising data into stats: ${error}`);
                    }    
                }
            })