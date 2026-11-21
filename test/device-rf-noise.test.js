// Modified: 2026-11-20
import test from 'node:test';
import assert from 'node:assert/strict';
import {complex} from '../src/np-math/src/complex';
import {deviceFrequencyRow} from '../src/np-nport/src/transistors/deviceRf';
import {constant, powers} from '../src/np-nport/src/transistors/bjt/taylor';
import {BOLTZMANN} from '../src/np-nport/src/physicalConstants';
function close(a, b, tolerance) { assert.ok(a.sub(b).mag() <= tolerance); }
test('shared series-RC branches retain their exact impedance and physical thermal noise, including DC', () => {
    const ro = 50, temperature = 310, resistance = 47, capacitance = 10e-12;
    const model = {referenceImpedance: ro, temperature, rows: new Map(), noiseSources: () => [],
        point: {data: {currents: [constant(0), constant(0)], charges: [constant(0), constant(0)]}},
        rfTopology: {nodeCount: 2, ports: [0, 1], intrinsic: [0, 1], controls: [[0, 1]], powers,
            joins: [], resistors: [], inductors: [], capacitors: [], seriesRC: [[0, 1, resistance, capacitance]]}};
    for (const frequency of [0, 1e5, 1e8, 1e10]) {
        const row = deviceFrequencyRow(model, frequency), s = [row.spars.slice(1, 3), row.spars.slice(3)];
        const z = frequency === 0 ? null : complex(resistance, -1 / (2 * Math.PI * frequency * capacitance));
        const s11 = z ? z.div(z.add(complex(2 * ro, 0))) : complex(1, 0), s21 = complex(1, 0).sub(s11);
        close(s[0][0], s11, 1e-14); close(s[0][1], s21, 1e-14);
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
            const dot = s[i].reduce((sum, value, k) => sum.add(value.mul(complex(s[j][k].x, -s[j][k].y))), complex(0, 0));
            const expected = complex(i === j ? 1 : 0, 0).sub(dot).mul(complex(BOLTZMANN * temperature, 0));
            close(row.noise.C[i][j], expected, 1e-35);
        }
    }
    model.rfTopology.seriesRC[0].push(false); model.rows = new Map();
    const noiselessCorrection = deviceFrequencyRow(model, 1e9);
    assert.ok(noiselessCorrection.noise.C.flat().every(z => z.mag() === 0));
});
