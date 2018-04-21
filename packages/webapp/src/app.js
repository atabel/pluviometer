// @flow
import React, {Component} from 'react';
import {css} from 'glamor';
import api from './api';
import RainGauge from './rain-gauge';
import PeriodSelector, {Period} from './period-selector';
import StationSelector from './station-selector';

const storage = {
    saveStationId(stationId) {
        localStorage.setItem('stationId', stationId);
    },
    loadStationId() {
        return localStorage.getItem('stationId');
    },
};

const toRad = val => val * Math.PI / 180;

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

type State = {
    geoPosition: ?{lat: number, lon: number},
    stations: Array<*>,
    totalRain: number,
    loading: boolean,
    timeRange: number,
    selectedStationId: ?string,
};

class App extends Component<{}, State> {
    state = {
        geoPosition: null,
        stations: [],
        totalRain: 0,
        loading: true,
        timeRange: 1,
        selectedStationId: storage.loadStationId(),
    };

    getStations() {
        const {stations, geoPosition} = this.state;
        return [...stations].sort(geoPosition ? byDistance(geoPosition) : byStrKey('name'));
    }

    getSelectedStation() {
        const {selectedStationId} = this.state;
        const stations = this.getStations();
        if (selectedStationId === null) {
            return stations.length > 0 ? stations[0].id : null;
        } else {
            return selectedStationId;
        }
    }

    componentDidMount() {
        api.getStations().then(stations => {
            this.setState({stations});
            this.queryStationData();
        });
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                this.setState({
                    geoPosition: {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    },
                });
            });
        }
    }

    queryStationData = () => {
        const selectedStationId = this.getSelectedStation();
        if (!selectedStationId) {
            return;
        }
        const {timeRange} = this.state;
        this.setState({loading: true});
        api.getStationAggregatedRain(selectedStationId, timeRange).then(
            totalRain => {
                this.setState({totalRain, loading: false});
            },
            err => {
                console.error(err);
                this.setState({totalRain: 0, loading: false});
            }
        );
    };

    componentDidUpdate(prevProps: {}, prevState: State) {
        const {selectedStationId, timeRange} = this.state;
        if (selectedStationId !== prevState.selectedStationId || timeRange !== prevState.timeRange) {
            this.queryStationData();
        }
    }

    handlePeriodChange = (timeRange: number) => {
        this.setState({timeRange});
    };

    handleStationChange = (selectedStationId: string) => {
        this.setState({selectedStationId});
        storage.saveStationId(selectedStationId);
    };

    render() {
        const {totalRain, timeRange /*, loading*/} = this.state;

        const sortedStations = this.getStations();
        const selectedStationId = this.getSelectedStation();

        return (
            <div className={screen}>
                <StationSelector
                    stations={sortedStations}
                    value={selectedStationId}
                    onChange={this.handleStationChange}
                />

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
                <PeriodSelector value={timeRange} onChange={this.handlePeriodChange}>
                    <Period value={1} text="24 h" />
                    <Period value={7} text="7 días" />
                    <Period value={30} text="30 días" />
                </PeriodSelector>
            </div>
        );
    }
}

export default App;
