// Modified: 2026-11-22
// Development-only audit: math.js never enters the nP runtime bundles.
import assert from 'node:assert/strict';
import {parse, derivative, unit, evaluate, symbolicEqual, simplify, simplifyCore, rationalize, ConstantNode, bignumber} from 'mathjs';
import {semiconductorCases, taylorCases, parameterUnits} from './equation-cases.mjs';

const expressions = new Map(), differentials = new Map(), compiled = new WeakMap();
const counts = {algebra: 0, coefficients: 0, dimensions: 0, capacitances: 0};
const failures = [];

function foldConstants(node, seen = new WeakMap()) {
    if (seen.has(node)) return seen.get(node);
    const mapped = node.map(child => foldConstants(child, seen));
    const folded = mapped.isOperatorNode && mapped.args.every(child => child.isConstantNode) ?
        new ConstantNode(mapped.evaluate()) : mapped;
    seen.set(node, folded);
    return folded;
}

function expression(text) {
    if (!expressions.has(text)) expressions.set(text, parse(text));
    return expressions.get(text);
}
function differential(text, variables, powers) {
    const key = JSON.stringify([text, variables, powers]);
    if (!differentials.has(key)) {
        const last = powers.findIndex(degree => degree > 0);
        let node;
        if (last < 0) node = expression(text);
        else {
            const previous = powers.slice(); previous[last]--;
            // Fold constant exponents before removing zero factors. Otherwise a
            // mathematically zero polynomial derivative can evaluate as 0*Infinity.
            node = simplifyCore(foldConstants(derivative(differential(text, variables, previous), variables[last], {simplify: false})));
        }
        differentials.set(key, node);
    }
    return differentials.get(key);
}
function valueAt(node, scope) {
    if (!compiled.has(node)) compiled.set(node, node.compile());
    return compiled.get(node).evaluate(scope);
}
function compositions(degree, dimensions) {
    if (dimensions === 1) return [[degree]];
    const result = [];
    for (let first = degree; first >= 0; first--) {
        for (const rest of compositions(degree - first, dimensions - 1)) result.push([first, ...rest]);
    }
    return result;
}
function powersFor(dimensions, maximum = 3) {
    return Array.from({length: maximum + 1}, (_, degree) => compositions(degree, dimensions)).flat();
}
function denominator(powers) { return powers.reduce((product, degree) => product * [1, 1, 2, 6][degree], 1); }
function close(actual, expected, baseUnit, label) {
    const absolute = baseUnit === 'C' ? 1e-26 : baseUnit === 'A' ? 1e-18 : 1e-12;
    if (!Number.isFinite(actual) || !Number.isFinite(expected) ||
        Math.abs(actual - expected) > absolute + 3e-8 * Math.max(Math.abs(actual), Math.abs(expected))) {
        throw new Error(`${label}: nP=${actual}, math.js=${expected}`);
    }
}
function scopeWithUnits(scope, dimensionless) {
    const result = {};
    for (const [name, value] of Object.entries(scope)) {
        if (Object.hasOwn(parameterUnits, name)) {
            const dimension = dimensionless ? '' : parameterUnits[name];
            result[name] = dimension ? unit(value, dimension) : value;
        }
    }
    return result;
}
function requireDimension(value, expected, node) {
    // A derivative that simplifies to literal zero has no remaining unit factors.
    if (value === 0 && node.isConstantNode) return;
    if (expected === '' || unit(1, expected).dimensions.every(power => power === 0)) {
        if (typeof value !== 'number' && (!value?.isUnit || value.dimensions.some(power => power !== 0))) {
            throw new Error(`expected dimensionless value, received ${value?.toString()}`);
        }
    } else {
        if (!value?.isUnit || !value.equalBase(unit(1, expected))) {
            throw new Error(`expected ${expected}, received ${value?.toString()}`);
        }
        value.toNumber(expected);
    }
}
function check(label, category, action) {
    try { action(); counts[category]++; }
    catch (error) { failures.push({label, category, message: error.message}); }
}

// Both acceptance and rejection checks verify that the audit tools enforce the
// intended contracts. Algebra uses a real-variable context that retains domains.
for (const [left, right, polynomial] of [
    ['(x-y)^2', 'x^2-2*x*y+y^2', true],
    ['1-(1-a*d/3)^3', 'a*d-a^2*d^2/3+a^3*d^3/27', true],
    [derivative('IS*(exp(x/vt)-1)', 'x'), 'IS*exp(x/vt)/vt'],
    [derivative('2*c*p*(1-sqrt(1-x/p))', 'x'), 'c/sqrt(1-x/p)'],
    // Avalanche common-pole cancellation: N is the Zd numerator; e=1-r².
    ['R*(N/e)/(R+N/e)', 'R*N/(R*e+N)', 'rational'],
    ['(B/e)*R/(R+N/e)', 'B*R/(R*e+N)', 'rational']
]) {
    check(`algebra ${left}`, 'algebra', () => {
        if (polynomial === 'rational') {
            // Establish a zero residual numerator on the original nonsingular
            // domain. Continuity at the cancelled pole is tested numerically.
            const residual = rationalize(`(${left})-(${right})`, {}, true);
            assert.equal(simplify(residual.numerator).toString(), '0');
            return;
        }
        // symbolicEqual alone does not expand arbitrary polynomial powers.
        const a = polynomial ? rationalize(left) : left, b = polynomial ? rationalize(right) : right;
        assert.ok(symbolicEqual(a, b, simplify.realContext), 'math.js could not establish this identity');
    });
}
assert.equal(symbolicEqual('x+y', 'x-y', simplify.realContext), false);
assert.throws(() => evaluate('v+i', {v: unit(1, 'V'), i: unit(1, 'A')}));
assert.throws(() => evaluate('exp(v)', {v: unit(1, 'V')}));
assert.throws(() => requireDimension(evaluate('c/v', {c: unit(1, 'F'), v: unit(1, 'V')}), 'C', parse('c/v')));

let family;
for (const item of [...taylorCases(), ...semiconductorCases()]) {
    const nextFamily = item.label.split(' ')[0];
    if (nextFamily !== family) { console.log(`Checking ${nextFamily}`); family = nextFamily; }
    const basis = powersFor(item.variables.length), dimensionless = Object.values(item.units).every(value => value === '');
    const unitScope = scopeWithUnits(item.scope, dimensionless);
    for (const [name, text] of Object.entries(item.expressions)) {
        for (const [index, powers] of basis.entries()) {
            const label = `${item.label} ${name} d(${powers.join(',')})`, baseUnit = item.units[name];
            let node;
            check(label, 'coefficients', () => {
                node = differential(text, item.variables, powers);
                const scope = item.highPrecision ? Object.fromEntries(Object.entries(item.scope).map(([key, value]) =>
                    [key, typeof value === 'number' && Number.isFinite(value) ? bignumber(value) : value])) : item.scope;
                const expected = valueAt(node, scope) / denominator(powers);
                close(item.actual[name][index], expected, baseUnit, label);
            });
            if (node && !dimensionless) check(label, 'dimensions', () => {
                const factors = powers.flatMap((degree, axis) => degree ? [`${parameterUnits[item.variables[axis]] || 'V'}^${degree}`] : []);
                const expected = factors.length ? `${baseUnit} / (${factors.join(' * ')})` : baseUnit;
                requireDimension(valueAt(node, unitScope), expected, node);
            });
        }
    }
    // MES1 uses differential C(V)*dV/dt branches, rather than separate static
    // Qgs/Qgd. Check all available mixed capacitance terms through degree two.
    if (item.actual.capacitances) for (const cap of item.actual.capacitances) {
        for (const [index, powers] of powersFor(2, 2).entries()) {
            const target = powers.slice(); target[cap.control]++;
            check(`${item.label} capacitance ${cap.control} d(${powers})`, 'capacitances', () => {
                const expected = valueAt(differential(item.expressions.gateCharge, item.variables, target), item.scope) / denominator(powers);
                close(cap.coefficients[index], expected, 'C', 'MES1 capacitance');
            });
        }
    }
}

// Basic RF/DC and noise dimensions use explicit SI annotations, including
// spectral densities. These are witnesses, not inferred units for every JS line.
const physicalScope = {
    k: unit(1.380649e-23, 'J / K'), T: unit(300, 'K'), q: unit(1.602176634e-19, 'C'),
    R: unit(50, 'ohm'), V: unit(1, 'V'), I: unit(.01, 'A'),
    c: unit(1e-12, 'F'), L: unit(1e-9, 'H'), f: unit(1e9, 'Hz'),
    gm: unit(.05, 'S'), omega: unit(2 * Math.PI * 1e9, '1 / s'), transit: unit(1e-9, 's'),
    M2: 100, Sv: unit(1e-15, 'V^2 / Hz')
};
for (const [text, expected] of [
    ['k*T/q', 'V'], ['V/I', 'ohm'], ['V/R', 'A'], ['c*V', 'C'], ['transit*I', 'C'],
    ['omega*L', 'ohm'], ['1/(omega*c)', 'ohm'], ['gm*V', 'A'],
    ['4*k*T*R', 'V^2 / Hz'], ['4*k*T/R', 'A^2 / Hz'], ['2*q*I', 'A^2 / Hz'],
    ['4*k*T*gm', 'A^2 / Hz'], ['4*k*T*c^2*omega^2/gm', 'A^2 / Hz'],
    ['2*q*I*M2', 'A^2 / Hz'], ['Sv/(4*k*R)', 'K'], ['Sv/R', 'W / Hz'],
    ['omega*transit', ''], ['f/f', '']
]) check(`SI ${text}`, 'dimensions', () => requireDimension(evaluate(text, physicalScope), expected, parse(text)));
for (const [text, expected] of [['1 pF', 1e-12], ['1 nH', 1e-9], ['1 mA', 1e-3], ['1 GHz', 1e9]]) {
    check(`SI conversion ${text}`, 'dimensions', () => assert.equal(evaluate(text).value, expected));
}

console.log('math.js equation audit (sampled domains; no measured-device validation)');
console.log(JSON.stringify({passed: counts, failed: failures.length}, null, 2));
const groups = new Map();
for (const failure of failures) {
    const key = `${failure.category}: ${failure.label.replace(/ d\(.*$/, '')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(failure.message);
}
for (const [key, messages] of groups) {
    console.error(`FAIL ${key} (${messages.length} checks)`);
    for (const message of messages.slice(0, 2)) console.error(`  ${message}`);
}
if (failures.length) process.exitCode = 1;
