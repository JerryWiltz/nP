// Modified: 2026-11-16
import test from 'node:test';
import assert from 'node:assert/strict';
import {NPN, PNP} from '../src/index.js';
import {gummelPoon} from '../src/np-nport/src/transistors/bjt/gummelPoon';

function close(actual, expected, tolerance = 1e-9) {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}
function dcCurrents(parameters, polarity, vbe, vbc) {
    return gummelPoon(parameters, polarity * vbe, polarity * vbc, false)
        .currents.map(row => polarity * row[0]);
}

for (const [constructor, model, polarity] of [[NPN, '2N3904', 1], [NPN, 'BFR93A', 1], [PNP, '2N3906', -1]]) {
    test(model + ' hybrid-pi conductances reproduce DC slopes in saturation and forward-active bias', () => {
        for (const vce of [0, 0.05, 0.2, 5]) {
            const q = constructor({model, qPoint: {ib: polarity * 20e-6, vce: polarity * vce},
                temperature: 300.15, fList: [0]});
            const {gm, gpi, gmu, go} = q.smallSignal;
            const {intrinsicVbe: vbe, intrinsicVbc: vbc} = q.bias;
            const h = 1e-6;
            for (const [dbe, dbc] of [[1, 0], [0, 1], [1, 1]]) {
                const plus = dcCurrents(q._intermod.p, polarity, vbe + dbe * h, vbc + dbc * h);
                const minus = dcCurrents(q._intermod.p, polarity, vbe - dbe * h, vbc - dbc * h);
                const base = gpi * dbe + gmu * dbc;
                const collector = (gm + go) * dbe - (go + gmu) * dbc;
                for (const [terminal, slope] of [base, collector, -base - collector].entries()) {
                    close(slope, (plus[terminal] - minus[terminal]) / (2 * h));
                }
            }
        }
    });
}

test('BFR93A package S and noise rows approach DC continuously without grounding a terminal', () => {
    const fList = [0, 1e-12, 1e-9, 1e-6, 1e-3, 1];
    for (const qPoint of [{ib: 0, vce: 5}, {ib: 20e-6, vce: 5}, {ib: 1e-3, vce: 0.1}]) {
        const q = NPN({model: 'BFR93A', qPoint, fList});
        const dc = q.spars[0], dcNoise = q.noise[0].C;
        assert.deepEqual(q.spars.map(row => row[0]), fList);
        assert.deepEqual(q.noise.map(row => row.frequency), fList);
        for (let frequency = 0; frequency < fList.length; frequency++) {
            const s = q.spars[frequency], covariance = q.noise[frequency].C;
            for (let i = 0; i < 3; i++) {
                let rowReal = 0, rowImaginary = 0, columnReal = 0, columnImaginary = 0;
                for (let j = 0; j < 3; j++) {
                    const value = s[1 + i * 3 + j], transposed = s[1 + j * 3 + i];
                    assert.ok(Number.isFinite(value.x) && Number.isFinite(value.y));
                    close(value.sub(dc[1 + i * 3 + j]).mag(), 0, 1e-10 + fList[frequency] * 1e-6);
                    rowReal += value.x; rowImaginary += value.y;
                    columnReal += transposed.x; columnImaginary += transposed.y;
                    const noise = covariance[i][j];
                    assert.ok(Number.isFinite(noise.x) && Number.isFinite(noise.y));
                    close(noise.x, covariance[j][i].x, 1e-30);
                    close(noise.y, -covariance[j][i].y, 1e-30);
                    close(noise.sub(dcNoise[i][j]).mag(), 0, 1e-28 + dcNoise[i][j].mag() * 1e-5);
                }
                close(rowReal, 1, 1e-10); close(rowImaginary, 0, 1e-10);
                close(columnReal, 1, 1e-10); close(columnImaginary, 0, 1e-10);
            }
        }
    }
});
