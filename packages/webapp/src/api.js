// @flow
import type {Reading, Station} from './models';

const API_URL = 'https://rain.now.sh/graphql';

const gql = (strs, ...substs) =>
    substs
        .reduce((prev, cur, i) => prev + cur + strs[i + 1], strs[0])
        .replace(/\s\s+/g, ' ')
        .replace(/([,(){}:])\s/g, '$1')
        .replace(/\s([,(){}:])/g, '$1')
        .trim();

const defineQuery = (query, cacheTtl) => (variables = {}) => ({
    query,
    variables,
    cacheTtl,
});

const queryCache = new Map();
const fetchGraphQL = ({query, variables, cacheTtl}) => {
    const key = `${query}:${JSON.stringify(variables)}`;
    const fromCache = queryCache.get(key);
    const now = Date.now();
    if (fromCache) {
        if (fromCache.time + cacheTtl > now) {
            return fromCache.value;
        }
        queryCache.delete(key);
    }

    const urlParams = new URLSearchParams();
    urlParams.set('query', query);
    urlParams.set('variables', JSON.stringify(variables));

    const fromNetwork = fetch(API_URL + `?${urlParams.toString()}`)
        .then(res => res.json())
        .then(res => res.data)
        .catch(error => {
            const cached = queryCache.get(key);
            if (cached && cached.value === fromNetwork) {
                queryCache.delete(key);
            }
            throw error;
        });
    queryCache.set(key, {time: now, value: fromNetwork});
    return fromNetwork;
};

const ONE_DAY = 24 * 3600 * 1000;
const ONE_MIN = 60 * 1000;

const allStations = defineQuery(
    gql`
        query Stations {
            stations {
                id
                name
                lat
                lon
            }
        }
    `,
    ONE_DAY
);

const readings = defineQuery(
    gql`
        query Readings($stationId: String!, $from: Float) {
            readings(stationId: $stationId, from: $from) {
                rain
            }
        }
    `,
    10 * ONE_MIN
);

const aggregatedReadings = defineQuery(
    gql`
        query AggregatedReadings($stationId: String!, $from: Float) {
            aggregatedReadings(stationId: $stationId, from: $from) {
                totalRain
            }
        }
    `,
    10 * ONE_MIN
);

const getFromTs = days => {
    const nDaysAgo = new Date(Date.now() - ONE_DAY * days);
    // round to hours to make graphql query cacheable
    const mins = nDaysAgo.getMinutes();
    nDaysAgo.setMinutes(0);
    nDaysAgo.setSeconds(0);
    nDaysAgo.setMilliseconds(0);
    if (mins > 30) {
        nDaysAgo.setHours(nDaysAgo.getHours() + 1);
    }
    return nDaysAgo.getTime();
};

const api = {
    getStations: (): Promise<Station[]> => fetchGraphQL(allStations()).then(({stations}) => stations),
    getStationAggregatedRain: (stationId: string, days: number = 1): Promise<number> => {
        const from = getFromTs(days);
        return fetchGraphQL(aggregatedReadings({stationId, from})).then(
            ({aggregatedReadings}) => aggregatedReadings.totalRain
        );
    },
    getStationData: (stationId: string, days: number = 1): Promise<Reading[]> => {
        const from = getFromTs(days);
        return fetchGraphQL(readings({stationId, from})).then(({readings}) => readings);
    },
};

export default api;
