import {describe, expect, test, jest} from '@jest/globals';
import fs, {promises as fsPromises } from 'fs'
import Path from 'path'
import {writeStatsToFile} from '../src/utils'

describe('Tests for the writeFile function', () => {
    
    test('Should successfully write a file with the given name to the given path', async () => {
        const testDataPath = __dirname + '/data/hello.txt'
        const statusMsg = await writeStatsToFile<string>(testDataPath, "Hello world")
        const files = await fsPromises.readdir(Path.dirname(testDataPath))
        expect(files.length).toBeGreaterThan(0)
        expect(files).toContain(Path.basename(testDataPath))
        expect(statusMsg).toContain("successfully")
    })

    test('Should only keep the given maximum amount of versions', async () => {
        const testDataPath = __dirname + '/data/hello.txt'
        const maxVersions = 5;
        for (let i = 0; i < 10; i++) {
            const statusMsg = await writeStatsToFile<string>(testDataPath, "Hello world", maxVersions)
            const files = await fsPromises.readdir(Path.dirname(testDataPath))
            expect(files.length).toBeGreaterThan(0)
            const versionSeparator = "_old_v"
            const versions = files.filter(file => file.includes(versionSeparator))
            expect(versions.length).toBeLessThanOrEqual(maxVersions)
            expect(statusMsg).toContain("successfully")
        }
        const files = await fsPromises.readdir(Path.dirname(testDataPath))
        expect(files).toContain(Path.basename(testDataPath))
    })
})