// @flow
import React from 'react';
import {css} from 'glamor';
import type {Station} from './models';
import {ReactComponent as LocationIcon} from './assets/icon-location.svg';

type Props = {
    stations: Station[],
    value: ?string,
    onChange: (value: string) => mixed,
};

class StationSelector extends React.Component<Props> {
    render() {
        const {stations, value} = this.props;
        return (
            <div className={css({position: 'relative', height: 56})}>
                {stations.length > 0 &&
                    value && (
                        <select
                            aria-label="Estación meteorológica"
                            onChange={evt => this.props.onChange(evt.target.value)}
                            value={value}
                            id="station"
                            className={css({
                                border: 'none',
                                appearance: 'none',
                                width: '100%',
                                color: 'white',
                                background: 'initial',
                                height: '100%',
                                textAlignLast: 'center',
                                outline: 'none',
                                paddingTop: 2,
                                fontWeight: 'bold',
                                fontSize: 18,
                            })}
                        >
                            {stations.map(({name, id}) => (
                                <option className={css({color: 'black'})} key={id} value={id}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    )}
                <LocationIcon
                    className={css({
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        pointerEvents: 'none',
                    })}
                />
            </div>
        );
    }
}

export default StationSelector;
