//@flow
import React from 'react';

export const useState = <T>(initialValue: (() => T) | T): [T, (newValue: T) => void] =>
    //$FlowFixMe using react@next
    React.useState(initialValue);
export const useEffect = (effect: () => void | (() => void), args: Array<mixed>): void =>
    //$FlowFixMe using react@next
    React.useEffect(effect, args);

export const useSelect = <T>(initialValue: (() => T) | T): [T, (newValue: T) => void] => {
    const [value, setValue] = useState(initialValue);
    const onChange = newValue => {
        setValue(newValue);
    };

    return [value, onChange];
};

//$FlowFixMe using react@next
export const useMemo = <T>(fn: () => T, input: Array<mixed>): T => React.useMemo(fn, input);
