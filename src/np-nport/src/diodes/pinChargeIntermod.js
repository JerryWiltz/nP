// Modified: 2026-11-22
import {complex} from '../../../np-math/src/complex';
import {pinStorage} from './pinChargeEquations';
import {pinChargeLinear} from './pinChargeRf';

function zero() { return complex(0, 0); }
function conjugate(value) { return complex(value.x, -value.y); }
function add(a, b, scale = 1) {
    const result = new Map(a);
    for (const [key, value] of b) result.set(key, (result.get(key) || zero()).add(value.mul(complex(scale, 0))));
    return result;
}
function scale(spectrum, factor) { return new Map([...spectrum].map(([key, value]) => [key, value.mul(complex(factor, 0))])); }
function multiply(a, b) {
    const result = new Map();
    for (const [ka, va] of a) for (const [kb, vb] of b) {
        const aa = ka.split(',').map(Number), bb = kb.split(',').map(Number), key = [aa[0] + bb[0], aa[1] + bb[1]].join(',');
        result.set(key, (result.get(key) || zero()).add(va.mul(vb)));
    }
    return result;
}
function filter(spectrum, model, tones, selector) {
    return new Map([...spectrum].map(([key, value]) => {
        const [a, b] = key.split(',').map(Number), frequency = a * tones.f1 + b * tones.f2;
        return [key, value.mul(selector(pinStorage(model.record, frequency)))];
    }));
}
function tones(first, second) {
    return new Map([['1,0', first], ['-1,0', conjugate(first)], ['0,1', second], ['0,-1', conjugate(second)]]
        .map(([key, value]) => [key, value.mul(complex(1 / Math.sqrt(2), 0))]));
}
function intrinsicVoltage(nport, frequency, incident, response, ro) {
    const row = nport.spars.find(item => item[0] === frequency);
    const reflected = incident.map((_, i) => incident.reduce((sum, wave, j) => sum.add(row[1 + 2 * i + j].mul(wave)), zero()));
    return incident[0].add(reflected[0]).sub(incident[1].add(reflected[1]))
        .mul(complex(Math.sqrt(ro), 0)).div(response.leadFactor);
}

function frequencyAt(key, tone) {
    const [a, b] = key.split(',').map(Number);
    return a * tone.f1 + b * tone.f2;
}
function mapped(spectrum, model, tone, response) {
    return new Map([...spectrum].map(([key, value]) => [key, response(value, pinChargeLinear(model, frequencyAt(key, tone)))]));
}
function norton(inl, vnl, charge, model, tone) {
    const result = new Map();
    for (const key of new Set([...inl.keys(), ...vnl.keys(), ...charge.keys()])) {
        const frequency = frequencyAt(key, tone), response = pinChargeLinear(model, frequency);
        result.set(key, (inl.get(key) || zero()).sub((vnl.get(key) || zero()).mul(response.branch))
            .add((charge.get(key) || zero()).mul(complex(0, 2 * Math.PI * frequency))));
    }
    return result;
}
function sources(nport, context, tone, model) {
    const r1 = pinChargeLinear(model, tone.f1), r2 = pinChargeLinear(model, tone.f2);
    const v1 = intrinsicVoltage(nport, tone.f1, context.input1, r1, model.referenceImpedance);
    const v2 = intrinsicVoltage(nport, tone.f2, context.input2, r2, model.referenceImpedance);
    const voltage = tones(v1, v2), u = tones(v1.mul(r1.junctionTransfer), v2.mul(r2.junctionTransfer));
    const f = model.point.pair.data, rr = r1.resistance, e = r1.lifetime, i0 = model.point.bulkCurrent;
    const d1 = scale(u, f[1]), x1 = filter(d1, model, tone, s => s.control);
    const i1 = add(filter(d1, model, tone, s => s.current), scale(d1, e[1]));
    const d2nl = scale(multiply(u, u), f[3]);
    const i2nl = add(add(filter(d2nl, model, tone, s => s.current), scale(d2nl, e[1])), scale(multiply(d1, d1), e[3]));
    const x2nl = filter(d2nl, model, tone, s => s.control);
    let v2nl = add(scale(i2nl, rr[0]), scale(x2nl, i0 * rr[1]));
    v2nl = add(v2nl, scale(multiply(x1, i1), rr[1]));
    v2nl = add(v2nl, scale(multiply(x1, x1), i0 * rr[3]));
    const dep = model.point.depletion;
    const q2 = scale(multiply(voltage, voltage), dep.derivative / 2);
    const n2 = norton(i2nl, v2nl, q2, model, tone);
    // Second-order voltages under zero product-frequency incident waves.
    // Keep DC/difference/harmonic feedback when forming third-order sources.
    const core2 = mapped(n2, model, tone, (value, r) => value.neg().mul(r.loadFactor).div(r.productDenominator));
    const u2 = mapped(add(core2, v2nl, -1), model, tone, (value, r) => value.mul(r.junctionTransfer));
    const d2 = add(d2nl, scale(u2, f[1]));
    const x2 = filter(d2, model, tone, s => s.control);
    const i2 = add(add(filter(d2, model, tone, s => s.current), scale(d2, e[1])), scale(multiply(d1, d1), e[3]));
    const d3nl = add(scale(multiply(u, u2), 2 * f[3]), scale(multiply(multiply(u, u), u), f[6]));
    let i3nl = add(filter(d3nl, model, tone, s => s.current), scale(d3nl, e[1]));
    i3nl = add(i3nl, scale(multiply(d1, d2), 2 * e[3]));
    i3nl = add(i3nl, scale(multiply(multiply(d1, d1), d1), e[6]));
    const x3nl = filter(d3nl, model, tone, s => s.control);
    let v3nl = add(scale(i3nl, rr[0]), scale(x3nl, i0 * rr[1]));
    v3nl = add(v3nl, scale(add(multiply(x1, i2), multiply(x2, i1)), rr[1]));
    v3nl = add(v3nl, scale(multiply(x1, x2), 2 * i0 * rr[3]));
    v3nl = add(v3nl, scale(multiply(multiply(x1, x1), i1), rr[3]));
    v3nl = add(v3nl, scale(multiply(multiply(x1, x1), x1), i0 * rr[6]));
    const q3 = add(scale(multiply(voltage, core2), dep.derivative), scale(multiply(multiply(voltage, voltage), voltage), dep.second / 6));
    return add(n2, norton(i3nl, v3nl, q3, model, tone));
}

// Cubic Volterra expansion includes the device's local second-order feedback
// with real Ro terminations. The network engine does not yet feed generated
// second-order waves between different nonlinear components back into IM3.
export function pinChargeProducts(nport, frequency, context, tone, model) {
    if (Number.isFinite(model.record.parameters.IKF) && model.point.junctionCurrent === 0) {
        throw new RangeError('PIN with finite IKF has no unique cubic Taylor expansion at exactly zero junction current.');
    }
    const key = JSON.stringify([tone, context.input1, context.input2]);
    if (model.productKey !== key) {
        model.productKey = key;
        model.productSources = sources(nport, context, tone, model);
    }
    let source = zero();
    for (const [key, value] of model.productSources) {
        if (Math.abs(frequencyAt(key, tone) - frequency) <= Math.max(frequency, tone.f2) * 1e-13) source = source.add(value);
    }
    const response = pinChargeLinear(model, frequency);
    const wave = source.mul(complex(Math.sqrt(2 * model.referenceImpedance), 0)).div(response.productDenominator);
    return [wave.neg(), wave];
}
