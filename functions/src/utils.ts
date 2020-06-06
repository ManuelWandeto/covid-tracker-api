import {StateData} from './interfaces';
import {File} from 'firebase-admin/node_modules/@google-cloud/storage/build/src';

export function groupBy(array: StateData[], key: string) {
    interface region {key: string; states: StateData[]};

    return array.reduce((result: region[], currentValue) => {
        // tslint:disable-next-line: no-shadowed-variable
        const region = result.find(region => region.key === currentValue[key]);
        if(region === undefined) {
            result.push({key: currentValue[key], states: [currentValue]});
        }
        
        region?.states.push(currentValue);

        return result;
    }, [])
}

export async function writeStatsToFile<T>(file: File, data: T) {
    let statusMsg = '';
    try {
        const jsonString = JSON.stringify(data);
        file.save(jsonString, {contentType: 'application/json'}, (err) => {
            if(err) {
                statusMsg = `error writting data to file: ${err}`;
            } else {
                statusMsg = `successfully wrote data to file: ${new Date()}`;
            }
        });
    } catch (error) {
        statusMsg = `error occured while writing stats to file: ${error}`;
    }

    return statusMsg;
}

export async function readStatsFromFile<T>(file: File): Promise<T> {
    try {
        const contents = await file.download().then(res => res[0]).catch(err => {
            throw new Error(`error downloading file: ${err}`);
        });
        const jsonString = contents.toString();
        const stats = JSON.parse(jsonString) as T;
        return stats;

    } catch (error) {
        throw new Error(`Error occured reading stats from file: ${error}`);
    }
}
