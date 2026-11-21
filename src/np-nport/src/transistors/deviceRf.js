// Modified: 2026-11-20
// Floating nonlinear devices: public ports, intrinsic terminals and independent
// control-voltage pairs are distinct. This also permits an internal body tie.
import {complex} from '../../../np-math/src/complex';
import {matrix} from '../../../np-math/src/matrix';
import {BOLTZMANN} from '../physicalConstants';
import {powers as bipolarPowers} from './bjt/taylor';
function zero() { return complex(0, 0); }
function zeros(count) { return Array.from({length: count}, zero); }
function conjugate(z) { return complex(z.x, -z.y); }
function root(parents, node) { while (parents[node] !== node) node = parents[node]; return node; }
function join(parents, a, b) { parents[root(parents, a)] = root(parents, b); }
function description(model) {
    if (model.rfTopology) return model.rfTopology;
    // Preserve the established BJT package node convention and JFET adapter.
    return {nodeCount: 11, ports: [0, 1, 2], intrinsic: [6, 7, 8], controls: [[0, 2], [0, 1]], powers: bipolarPowers,
        joins: model.record.inductors.length ? [] : [[0, 3], [1, 4], [2, 5], [0, 9], [2, 10]],
        resistors: model.seriesResistances.map((resistance, port) => [port + 3, port + 6, resistance]),
        inductors: model.record.inductors, capacitors: model.record.capacitors};
}
function stampBranch(system, a, b, y) {
    system[a][a] = system[a][a].add(y); system[b][b] = system[b][b].add(y);
    system[a][b] = system[a][b].sub(y); system[b][a] = system[b][a].sub(y);
}
function stampInductor(system, a, b, branch, reactance) {
    const one = complex(1, 0);
    system[a][branch] = system[a][branch].add(one); system[b][branch] = system[b][branch].sub(one);
    system[branch][a] = system[branch][a].add(one); system[branch][b] = system[branch][b].sub(one);
    system[branch][branch] = complex(0, -reactance);
}
function sourceResponse(inverse, nodes, a, b, ro, ports) {
    return ports.map(port => inverse[nodes[port]][nodes[b]].sub(inverse[nodes[port]][nodes[a]])
        .mul(complex(1 / Math.sqrt(ro), 0)));
}
function covarianceSource(covariance, inverse, nodes, a, b, density, ro, ports) {
    if (density === 0) return;
    const response = sourceResponse(inverse, nodes, a, b, ro, ports);
    for (let i = 0; i < ports.length; i++) for (let j = 0; j < ports.length; j++) {
        covariance[i][j] = covariance[i][j].add(response[i].mul(conjugate(response[j])).mul(complex(density, 0)));
    }
}
function covarianceCorrelation(covariance, inverse, nodes, intrinsic, correlation, ro, ports) {
    const [a, b] = correlation.first, [c, d] = correlation.second, density = correlation.density;
    const first = sourceResponse(inverse, nodes, intrinsic[a], intrinsic[b], ro, ports);
    const second = sourceResponse(inverse, nodes, intrinsic[c], intrinsic[d], ro, ports);
    for (let i = 0; i < ports.length; i++) for (let j = 0; j < ports.length; j++) {
        covariance[i][j] = covariance[i][j].add(first[i].mul(conjugate(second[j])).mul(density))
            .add(second[i].mul(conjugate(first[j])).mul(conjugate(density)));
    }
}
function seriesRcAdmittance(resistance, capacitance, omega) {
    return omega === 0 ? zero() : complex(resistance, -1 / (omega * capacitance)).inv();
}
export function deviceFrequencyRow(model, frequency) {
    if (model.rows.has(frequency)) return model.rows.get(frequency);
    const network = description(model), {point, referenceImpedance: ro, temperature} = model;
    const {ports, intrinsic, controls, resistors, inductors, capacitors} = network;
    const parents = Array.from({length: network.nodeCount}, (_, i) => i);
    for (const [a, b] of network.joins) join(parents, a, b);
    for (const [a, b, resistance] of resistors) if (resistance === 0) join(parents, a, b);
    const indices = new Map(), nodes = parents.map((_, i) => {
        const group = root(parents, i);
        if (!indices.has(group)) indices.set(group, indices.size);
        return indices.get(group);
    });
    const size = indices.size + inductors.length, omega = 2 * Math.PI * frequency;
    const system = Array.from({length: size}, () => zeros(size));
    for (const port of ports) system[nodes[port]][nodes[port]] = system[nodes[port]][nodes[port]].add(complex(1 / ro, 0));
    for (const [a, b, resistance] of resistors) if (resistance > 0) stampBranch(system, nodes[a], nodes[b], complex(1 / resistance, 0));
    inductors.forEach(([a, b, value], i) => stampInductor(system, nodes[a], nodes[b], indices.size + i, omega * value));
    for (const [a, b, value] of capacitors) stampBranch(system, nodes[a], nodes[b], complex(0, omega * value));
    for (const [a, b, resistance, capacitance] of network.seriesRC || []) {
        stampBranch(system, nodes[a], nodes[b], seriesRcAdmittance(resistance, capacitance, omega));
    }
    intrinsic.forEach((terminal, i) => {
        const current = point.data.currents[i], charge = point.data.charges[i], row = system[nodes[terminal]];
        controls.forEach(([a, b], axis) => {
            const derivative = complex(current[axis + 1], omega * charge[axis + 1]);
            row[nodes[intrinsic[a]]] = row[nodes[intrinsic[a]]].add(derivative);
            row[nodes[intrinsic[b]]] = row[nodes[intrinsic[b]]].sub(derivative);
        });
    });
    for (const cap of point.data.capacitances || []) {
        const [a, b] = controls[cap.control], y = complex(0, omega * cap.coefficients[0]);
        for (const [terminal, sign] of [[cap.positive, 1], [cap.negative, -1]]) {
            const row = system[nodes[intrinsic[terminal]]], value = y.mul(complex(sign, 0));
            row[nodes[intrinsic[a]]] = row[nodes[intrinsic[a]]].add(value);
            row[nodes[intrinsic[b]]] = row[nodes[intrinsic[b]]].sub(value);
        }
    }
    const inverse = matrix(system).invertCplx().m, spars = [frequency];
    for (const i of ports) for (const j of ports) spars.push(inverse[nodes[i]][nodes[j]].mul(complex(2 / ro, 0)).sub(complex(i === j ? 1 : 0, 0)));
    const covariance = Array.from({length: ports.length}, () => zeros(ports.length));
    for (const [a, b, resistance] of resistors) if (resistance > 0) covarianceSource(covariance, inverse, nodes, a, b,
        4 * BOLTZMANN * temperature / resistance, ro, ports);
    for (const [a, b, resistance, capacitance, thermalNoise = true] of network.seriesRC || []) {
        if (thermalNoise) covarianceSource(covariance, inverse, nodes, a, b,
            4 * BOLTZMANN * temperature * seriesRcAdmittance(resistance, capacitance, omega).x, ro, ports);
    }
    for (const [a, b, density] of model.noiseSources(frequency)) covarianceSource(covariance, inverse, nodes, intrinsic[a], intrinsic[b], density, ro, ports);
    for (const correlation of model.noiseCorrelations?.(frequency) || []) {
        covarianceCorrelation(covariance, inverse, nodes, intrinsic, correlation, ro, ports);
    }
    const result = {spars, noise: {frequency, C: covariance}, inverse, nodes};
    model.rows.set(frequency, result); return result;
}
function internalVoltages(model, frequency, incident) {
    const network = description(model), {inverse, nodes} = deviceFrequencyRow(model, frequency);
    const voltages = network.intrinsic.map(terminal => network.ports.reduce((sum, port, i) => sum.add(inverse[nodes[terminal]][nodes[port]]
        .mul(incident[i]).mul(complex(2 / Math.sqrt(model.referenceImpedance), 0))), zero()));
    return network.controls.map(([a, b]) => voltages[a].sub(voltages[b]));
}
function convolve(a, b) {
    const result = new Map();
    for (const [keyA, valueA] of a) {
        const [a1, a2] = keyA.split(',').map(Number);
        for (const [keyB, valueB] of b) {
            const [b1, b2] = keyB.split(',').map(Number), key = [a1 + b1, a2 + b2].join(',');
            result.set(key, (result.get(key) || zero()).add(valueA.mul(valueB)));
        }
    }
    return result;
}
function toneSpectrum(first, second) {
    const rms = complex(1 / Math.sqrt(2), 0);
    return new Map([['1,0', first.mul(rms)], ['-1,0', conjugate(first).mul(rms)],
        ['0,1', second.mul(rms)], ['0,-1', conjugate(second).mul(rms)]]);
}
function monomialSpectrum(variables, power) {
    let spectrum = new Map([['0,0', complex(1, 0)]]);
    for (let axis = 0; axis < variables.length; axis++) for (let degree = 0; degree < power[axis]; degree++) spectrum = convolve(spectrum, variables[axis]);
    return spectrum;
}
function spectrumAmplitude(spectrum, frequency, tones) {
    let amplitude = zero();
    for (const [key, value] of spectrum) {
        const [n1, n2] = key.split(',').map(Number);
        if (Math.abs(n1 * tones.f1 + n2 * tones.f2 - frequency) <= Math.max(frequency, tones.f2) * 1e-13) amplitude = amplitude.add(value.mul(complex(Math.sqrt(2), 0)));
    }
    return amplitude;
}
function differentiatedSpectrum(spectrum, tones) {
    return new Map([...spectrum].map(([key, value]) => {
        const [n1, n2] = key.split(',').map(Number);
        return [key, value.mul(complex(0, 2 * Math.PI * (n1 * tones.f1 + n2 * tones.f2)))];
    }));
}
// Direct weak Taylor sources, including dQ/dt and differential C(V) dV/dt.
// This omits quadratic remixing and is not a harmonic-balance solver.
export function deviceProducts(model, frequency, context, tones) {
    const network = description(model), first = internalVoltages(model, tones.f1, context.input1);
    const second = internalVoltages(model, tones.f2, context.input2), variables = first.map((value, i) => toneSpectrum(value, second[i]));
    const currents = zeros(network.intrinsic.length), omega = 2 * Math.PI * frequency;
    for (const [term, power] of network.powers.entries()) {
        if (power.reduce((sum, degree) => sum + degree, 0) < 2) continue;
        const amplitude = spectrumAmplitude(monomialSpectrum(variables, power), frequency, tones);
        for (let terminal = 0; terminal < currents.length; terminal++) currents[terminal] = currents[terminal].add(amplitude.mul(complex(
            model.point.data.currents[terminal][term], omega * model.point.data.charges[terminal][term])));
    }
    for (const cap of model.point.data.capacitances || []) {
        const derivative = differentiatedSpectrum(variables[cap.control], tones);
        for (const [term, power] of network.powers.entries()) {
            const degree = power.reduce((sum, count) => sum + count, 0);
            if (degree < 1 || degree > 2 || cap.coefficients[term] === 0) continue;
            const spectrum = convolve(monomialSpectrum(variables, power), derivative);
            const current = spectrumAmplitude(spectrum, frequency, tones).mul(complex(cap.coefficients[term], 0));
            currents[cap.positive] = currents[cap.positive].add(current);
            currents[cap.negative] = currents[cap.negative].sub(current);
        }
    }
    const {inverse, nodes} = deviceFrequencyRow(model, frequency);
    return network.ports.map(port => network.intrinsic.reduce((sum, terminal, i) => sum.sub(inverse[nodes[port]][nodes[terminal]]
        .mul(currents[i]).mul(complex(1 / Math.sqrt(model.referenceImpedance), 0))), zero()));
}
