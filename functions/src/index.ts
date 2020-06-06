import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import {GlobalStats} from './interfaces';
import cors from 'cors';
import getData from './organiser';
import {readStatsFromFile, writeStatsToFile} from './utils';

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
exports.scraper = functions
                    .runWith({memory: '2GB', timeoutSeconds: 90})
                    .region('asia-east2')
                    .pubsub.schedule('every 30 minutes')
                    .onRun(async (context) => {
                        getData().then(async stats => {
                            const statusMessage = await writeStatsToFile<GlobalStats>(file, stats);
                            console.log(statusMessage);
                        }).catch(error => {
                            console.log(`error scraping data: ${error}`);
                        });
                    });