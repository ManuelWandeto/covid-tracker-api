import { WorldwideStats } from "./interfaces";

export async function persistStats(db: FirebaseFirestore.Firestore, stats: WorldwideStats) {
    try {
        await db.collection('Stats').doc('globalStats').set({
            updatedAt: new Date().toLocaleString(),
            worldwide: stats.worldwide,
            countries: stats.countries
        })
        return `successfully persisted stats ${new Date().getDay()}`;
    } catch (error) {
        return `error persisting stats ${error}`;
    }
}