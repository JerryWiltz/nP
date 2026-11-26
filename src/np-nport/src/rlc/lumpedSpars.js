// Modified: 2026-11-26
import {complex} from '../../../np-math/src/complex';
import {analysisFrequencies} from '../analysisFrequencies';
import {requireNumber, checkedSpars} from '../numericValidation';
import {dcTwoPort} from './dcTwoPort';

function branchValue(arrangement, parameters, frequency) {
    const {resistance: r, inductance: l, capacitance: c} = parameters;
    if (arrangement === 'series') {
        if (c !== undefined && (c === 0 || frequency === 0)) return {limit: 'open'};
        const reactance = (l === undefined ? 0 : 2 * Math.PI * frequency * l) -
            (c === undefined ? 0 : 1 / (2 * Math.PI * frequency * c));
        if (reactance === 0) return {resistance: r === undefined ? 0 : r};
        return {value: complex(r === undefined ? 0 : r, reactance)};
    }
    if (r === 0 || (l !== undefined && (l === 0 || frequency === 0))) return {limit: 'short'};
    const susceptance = (c === undefined ? 0 : 2 * Math.PI * frequency * c) -
        (l === undefined ? 0 : 1 / (2 * Math.PI * frequency * l));
    if (susceptance === 0) return r === undefined ? {limit: 'open'} : {resistance: r};
    return {value: complex(r === undefined ? 0 : 1 / r, susceptance)};
}

function branchRow(placement, arrangement, branch, ro) {
    if (branch.resistance !== undefined) return dcTwoPort(placement === 'series' ? 'seriesR' : 'shuntR', branch.resistance, ro);
    if (branch.limit) {
        const mode = branch.limit === 'open' ? (placement === 'series' ? 'open' : 'short') :
            (placement === 'series' ? 'short' : 'shuntShort');
        return dcTwoPort(mode, 0, ro);
    }
    const value = branch.value, one = complex(1, 0), two = complex(2, 0);
    let reflection, transmission;
    if (arrangement === 'series') {
        if (placement === 'series') {
            const denominator = value.add(complex(2 * ro, 0));
            reflection = value.div(denominator);
            transmission = complex(2 * ro, 0).div(denominator);
        } else {
            const doubled = value.mul(two), denominator = doubled.add(complex(ro, 0));
            reflection = complex(-ro, 0).div(denominator);
            transmission = doubled.div(denominator);
        }
    } else if (placement === 'series') {
        const scaled = value.mul(complex(2 * ro, 0)), denominator = one.add(scaled);
        reflection = one.div(denominator);
        transmission = scaled.div(denominator);
    } else {
        const scaled = value.mul(complex(ro, 0)), denominator = two.add(scaled);
        reflection = scaled.neg().div(denominator);
        transmission = two.div(denominator);
    }
    return [reflection, transmission, transmission, reflection];
}

// The same series/parallel branch rules cover zero values, DC and exact resonance.
export function lumpedSpars(caller, settings, placement, arrangement, parameters) {
    const units = {resistance: 'ohms', inductance: 'henries', capacitance: 'farads'};
    for (const [name, value] of Object.entries(parameters)) requireNumber(caller, name + ' (' + units[name] + ')', value, {nonnegative: true});
    const rows = analysisFrequencies(settings).map(frequency => [frequency,
        ...branchRow(placement, arrangement, branchValue(arrangement, parameters, frequency), settings.Ro)]);
    return checkedSpars(caller, rows);
}
