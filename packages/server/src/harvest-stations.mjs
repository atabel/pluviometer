// @flow
import {getStations, getStationData} from './aemet-api-client.mjs';
import getDataBase from './firebase-db.mjs';
import log from './log.mjs';
import type {Reading} from './models.mjs';

const db = getDataBase();

const getMaxAndMinTime = readingsData => {
    let maxTime = 0,
        minTime = Infinity;
    readingsData.forEach(({time}) => {
        if (time < minTime) {
            minTime = time;
        }
        if (time > maxTime) {
            maxTime = time;
        }
    });
    return {maxTime, minTime};
};

const sleep = time => new Promise(res => setTimeout(res, time));

const harvestReadings = async stations => {
    let i = 0;
    for (const station of stations) {
        try {
            i++;
            await sleep(2500);
            log('Fetching readings for station', station.name, station.id, `${i}/${stations.length}`);

            const readings = await getStationData(station.id);

            log(`${readings.length} reading fetched`);

            const {maxTime, minTime} = getMaxAndMinTime(readings);

            const alreadyInDb: Reading[] = await db
                .collection('readings')
                .where('stationId', '==', station.id)
                .where('time', '>=', minTime)
                .where('time', '<=', maxTime)
                .get()
                .then(snapshot => {
                    const readings = [];
                    snapshot.forEach(doc => {
                        readings.push(doc.data());
                    });
                    return readings;
                });

            if (alreadyInDb.length > 0) {
                log(
                    `${alreadyInDb.length} readings where already stored in DB for the ${new Date(
                        minTime
                    ).toISOString()} - ${new Date(maxTime).toISOString()} interval`
                );
            }
            const {maxTime: maxTimeInDb, minTime: minTimeInDb} = getMaxAndMinTime(alreadyInDb);
            if (alreadyInDb.length > 0) {
                log(
                    `There are readings in DB from ${new Date(minTimeInDb).toISOString()} to ${new Date(
                        maxTimeInDb
                    ).toISOString()}`
                );
            }

            const newReadings = readings.filter(({time}) => time > maxTimeInDb || time < minTimeInDb);

            log(`${newReadings.length} readings are new`);

            log(`Storing readings in DB (${newReadings.length})`);

            await Promise.all(
                newReadings.map(r =>
                    db.collection('readings').add({
                        ...r,
                        stationId: station.id,
                    })
                )
            );
        } catch (e) {
            console.error(e);
        }
    }
};

const harvestStations = async () => {
    log('Fetching stations data');
    const stations = await getStations();
    log(`Storing stations in DB (${stations.length})`);
    await Promise.all(
        stations.map(station =>
            db
                .collection('stations')
                .doc(station.id)
                .set(station)
        )
    );
    log('Fetching stations readings');
    await harvestReadings(stations);
    log('All station readings stored in DB');
};

export default harvestStations;
