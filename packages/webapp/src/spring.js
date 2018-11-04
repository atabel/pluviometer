// @flow
// highly inspired by react-motion
import {useState, useEffect} from './react-hooks';

const msPerFrame = 1000 / 60;

type SpringConfig = {|
    stiffness: number,
    damping: number,
    precision: number,
|};

export const presets: {[name: string]: $Shape<SpringConfig>} = {
    noWobble: {stiffness: 170, damping: 26}, // the default, if nothing provided
    gentle: {stiffness: 120, damping: 14},
    wobbly: {stiffness: 180, damping: 12},
    stiff: {stiffness: 210, damping: 20},
};

// step is used a lot. Saves allocation to return the same array wrapper.
// This is fine and danger-free against mutations because the callsite
// immediately destructures it and gets the numbers inside without passing the
// array reference around.
let reusedTuple: [number, number] = [0, 0];
const step = (x: number, v: number, destX: number, config: SpringConfig): [number, number] => {
    const {stiffness: k, damping: b, precision} = config;

    // Hook's law
    const fSpring = -k * (x - destX);
    const fDamper = -b * v;

    // F = m * a (we assume a mass of 1)
    const a = fSpring + fDamper;

    const t = msPerFrame / 1000;

    const newV = v + a * t;
    const newX = x + newV * t;

    // Rounding according to precision
    if (Math.abs(newV) < precision && Math.abs(newX - destX) < precision) {
        reusedTuple[0] = destX;
        reusedTuple[1] = 0;
        return reusedTuple;
    }

    reusedTuple[0] = newX;
    reusedTuple[1] = newV;
    return reusedTuple;
};

export const useSpring = (
    value: number,
    defaultValue?: number = 0,
    springConfig?: $Shape<SpringConfig> = {}
) => {
    const [currentValue, setCurrentValue] = useState(defaultValue);

    useEffect(
        () => {
            const config = {...presets.noWobble, precision: 0.01, ...springConfig};
            let animationID = null;
            let unmounting = false;
            let prevTime = performance.now();
            let accumulatedTime = 0;

            let loopCurrentValue = currentValue;
            let currentVelocity = 0;
            let lastFrameValue = currentValue;
            let lastFrameVelocity = 0;

            const startAnimationIfNecessary = (): void => {
                if (unmounting || animationID) {
                    return;
                }

                animationID = requestAnimationFrame(timestamp => {
                    if (unmounting) {
                        return;
                    }

                    // finish animation when target value is reached
                    if (currentVelocity <= 0 && loopCurrentValue === value) {
                        // no need to cancel animationID here; shouldn't have any in flight
                        animationID = null;
                        accumulatedTime = 0;
                        return;
                    }

                    const currentTime = timestamp || performance.now();
                    const timeDelta = currentTime - prevTime;
                    prevTime = currentTime;
                    accumulatedTime = accumulatedTime + timeDelta;
                    // more than 10 frames? prolly switched browser tab. Restart
                    if (accumulatedTime > msPerFrame * 10) {
                        console.log('dropping frames');
                        accumulatedTime = 0;
                    }

                    if (accumulatedTime === 0) {
                        // no need to cancel animationID here; shouldn't have any in flight
                        animationID = null;
                        startAnimationIfNecessary();
                        return;
                    }

                    const framesToCatchUp = Math.floor(accumulatedTime / msPerFrame);
                    let currentFrameCompletion =
                        (accumulatedTime - framesToCatchUp * msPerFrame) / msPerFrame;

                    for (let i = 0; i < framesToCatchUp; i++) {
                        [lastFrameValue, lastFrameVelocity] = step(
                            lastFrameValue,
                            lastFrameVelocity,
                            value,
                            config
                        );
                    }
                    const [nextFrameValue, nextFrameVelocity] = step(
                        lastFrameValue,
                        lastFrameVelocity,
                        value,
                        config
                    );

                    loopCurrentValue =
                        lastFrameValue + (nextFrameValue - lastFrameValue) * currentFrameCompletion;
                    currentVelocity =
                        lastFrameVelocity + (nextFrameVelocity - lastFrameVelocity) * currentFrameCompletion;

                    animationID = null;
                    // the amount we've looped over above
                    accumulatedTime -= framesToCatchUp * msPerFrame;

                    setCurrentValue(loopCurrentValue);

                    startAnimationIfNecessary();
                });
            };

            startAnimationIfNecessary();

            return () => {
                unmounting = true;
                if (animationID) {
                    cancelAnimationFrame(animationID);
                    animationID = null;
                }
            };
        },
        [defaultValue, value]
    );

    return currentValue;
};
