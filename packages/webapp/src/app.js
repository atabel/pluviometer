// @flow
import React from 'react';
import {css} from 'glamor';
import api from './api';
import RainGauge from './rain-gauge';
import PeriodSelector, {Period} from './period-selector';
import StationSelector from './station-selector';
import {useState, useEffect, useSelect, useMemo} from './react-hooks';

const storage = {
    saveStationId(stationId) {
        localStorage.setItem('stationId', stationId);
    },
    loadStationId() {
        return localStorage.getItem('stationId');
    },
};

const toRad = val => (val * Math.PI) / 180;

const geoDist = (coords1, coords2) => {
    const {lat: lat1, lon: lon1} = coords1;
    const {lat: lat2, lon: lon2} = coords2;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const screen = css({
    fontFamily: "'Roboto', sans-serif",
    height: '100%',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    '&:after': {
        content: ' ',
        background: '#4d3cd6',
        width: '100%',
        height: '500%',
        zIndex: -1,
        position: 'absolute',
        transformOrigin: 'top left',
        transform: 'rotate(-45deg)',
        top: 0,
        left: 0,
        pointerEvents: 'none',
    },
    '&:before': {
        content: ' ',
        background: '#4c3bc5',
        width: '100%',
        height: '500%',
        zIndex: -1,
        position: 'absolute',
        transformOrigin: 'top right',
        transform: 'rotate(45deg)',
        top: 0,
        left: 0,
        pointerEvents: 'none',
    },
});

const byStrKey = key => (a, b) => a[key].localeCompare(b[key]);
const byDistance = geoPosition => (a, b) => geoDist(a, geoPosition) - geoDist(b, geoPosition);

const useGeoPosition = () => {
    const [geoPosition, setGeoPosition] = useState(null);
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                setGeoPosition({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            });
        }
    }, []);
    return geoPosition;
};

const useTotalRain = (selectedStationId, timeRange) => {
    const [totalRain, setTotalRain] = useState(0);
    const [loading, setLoading] = useState(true);
    useEffect(
        () => {
            if (!selectedStationId) {
                return;
            }
            setLoading(true);
            api.getStationAggregatedRain(selectedStationId, timeRange).then(
                totalRain => {
                    setTotalRain(totalRain);
                    setLoading(false);
                },
                err => {
                    console.error(err);
                    setTotalRain(0);
                    setLoading(false);
                }
            );
        },
        [selectedStationId, timeRange]
    );
    return {totalRain, loading};
};

const useStations = geoPosition => {
    const [stations, setStations] = useState([]);
    useEffect(() => {
        api.getStations().then(stations => {
            setStations(stations);
        });
    }, []);

    const sortedStations = useMemo(
        () => [...stations].sort(geoPosition ? byDistance(geoPosition) : byStrKey('name')),
        [stations]
    );

    const [stationIdFromState, handleStationChange] = useSelect(() => storage.loadStationId());

    let selectedStationId = stationIdFromState;
    if (selectedStationId === null) {
        selectedStationId = sortedStations.length > 0 ? sortedStations[0].id : null;
    }

    useEffect(
        () => {
            if (selectedStationId) {
                storage.saveStationId(selectedStationId);
            }
        },
        [selectedStationId]
    );

    return {stations: sortedStations, selectedStationId, handleStationChange};
};

const PluviometerApp = () => {
    const geoPosition = useGeoPosition();
    const [timeRange, handlePeriodChange] = useSelect(1);
    const {stations, selectedStationId, handleStationChange} = useStations(geoPosition);

    const {totalRain /*, loading*/} = useTotalRain(selectedStationId, timeRange);

    return (
        <div className={screen}>
            <StationSelector stations={stations} value={selectedStationId} onChange={handleStationChange} />

            <div
                className={css({
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                })}
            >
                <RainGauge rain={totalRain} />
            </div>
            <PeriodSelector value={timeRange} onChange={handlePeriodChange}>
                <Period value={1} text="24 h" />
                <Period value={7} text="7 días" />
                <Period value={30} text="30 días" />
            </PeriodSelector>
        </div>
    );
};

export default PluviometerApp;
