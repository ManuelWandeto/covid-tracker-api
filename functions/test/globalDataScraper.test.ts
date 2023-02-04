import {describe, expect, test, jest} from '@jest/globals';
import getGlobalCountryData from '../src/globalDataScraper';
jest.setTimeout(40000)
jest.retryTimes(2)
describe('tests for globalDataScraper', () => {
    test('should return a non-empty array of country data', async () => {
        const globalData = await getGlobalCountryData();
        expect(globalData).toBeTruthy()
        expect(globalData).toBeInstanceOf(Array);
        expect(globalData.length).toBeGreaterThan(0);
    });
});