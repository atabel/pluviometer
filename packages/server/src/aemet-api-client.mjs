// @flow
import https from 'https';
import utf8 from 'to-utf-8';
import type {Station, Reading} from './models.mjs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_KEY = String(process.env.AEMET_API_KEY);

const API_URL = 'https://opendata.aemet.es/opendata/api/';
const apiUrl = path => `${API_URL}${path}?api_key=${API_KEY}`;

const fetchJson = <T>(url: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        https
            .get(url, res => {
                const utf8Res = res.pipe(utf8('ISO-8859-15'));
                let str = '';
                utf8Res.on('data', d => {
                    str += d;
                });
                utf8Res.on('end', d => {
                    resolve(JSON.parse(str));
                });
            })
            .on('error', reject);
    });
};

const apiCall = path =>
    fetchJson(apiUrl(path)).then((res: {estado: number, datos: string}) => {
        if (res.estado === 200 && res.datos) {
            return fetchJson(res.datos).then(finalRes => {
                if (finalRes.estado && finalRes.estado !== 200) {
                    throw finalRes;
                }
                return finalRes;
            });
        } else {
            throw res;
        }
    });

const parseLatitude = (latStr: string) => {
    const sign = latStr.slice(-1) === 'N' ? 1 : -1;
    const strNum = latStr.slice(0, -1);
    return sign * Number(strNum) / 10000;
};

const parseLongitude = (lonStr: string) => {
    const sign = lonStr.slice(-1) === 'E' ? 1 : -1;
    const strNum = lonStr.slice(0, -1);
    return sign * Number(strNum) / 10000;
};

type StationFromServer = {
    indicativo: string,
    nombre: string,
    latitud: string,
    longitud: string,
};

type ReadingFromServer = {
    fint: string,
    prec: string,
};

type ReadingFromHistoricalServer = {
    prec: string,
    fecha: string,
};

const createStation = ({indicativo, nombre, latitud, longitud}: StationFromServer): Station => ({
    id: indicativo,
    name: nombre
        .toLowerCase()
        .replace(/(^|\s)\S/g, l => l.toUpperCase())
        .trim(),
    lat: parseLatitude(latitud),
    lon: parseLongitude(longitud),
});

const createReading = stationId => ({fint, prec}: ReadingFromServer): Reading => ({
    time: new Date(fint + 'Z').getTime(),
    rain: Number(prec || 0),
    stationId,
});

const parseApiNum = num => {
    const parsed = num ? Number(num.replace(',', '.')) : 0;
    if (Number.isNaN(parsed)) {
        return 0;
    }
    return parsed;
};

const createReadingFromHistorical = stationId => ({fecha, prec}: ReadingFromHistoricalServer): Reading => ({
    time: new Date(fecha).getTime(),
    rain: parseApiNum(prec),
    stationId,
});

export const getStations = (): Promise<Station[]> =>
    apiCall('valores/climatologicos/inventarioestaciones/todasestaciones/').then(
        (stations: StationFromServer[]) => stations.map(createStation)
    );

export const getStationData = (stationId: string): Promise<Reading[]> =>
    apiCall(`observacion/convencional/datos/estacion/${stationId}`).then((readings: ReadingFromServer[]) =>
        readings.map(createReading(stationId))
    );

const twoDigits = num => String(num).padStart(2, '0');
const getApiDateFromTs = ts => {
    const date = new Date(ts);
    const year = date.getUTCFullYear();
    const month = twoDigits(date.getUTCMonth() + 1);
    const day = twoDigits(date.getUTCDate());
    const hour = twoDigits(date.getUTCHours());
    const min = twoDigits(date.getUTCMinutes());
    const sec = twoDigits(date.getUTCSeconds());
    return `${year}-${month}-${day}T${hour}:${min}:${sec}UTC`;
};

export const getHistoricalStationData = (stationId: string, from: number, to: number): Promise<Reading[]> => {
    const startDate = getApiDateFromTs(from);
    const endDate = getApiDateFromTs(Math.min(to, Date.now()));

    return apiCall(
        `valores/climatologicos/diarios/datos/fechaini/${startDate}/fechafin/${endDate}/estacion/${stationId}/`
    ).then((readings: ReadingFromHistoricalServer[]) => readings.map(createReadingFromHistorical(stationId)));
};
