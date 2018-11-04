//@flow
import * as React from 'react';

// Types for react built-in hooks:

export const useState = <T>(initialValue: (() => T) | T): [T, (newValue: T) => void] =>
    (React: any).useState(initialValue);

export const useEffect = (effect: () => void | (() => void), args?: Array<mixed>): void =>
    (React: any).useEffect(effect, args);

export const useMutationEffect = (effect: () => void | (() => void), args: Array<mixed>): void =>
    (React: any).useMutationEffect(effect, args);

export const useMemo = <T>(fn: () => T, input: Array<mixed>): T => (React: any).useMemo(fn, input);

export const useRef = <T>(initialValue: T): {current: T} => (React: any).useRef(initialValue);

export const useContext = <T>(context: React$Context<T>): T => (React: any).useContext(context);

// Custom hooks:

export const useSelect = <T>(initialValue: (() => T) | T): [T, (newValue: T) => void] => {
    const [value, setValue] = useState(initialValue);
    const onChange = newValue => {
        setValue(newValue);
    };

    return [value, onChange];
};

export const useMedia = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(
        () => {
            const mq = matchMedia(query);
            setMatches(mq.matches);

            const listener = () => {
                setMatches(mq.matches);
            };

            mq.addListener(listener);

            return () => {
                mq.removeListener(listener);
            };
        },
        [query]
    );

    return matches;
};
