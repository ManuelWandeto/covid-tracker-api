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

app.get('/scrapeStats', async (req, res) => {
    try {
        const stats = await scrapeGlobalStats();
        persistStats(db, stats).then(msg => console.log(msg)).catch(errMsg => console.log(errMsg));
        res.status(200).send(JSON.stringify(stats));
    } catch (error) {
        console.log(error);
        res.statusMessage = "Error scraping stats";
        res.status(500);
        res.end();
    }

})

exports.api = functions.runWith({memory: "1GB", timeoutSeconds: 30}).https.onRequest(app);