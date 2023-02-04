import {describe, expect, test, jest} from '@jest/globals';
import path from 'path';
import { RegionData , CountryData} from '../src/interfaces';
import organiser from '../src/organiser'
import { readStatsFromFile } from '../src/utils';

describe("Tests for the organiser funtional unit", () => {
    test("Should return a GlobalStats object given region data and global country data", async () => {
        const regionStats = readStatsFromFile<RegionData[]>(path.resolve("./data/region_stats.json"))
        const globalCountryData = readStatsFromFile<CountryData[]>(path.resolve("./data/global_country_data.json"))
        const globalStats = await organiser(globalCountryData, regionStats)
        expect(globalStats).toBeTruthy()
        expect(globalStats.countries.length).toBeGreaterThan(0)
        expect(new Date().getMinutes() - globalStats.updatedAt.getMinutes()).toBeLessThan(2)
        expect(globalStats.worldwide).toBeTruthy()
    })
})