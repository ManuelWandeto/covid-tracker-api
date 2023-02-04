import {StateData} from './interfaces';
import fs, {promises as fsPromises } from 'fs'
import Path, { dirname } from 'path'

// intermediate interface
interface Region {code: string; states: StateData[]};
export function groupByStates(states: StateData[], key ="countryCode"): Region[] {

    return states.reduce((result: Region[], currentValue) => {
        // tslint:disable-next-line: no-shadowed-variable
        // find a region in the result array of regions whose countrycode is equal to current value
        const region = result.find(region => region.code === currentValue[key]);
        if(region === undefined) {
            // if none found, push a new object containing current value
            result.push({code: currentValue[key], states: [currentValue]});
        }
        // since arrays are passed by reference, if region is found, push currrent value to its states property
        region?.states.push(currentValue);

        return result;
    }, [])
}

export async function olderThan(file: string, minutes: number) : Promise<boolean> {
    try {
        const absolutePath = Path.isAbsolute(file) ? file : Path.resolve(file);
        const stats = await fsPromises.stat(absolutePath)
        const currentTime = new Date()
        if ((stats.birthtime.getMinutes() - currentTime.getMinutes()) > minutes) {
            return true;
        }
        return false;
    } catch (error) {
        console.log(`Error occured getting file stats for: ${file}`);
        // so as to not continue on with the program and rename the file later
        return false
    }
}

async function getCurrentVersion(path: string, maxVersions: number): Promise<{ current: number; oldest: number; }> {
    try {
        // check the directory for all files whose name includes {filename},
        const versionSeparator = "_old_v"
        const dirname = Path.dirname(path)
        const files = await fsPromises.readdir(dirname)
        const versions = files.filter(file => file.includes(versionSeparator))
        if(versions.length === 0) {
            return {
                current: 0,
                oldest: 0
            }
        }
        const currentVersion = versions.reduce((previous, currentFile) => {
            const version = parseInt(currentFile.split(versionSeparator).pop()!)
            return version > previous ? version : previous
        }, 0)
        const oldestVersion = versions.reduce((previous, currentFile) => {
            const version = parseInt(currentFile.split(versionSeparator).pop()!)
            return version < previous ? version : previous
        }, currentVersion)
        return {
            current: currentVersion,
            oldest: oldestVersion
        }
        
    } catch (error) {
        throw new Error(`Error reading directory: ${dirname} to compute current version`)
    }

}

// // if file is older than a day, go ahead and delete
// TODO: Run a scheduled function to delete all versions older than a day
// if (await olderThan(absolutePath, ttlMinutes)) {
//     await fsPromises.unlink(absolutePath)
//     console.log(`deleted previous file at ${path}`)
// }
export async function writeStatsToFile<T>(path: string, data: T, maxVersions = 3, ttlMinutes = 5) {
    let statusMsg = '';
    const absolutePath = Path.isAbsolute(path) ? path : Path.resolve(path);
    try {
        const jsonString = JSON.stringify(data);
        if (fs.existsSync(absolutePath)) {
            const fileName = Path.basename(absolutePath, Path.extname(absolutePath))
            // else rename the existing file to `_old_v{n}` where n is a sequence from 1 to max_versions
            try {
                const versionInfo = await getCurrentVersion(absolutePath , maxVersions)
                const newFilePath = absolutePath.replace(fileName, fileName + `_old_v${versionInfo.current + 1}`)
                if (versionInfo.current >= maxVersions) {
                    await fsPromises.unlink(absolutePath.replace(fileName, fileName + `_old_v${versionInfo.oldest}`))   
                }
                await fsPromises.rename(absolutePath, newFilePath)
            } catch (error) {
                console.log(`error occured renaming existing file: ${error}`)
                // if error occures renaming existing file with version, remove the existing file
                await fsPromises.unlink(absolutePath)
            }
            
        } else {
            if(!fs.existsSync(Path.dirname(absolutePath))) {
                fs.mkdirSync(Path.dirname(absolutePath))
            }
        }
        fs.writeFile(absolutePath, jsonString, (err) => {
            if(err) {
                throw new Error(`error writting to file: ${err}`);
            }
        })
        statusMsg = `successfully wrote file: ${new Date()}`;
    } catch (error) {
        statusMsg = `${error}`;
    }

    return statusMsg;
}

export function readStatsFromFile<T>(path: string): T {
    const absolutePath = Path.isAbsolute(path) ? path : Path.resolve(path);
    try {
        
        const rawData = fs.readFileSync(absolutePath, {encoding: 'utf8'})
        const stats = JSON.parse(rawData) as T;
        return stats;

    } catch (error) {
        throw new Error(`Error occured reading stats from file: ${error}`);
    }
}
