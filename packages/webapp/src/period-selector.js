// @flow
import * as React from 'react';
import {css} from 'glamor';

type PeriodProps = {|
    value: number,
    checked?: boolean,
    onChange?: (evt: SyntheticEvent<HTMLInputElement>) => mixed,
    text: string,
|};

export const Period = ({value, checked, onChange, text}: PeriodProps) => (
    <React.Fragment>
        <input
            onChange={onChange}
            className={css({display: 'none'})}
            type="radio"
            name="period"
            value={value}
            id={text}
            checked={checked}
        />
        <label
            htmlFor={text}
            className={css({
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
            })}
        >
            <div
                className={
                    checked
                        ? css({padding: 4, borderBottom: '2px solid #d05c99'})
                        : css({padding: 4, borderBottom: '2px solid transparent'})
                }
            >
                {text}
            </div>
        </label>
    </React.Fragment>
);

type PeriodSelectorProps = {|
    children: React.ChildrenArray<React.Element<typeof Period>>,
    value: number,
    onChange: (value: number) => mixed,
|};

const PeriodSelector = ({children, value, onChange}: PeriodSelectorProps) => {
    const handleChange = (evt: SyntheticEvent<HTMLInputElement>) => {
        onChange(Number(evt.currentTarget.value));
    };
    return (
        <div
            className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                height: 64,
            })}
        >
            {React.Children.map(children, child =>
                React.cloneElement(child, {
                    checked: value === child.props.value,
                    onChange: handleChange,
                })
            )}
        </div>
    );
};

export default PeriodSelector;
