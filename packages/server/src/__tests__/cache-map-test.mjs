// @flow
import createCacheMap from '../cache-map.mjs';
import type {CacheMap} from '../cache-map.mjs';

const stubCurrentDate = ts => {
    //$FlowFixMe
    Date.now = jest.fn(() => ts);
};

test('can store data', () => {
    const cache: CacheMap<string, number> = createCacheMap(100);
    cache.set('my-key', 45);
    expect(cache.get('my-key')).toBe(45);
});

test('cache is expired after ttl', () => {
    const insertDate = 0;
    const ttl = 100;
    const cache: CacheMap<string, number> = createCacheMap(ttl);

    stubCurrentDate(insertDate);
    cache.set('my-key', 45);
    expect(cache.size).toBe(1);

    stubCurrentDate(insertDate + ttl + 1);
    expect(cache.get('my-key')).toBeUndefined();
    expect(cache.size).toBe(0);
});

jest.useFakeTimers();

test('cached data is removed from the map when expired', () => {
    const insertDate = 0;
    const ttl = 100;
    let itemsToCache = 30;
    const cache: CacheMap<string, number> = createCacheMap(ttl);

    stubCurrentDate(insertDate);
    for (let i = 0; i < itemsToCache; i++) {
        cache.set('key' + i, i);
    }

    expect(cache.size).toBe(itemsToCache);

    stubCurrentDate(insertDate + ttl + 1);
    //$FlowFixMe
    jest.advanceTimersByTime(ttl + 1);

    expect(cache.size).toBe(0);
});
