//@flow

export type Station = {
    id: string,
    name: string,
    lat: number,
    lon: number,
};

export type Reading = {
    time: number,
    rain: number,
    stationId: string,
};
