// @flow
import * as React from 'react';
import {css} from 'glamor';
import {Motion, spring} from 'react-motion';
import Media from 'react-media';

type RainGaugeProps = {|percent: number|};

const RainGauge = (props: RainGaugeProps) => {
    const percent = Math.max(0, Math.min(100, props.percent));
    const totalHeight = 228;
    const height = (totalHeight * percent) / 100;
    const y = totalHeight - height;
    return (
        <svg viewBox="0 0 141 310" version="1.1">
            <defs>
                <clipPath id="container">
                    <path
                        d="M15,8 L125,8 L115.962931,205.008114 C115.424127,216.75404 105.744317,226 93.9860403,226 L46.0139597,226 C34.2556827,226 24.5758734,216.75404 24.0370695,205.008114 L15,8 Z"
                        fill="#CEDCFF"
                    />
                </clipPath>
            </defs>
            <g
                stroke="none"
                strokeWidth="1"
                fill="none"
                fillRule="evenodd"
                transform="translate(-110.000000, -195.000000)"
            >
                <g transform="translate(110.000000, 195.000000)">
                    <g>
                        <path
                            d="M70,219.121487 L70,219 L70.5,219.060743 L71,219 L71,219.121487 L80,220.21487 L73.6459761,309.597682 L71,309.597682 L67.3540239,309.597682 L61,220.21487 L70,219.121487 Z"
                            fill="#6C5FD9"
                        />
                        <path
                            d="M15,8 L125,8 L115.962931,205.008114 C115.424127,216.75404 105.744317,226 93.9860403,226 L46.0139597,226 C34.2556827,226 24.5758734,216.75404 24.0370695,205.008114 L15,8 Z"
                            fill="#CEDCFF"
                        />
                        <rect
                            id="water"
                            fill="#6C5FD9"
                            x="10"
                            y={y}
                            width="115"
                            height={height}
                            clipPath="url(#container)"
                        />
                        <polygon id="shadow" fill="#B7CBFC" points="15 8 125 8 124.671509 15 15.3586426 15" />
                        {percent > 95 && (
                            <polygon
                                id="shadow-full"
                                fill="#5C50BD"
                                points="15 8 125 8 124.671509 15 15.3586426 15"
                            />
                        )}
                        <rect fill="#CEDCFF" x="0" y="0" width="141" height="8" rx="4" />
                        <polygon
                            fill="#5C50BD"
                            points="61.4228516 225.974976 79.5721436 225.974976 79.1514893 232 61.862793 232"
                        />
                        <path
                            d="M68,114 L77,114 C78.1045695,114 79,114.895431 79,116 C79,117.104569 78.1045695,118 77,118 L68,118 L68,123 L74.5,123 C75.3284271,123 76,123.671573 76,124.5 C76,125.328427 75.3284271,126 74.5,126 L68,126 L68,133 L74.5,133 C75.3284271,133 76,133.671573 76,134.5 C76,135.328427 75.3284271,136 74.5,136 L68,136 L68,143 L74.5,143 C75.3284271,143 76,143.671573 76,144.5 C76,145.328427 75.3284271,146 74.5,146 L68,146 L68,153 L74.5,153 C75.3284271,153 76,153.671573 76,154.5 C76,155.328427 75.3284271,156 74.5,156 L68,156 L68,163 L74.5,163 C75.3284271,163 76,163.671573 76,164.5 C76,165.328427 75.3284271,166 74.5,166 L68,166 L68,173 L74.5,173 C75.3284271,173 76,173.671573 76,174.5 C76,175.328427 75.3284271,176 74.5,176 L68,176 L68,183 L74.5,183 C75.3284271,183 76,183.671573 76,184.5 C76,185.328427 75.3284271,186 74.5,186 L68,186 L68,193 L74.5,193 C75.3284271,193 76,193.671573 76,194.5 C76,195.328427 75.3284271,196 74.5,196 L68,196 L68,202 L77,202 C78.1045695,202 79,202.895431 79,204 C79,205.104569 78.1045695,206 77,206 L66,206 L64,206 L64,26 L66,26 L77,26 C78.1045695,26 79,26.8954305 79,28 C79,29.1045695 78.1045695,30 77,30 L68,30 L68,35 L74.5,35 C75.3284271,35 76,35.6715729 76,36.5 C76,37.3284271 75.3284271,38 74.5,38 L68,38 L68,45 L74.5,45 C75.3284271,45 76,45.6715729 76,46.5 C76,47.3284271 75.3284271,48 74.5,48 L68,48 L68,55 L74.5,55 C75.3284271,55 76,55.6715729 76,56.5 C76,57.3284271 75.3284271,58 74.5,58 L68,58 L68,65 L74.5,65 C75.3284271,65 76,65.6715729 76,66.5 C76,67.3284271 75.3284271,68 74.5,68 L68,68 L68,75 L74.5,75 C75.3284271,75 76,75.6715729 76,76.5 C76,77.3284271 75.3284271,78 74.5,78 L68,78 L68,85 L74.5,85 C75.3284271,85 76,85.6715729 76,86.5 C76,87.3284271 75.3284271,88 74.5,88 L68,88 L68,95 L74.5,95 C75.3284271,95 76,95.6715729 76,96.5 C76,97.3284271 75.3284271,98 74.5,98 L68,98 L68,105 L74.5,105 C75.3284271,105 76,105.671573 76,106.5 C76,107.328427 75.3284271,108 74.5,108 L68,108 L68,114 Z"
                            fill="#4134A4"
                            opacity="0.699393657"
                        />
                    </g>
                </g>
            </g>
        </svg>
    );
};

const formatRain = rain => {
    const twoDecimals = Math.round(rain * 100) / 100;
    return twoDecimals.toLocaleString(undefined, {minimumFractionDigits: 2});
};

const maxRain = 100;

type Props = {|rain: number|};

const AnimatedRainGauge = ({rain = 20}: Props) => (
    <Motion defaultStyle={{rain: 0}} style={{rain: spring(rain)}}>
        {value => (
            <React.Fragment>
                <div className={css({padding: 20, fontWeight: 'bold', position: 'relative'})}>
                    <span className={css({fontSize: 40})}>{formatRain(value.rain)}</span>
                    <span className={css({position: 'absolute', top: 26, right: -14})}>mm</span>
                </div>
                <Media
                    query="(orientation: portrait)"
                    render={() => (
                        <div className={css({width: '38%'})}>
                            <RainGauge percent={(100 * value.rain) / maxRain} />
                        </div>
                    )}
                />
            </React.Fragment>
        )}
    </Motion>
);

export default AnimatedRainGauge;
