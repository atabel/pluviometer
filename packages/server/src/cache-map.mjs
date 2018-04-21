// @flow

export type CacheMap<K, V> = {
    clear: () => mixed,
    delete: (key: K) => mixed,
    forEach: (cb: (value: V, key: K, map: Map<K, {value: V, time: number}>) => mixed) => void,
    get: (key: K) => ?V,
    has: (key: K) => boolean,
    set: (key: K, value: V) => void,
    size: number,
};

const createGarbageCollector = <K, V>(map: Map<K, {value: V, time: number}>, ttl) => {
    let interval;
    const COLLECTION_THRESHOLD = 20;
    const initGarbageCollection = () => {
        if (interval || map.size < COLLECTION_THRESHOLD) {
            return;
        }
        interval = setInterval(() => {
            const now = Date.now();
            for (const [key, val] of map.entries()) {
                if (now - val.time > ttl) {
                    map.delete(key);
                }
            }
            if (map.size < COLLECTION_THRESHOLD) {
                clearInterval(interval);
                interval = undefined;
            }
        }, ttl);
    };

    return {
        init: initGarbageCollection,
    };
};

const createCacheMap = <K, V>(ttl: number): CacheMap<K, V> => {
    const cache: Map<K, {value: V, time: number}> = new Map();

    const gc = createGarbageCollector(cache, ttl);

    const instance = {
        clear() {
            return cache.clear();
        },
        delete(key) {
            return cache.delete(key);
        },
        forEach(cb) {
            return cache.forEach((value, key, map) => {
                cb(value.value, key, map);
            });
        },
        get(key) {
            const item = cache.get(key);
            if (item === undefined) {
                return undefined;
            }
            const {value, time} = item;
            if (Date.now() - time > ttl) {
                cache.delete(key);
                return undefined;
            }
            return value;
        },
        has(key) {
            return instance.get(key) !== undefined;
        },
        set(key, value) {
            cache.set(key, {value, time: Date.now()});
            gc.init();
        },
        get size() {
            return cache.size;
        },
    };

    return instance;
};

export default createCacheMap;
