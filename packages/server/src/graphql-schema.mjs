// @flow
import {
    GraphQLList,
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLFloat,
    GraphQLNonNull,
} from 'graphql';
import getDataBase from './firebase-db.mjs';
import {getStationData, getHistoricalStationData} from './aemet-api-client.mjs';
import createCacheMap from './cache-map.mjs';
import type {CacheMap} from './cache-map.mjs';
import type {Station, Reading} from './models.mjs';

const ONE_HOUR = 3600 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

const db = getDataBase();

const roundToHours = (ts, {floor = false} = {}) => {
    const date = new Date(ts);
    const mins = date.getMinutes();
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    if (!floor && mins > 30) {
        date.setHours(date.getHours() + 1);
    }
    return date.getTime();
};

const snapshotToData = snapshot => {
    const docsData = [];
    snapshot.forEach(doc => {
        docsData.push(doc.data());
    });
    return docsData;
};

const readingsDbCache: CacheMap<string, *> = createCacheMap(6 * ONE_HOUR);
const getReadingsFromDb = ({from, to, stationId}) => {
    const key = `${from}:${to}:${stationId}`;
    const readingsFromCache = readingsDbCache.get(key);
    if (readingsFromCache) {
        return readingsFromCache;
    } else {
        const readingsFromDb: Promise<Reading[]> = db
            .collection('readings')
            .where('stationId', '=', stationId)
            .where('time', '>=', from)
            .where('time', '<=', to)
            .get()
            .then(snapshotToData);
        readingsDbCache.set(key, readingsFromDb);
        return readingsFromDb;
    }
};

const readingsRecentApiCache = createCacheMap(ONE_HOUR);
const getReadingsFromRecentApi = ({from, to, stationId}) => {
    const key = stationId;
    const readingsFromCache = readingsRecentApiCache.get(key);
    if (readingsFromCache) {
        return readingsFromCache.catch(err => {
            readingsRecentApiCache.delete(key);
            return [];
        });
    } else {
        const readingsFromApi = getStationData(stationId).then(readings =>
            readings.filter(({time}) => time >= from && time <= to)
        );
        readingsRecentApiCache.set(key, readingsFromApi);
        return readingsFromApi.catch(err => {
            readingsRecentApiCache.delete(key);
            return [];
        });
    }
};

const readingsHistoricalApiCache = createCacheMap(ONE_HOUR);
const getReadingsFromHistoricalApi = ({from, to, stationId}) => {
    const key = `${from}:${to}:${stationId}`;
    const readingsFromCache = readingsHistoricalApiCache.get(key);
    if (readingsFromCache) {
        return readingsFromCache.catch(err => {
            readingsHistoricalApiCache.delete(key);
            return [];
        });
    } else {
        const oneDayAgo = Date.now() - ONE_DAY;
        const readingsFromApi = getHistoricalStationData(stationId, from, to);
        readingsHistoricalApiCache.set(key, readingsFromApi);
        return readingsFromApi.catch(err => {
            readingsHistoricalApiCache.delete(key);
            return [];
        });
    }
};

const minReadingTimeByStationId = new Map();
const getReadings = ({from = 0, to = Infinity, stationId}) => {
    const now = Date.now();
    const oneDayAgo = Date.now() - ONE_DAY;

    from = roundToHours(from);
    to = roundToHours(Math.min(now, to), {floor: true});

    const storedMinReading = minReadingTimeByStationId.get(stationId) || Infinity;
    const readingsFromDb = getReadingsFromDb({from, to, stationId});

    // read from api only newer readings (not imported to db yet) or older readings (no enough historic data in db)
    const readingsFromRecentApi =
        to > oneDayAgo ? getReadingsFromRecentApi({from, to, stationId}) : Promise.resolve([]);
    const readingsFromHistoricalApi =
        from < storedMinReading ? getReadingsFromHistoricalApi({from, to, stationId}) : Promise.resolve([]);

    return Promise.all([readingsFromDb, readingsFromRecentApi, readingsFromHistoricalApi]).then(
        ([fromDb, fromRecentApi, fromHistoricalApi]) => {
            let minDbTime = Infinity,
                maxDbTime = 0;

            fromDb.forEach(({time}) => {
                if (time < minDbTime) {
                    minDbTime = time;
                }
                if (time > maxDbTime) {
                    maxDbTime = time;
                }
            });
            if (minDbTime < storedMinReading) {
                minReadingTimeByStationId.set(stationId, minDbTime);
            }

            const oldReadingsFromApi = fromHistoricalApi.filter(({time}) => time < minDbTime);

            // Ignore those readings from db which are already fetched from recents api (recents api result should be more updated)
            const storedReadings = fromDb.filter(
                ({time}) => !fromRecentApi.some(({time: apiTime}) => time === apiTime)
            );

            return [...oldReadingsFromApi, ...storedReadings, ...fromRecentApi];
        }
    );
};

let cachedStations: Station[];
let stationsCacheTime = 0;
const getAllStations = () => {
    const now = Date.now();
    if (cachedStations && now - stationsCacheTime < ONE_DAY) {
        return cachedStations;
    } else {
        cachedStations = db
            .collection('stations')
            .get()
            .then(snapshotToData);
        stationsCacheTime = now;
        return cachedStations;
    }
};

const StationType = new GraphQLObjectType({
    name: 'StationType',
    fields: {
        name: {type: GraphQLString},
        id: {type: GraphQLString},
        lat: {type: GraphQLFloat},
        lon: {type: GraphQLFloat},
    },
});

const ReadingType = new GraphQLObjectType({
    name: 'ReadingType',
    fields: {
        stationId: {type: GraphQLString},
        rain: {type: GraphQLFloat},
        time: {type: GraphQLFloat},
    },
});

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'RootQueryType',
        fields: {
            stations: {
                type: new GraphQLList(StationType),
                resolve() {
                    return getAllStations();
                },
            },
            readings: {
                type: new GraphQLList(ReadingType),
                args: {
                    stationId: {type: new GraphQLNonNull(GraphQLString)},
                    from: {type: GraphQLFloat},
                    to: {type: GraphQLFloat},
                },
                resolve(obj, args: {from: number, to: number, stationId: string}) {
                    return getReadings(args);
                },
            },
            aggregatedReadings: {
                type: new GraphQLObjectType({
                    name: 'AggregateType',
                    fields: {
                        stationId: {type: GraphQLString},
                        from: {type: GraphQLFloat},
                        to: {type: GraphQLFloat},
                        totalRain: {type: GraphQLFloat},
                    },
                }),
                args: {
                    stationId: {type: new GraphQLNonNull(GraphQLString)},
                    from: {type: GraphQLFloat},
                    to: {type: GraphQLFloat},
                },
                resolve(obj, args) {
                    return getReadings(args).then(readings => ({
                        stationId: args.stationId,
                        from: args.from || (readings.length && readings[0].time) || null,
                        to: args.to || (readings.length && readings[readings.length - 1].time) || null,
                        totalRain: readings.reduce((sum, {rain}) => sum + rain, 0),
                    }));
                },
            },
        },
    }),
});

export default schema;
