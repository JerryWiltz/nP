// Modified: 2026-11-19
import test from 'node:test';
import assert from 'node:assert/strict';
import {complex} from '../src/np-math/src/complex';
import {deviceProducts} from '../src/np-nport/src/transistors/deviceRf';
import {powers, constant} from '../src/np-nport/src/transistors/bjt/taylor';

test('mixed-control differential capacitance products agree with independent time-domain Fourier integration', () => {
    // Qg=1e-9*(x²+2xy+3y²+4x³+5x²y+6xy²+7y³).
    // Differential branches partition Cgs*dVgs/dt and Cgd*dVgd/dt.
    const capGs = [0, 2, 2, 12, 10, 6, 0, 0, 0, 0].map(n => n * 1e-9);
    const capGd = [0, 2, 6, 5, 12, 21, 0, 0, 0, 0].map(n => n * 1e-9);
    const model = {rows: new Map(), referenceImpedance: 1, temperature: 300,
        noiseSources: () => [], rfTopology: {nodeCount: 3, ports: [0, 1, 2], intrinsic: [0, 1, 2],
            controls: [[0, 2], [0, 1]], powers, joins: [], resistors: [], inductors: [], capacitors: []},
        point: {data: {currents: [constant(0), constant(0), constant(0)], charges: [constant(0), constant(0), constant(0)],
            capacitances: [{positive: 0, negative: 2, control: 0, coefficients: capGs},
                {positive: 0, negative: 1, control: 1, coefficients: capGd}]}}};
    const tones = {f1: 11, f2: 17}, x = [complex(.3, .2), complex(.1, -.15)], y = [complex(-.2, .1), complex(.25, .12)];
    const context = {input1: [x[0].mul(complex(.5, 0)), x[0].sub(y[0]).mul(complex(.5, 0)), complex(0, 0)],
        input2: [x[1].mul(complex(.5, 0)), x[1].sub(y[1]).mul(complex(.5, 0)), complex(0, 0)]};
    const count = 8192;
    for (const frequency of [6, 22, 28, 5, 23, 33, 51]) {
        const actual = deviceProducts(model, frequency, context, tones), expected = [complex(0, 0), complex(0, 0), complex(0, 0)];
        for (let sample = 0; sample < count; sample++) {
            const t = sample / count; let vx = 0, vy = 0, dx = 0, dy = 0;
            for (const [i, f] of [tones.f1, tones.f2].entries()) {
                const omega = 2 * Math.PI * f, c = Math.cos(omega * t), s = Math.sin(omega * t), scale = Math.sqrt(2);
                vx += scale * (x[i].x * c - x[i].y * s); vy += scale * (y[i].x * c - y[i].y * s);
                dx += scale * omega * (-x[i].x * s - x[i].y * c); dy += scale * omega * (-y[i].x * s - y[i].y * c);
            }
            const igs = 1e-9 * (2 * vx + 2 * vy + 12 * vx * vx + 10 * vx * vy + 6 * vy * vy) * dx;
            const igd = 1e-9 * (2 * vx + 6 * vy + 5 * vx * vx + 12 * vx * vy + 21 * vy * vy) * dy;
            const factor = complex(Math.cos(2 * Math.PI * frequency * t), -Math.sin(2 * Math.PI * frequency * t)).mul(complex(Math.sqrt(2) / count, 0));
            for (const [i, current] of [-igs - igd, igd, igs].entries()) expected[i] = expected[i].add(factor.mul(complex(current, 0)));
        }
        for (let i = 0; i < 3; i++) assert.ok(actual[i].sub(expected[i]).mag() < 1e-17, `port ${i}, frequency ${frequency}`);
        assert.ok(actual.reduce((sum, value) => sum.add(value), complex(0, 0)).mag() < 1e-20);
    }
});
