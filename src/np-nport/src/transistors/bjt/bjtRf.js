// Modified: 2026-11-15
import {complex} from '../../../../np-math/src/complex';
import {matrix} from '../../../../np-math/src/matrix';
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../../physicalConstants';
import {powers} from './taylor';

function zero() { return complex(0, 0); }
function conjugate(value) { return complex(value.x, -value.y); }
function zeros(count) { return Array.from({length: count}, zero); }
function root(parents, node) {
    while (parents[node] !== node) node = parents[node];
    return node;
}
function join(parents, a, b) { parents[root(parents, a)] = root(parents, b); }
function stampBranch(system, a, b, admittance) {
    system[a][a] = system[a][a].add(admittance);
    system[b][b] = system[b][b].add(admittance);
    system[a][b] = system[a][b].sub(admittance);
    system[b][a] = system[b][a].sub(admittance);
}
function covarianceSource(covariance, inverse, nodes, a, b, density, ro) {
    if (density === 0) return;
    const response = [];
    for (let port = 0; port < 3; port++) {
        response.push(inverse[nodes[port]][nodes[b]].sub(inverse[nodes[port]][nodes[a]])
            .mul(complex(1 / Math.sqrt(ro), 0)));
    }
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            covariance[i][j] = covariance[i][j].add(response[i].mul(conjugate(response[j]))
                .mul(complex(density, 0)));
        }
    }
}
// Solve one linearized floating three-terminal device. The three 1/Ro port
// terminations establish the reference; no internal transistor terminal is grounded.
export function bjtFrequencyRow(model, frequency) {
    if (model.rows.has(frequency)) return model.rows.get(frequency);
    const {p, point, record, referenceImpedance: ro, temperature} = model;
    const resistors = [[3, 6, p.RB], [4, 7, p.RC], [5, 8, p.RE]];
    const parents = Array.from({length: 11}, (_, i) => i);
    if (!record.inductors.length) {
        join(parents, 0, 3); join(parents, 1, 4); join(parents, 2, 5);
        join(parents, 0, 9); join(parents, 2, 10);
    }
    for (const [a, b, resistance] of resistors) if (resistance === 0) join(parents, a, b);
    if (frequency === 0) for (const [a, b] of record.inductors) join(parents, a, b);
    const indices = new Map(), nodes = [];
    for (let i = 0; i < 11; i++) {
        const group = root(parents, i);
        if (!indices.has(group)) indices.set(group, indices.size);
        nodes[i] = indices.get(group);
    }
    const system = Array.from({length: indices.size}, () => zeros(indices.size)), omega = 2 * Math.PI * frequency;
    for (let port = 0; port < 3; port++) {
        system[nodes[port]][nodes[port]] = system[nodes[port]][nodes[port]].add(complex(1 / ro, 0));
    }
    for (const [a, b, resistance] of resistors) {
        if (resistance > 0) stampBranch(system, nodes[a], nodes[b], complex(1 / resistance, 0));
    }
    if (frequency > 0) for (const [a, b, inductance] of record.inductors) {
        stampBranch(system, nodes[a], nodes[b], complex(0, -1 / (omega * inductance)));
    }
    for (const [a, b, capacitance] of record.capacitors) {
        stampBranch(system, nodes[a], nodes[b], complex(0, omega * capacitance));
    }
    for (let terminal = 0; terminal < 3; terminal++) {
        const current = point.data.currents[terminal], charge = point.data.charges[terminal];
        const be = complex(current[1], omega * charge[1]), bc = complex(current[2], omega * charge[2]);
        const row = system[nodes[terminal + 6]];
        row[nodes[6]] = row[nodes[6]].add(be).add(bc);
        row[nodes[7]] = row[nodes[7]].sub(bc);
        row[nodes[8]] = row[nodes[8]].sub(be);
    }
    const inverse = matrix(system).invertCplx().m, spars = [frequency];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            spars.push(inverse[nodes[i]][nodes[j]].mul(complex(2 / ro, 0))
                .sub(complex(i === j ? 1 : 0, 0)));
        }
    }
    const covariance = Array.from({length: 3}, () => zeros(3));
    for (const [a, b, resistance] of resistors) {
        if (resistance > 0) covarianceSource(covariance, inverse, nodes, a, b,
            4 * BOLTZMANN * temperature / resistance, ro);
    }
    covarianceSource(covariance, inverse, nodes, 6, 8, 2 * ELEMENTARY_CHARGE * Math.abs(point.ib), ro);
    covarianceSource(covariance, inverse, nodes, 7, 8, 2 * ELEMENTARY_CHARGE * Math.abs(point.ic), ro);
    // The supplied cards have KF=0; retain the equation rather than invent a fit.
    if (p.KF > 0 && frequency > 0) covarianceSource(covariance, inverse, nodes, 6, 8,
        p.KF * Math.abs(point.ib) ** p.AF / frequency, ro);
    const result = {spars, noise: {frequency, C: covariance}, inverse, nodes};
    model.rows.set(frequency, result);
    return result;
}
function internalVoltages(model, frequency, incident) {
    const {inverse, nodes} = bjtFrequencyRow(model, frequency), voltages = zeros(3);
    for (let terminal = 0; terminal < 3; terminal++) {
        for (let port = 0; port < 3; port++) {
            voltages[terminal] = voltages[terminal].add(inverse[nodes[terminal + 6]][nodes[port]]
                .mul(incident[port]).mul(complex(2 / Math.sqrt(model.referenceImpedance), 0)));
        }
    }
    return [voltages[0].sub(voltages[2]), voltages[0].sub(voltages[1])];
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
// Third-order Taylor source calculation. Fourier coefficients use peak/2;
// conversion back to RMS is explicit, including mixed VBE/VBC terms and dQ/dt.
// Like the diode engine, this is direct weak nonlinearity, not harmonic balance.
export function bjtProducts(model, frequency, context, tones) {
    const first = internalVoltages(model, tones.f1, context.input1);
    const second = internalVoltages(model, tones.f2, context.input2);
    const variables = [toneSpectrum(first[0], second[0]), toneSpectrum(first[1], second[1])];
    const currents = zeros(3), omega = 2 * Math.PI * frequency;
    for (let term = 3; term < powers.length; term++) {
        let spectrum = new Map([['0,0', complex(1, 0)]]);
        for (let variable = 0; variable < 2; variable++) {
            for (let degree = 0; degree < powers[term][variable]; degree++) {
                spectrum = convolve(spectrum, variables[variable]);
            }
        }
        let amplitude = zero();
        for (const [key, value] of spectrum) {
            const [n1, n2] = key.split(',').map(Number);
            if (Math.abs(n1 * tones.f1 + n2 * tones.f2 - frequency) <= Math.max(frequency, tones.f2) * 1e-13) {
                amplitude = amplitude.add(value.mul(complex(Math.sqrt(2), 0)));
            }
        }
        for (let terminal = 0; terminal < 3; terminal++) {
            currents[terminal] = currents[terminal].add(amplitude.mul(complex(
                model.point.data.currents[terminal][term], omega * model.point.data.charges[terminal][term])));
        }
    }
    const {inverse, nodes} = bjtFrequencyRow(model, frequency), output = zeros(3);
    for (let port = 0; port < 3; port++) {
        for (let terminal = 0; terminal < 3; terminal++) {
            output[port] = output[port].sub(inverse[nodes[port]][nodes[terminal + 6]]
                .mul(currents[terminal]).mul(complex(1 / Math.sqrt(model.referenceImpedance), 0)));
        }
    }
    return output;
}
