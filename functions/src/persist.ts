import { WorldwideStats } from "./interfaces";

export async function persistStats(db: FirebaseFirestore.Firestore, stats: WorldwideStats) {
    try {
        const currentDate = new Date().toUTCString();
        
        await db.collection('Stats').doc('globalStats').set({
            updatedAt: currentDate,
            worldwide: stats.worldwide,
            countries: stats.countries
        })
        return `successfully persisted stats ${currentDate}`;
    } catch (error) {
        return `error persisting stats ${error}`;
    }
}