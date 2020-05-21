import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { scrapeGlobalStats } from './scraper';
import { persistStats } from './persist';

const serviceAccount: admin.ServiceAccount = require('../assets/firebasePermissions.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
        "https://covid-tracker-api-c2a95.firebaseio.com",
})

const app = express();
const db = admin.firestore();
const corsOptions: cors.CorsOptions = {
    origin: true
}

app.use(cors(corsOptions))

app.get('/globalStats', async (req, res) => {
    const docRef = db.collection("Stats").doc("globalStats");
    docRef.get().then((doc) => {
        if (doc.exists) {
            res.send(JSON.stringify(doc.data()));
        } else {
            res.statusMessage = "document not found";
            res
                .status(404)
                .end()
        }
    }).catch(err => {
        res.statusMessage = "internal server error";
        res.status(500).end()
    });
});

exports.api = functions.runWith({memory: "256MB", timeoutSeconds: 25}).https.onRequest(app);
exports.scrapeStats = functions
        .runWith({memory: "1GB", timeoutSeconds: 45})
        .pubsub.schedule("every 30 minutes")
        .onRun(async (context) => {
            const stats = await scrapeGlobalStats();
            const statusMsg = await persistStats(db, stats);
            console.log(statusMsg);
        })