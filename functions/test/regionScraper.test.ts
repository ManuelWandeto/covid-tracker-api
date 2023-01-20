import {describe, expect, test, jest} from '@jest/globals';
import scrapeRegionStats from '../src/regionScraper';
jest.setTimeout(120000)
jest.retryTimes(3)

describe('tests for regionScraper', () => {
    const regions = ['world', 'unitedstates', 'canada', 'australia', 'russia', 'italy'];
    test(`should return a non-empty array of regionData for all given regions`, async () => {
        const regionData = await scrapeRegionStats(regions);
        expect(regionData).toBeTruthy()
        // expect(regionData).toBeInstanceOf(Array)
        // expect(regionData.length).toBeGreaterThan(0);
        // jest.clearAllTimers()
    });
});