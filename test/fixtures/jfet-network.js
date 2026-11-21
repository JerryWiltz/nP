// Modified: 2026-11-20
import * as nP from '../../src/index.js';

export function jfetNetwork({name = 'NJF', source = 'split', bypass = true, common = 'output', reordered = false, grouped = false, q, supply, resistance = 2200, drainResistance = 2200} = {}) {
    const device = q || nP[name](), sign = name === 'PJF' ? -1 : 1;
    const tee = nP.Tee(), short = nP.Short(), cap = nP.C(10e-9);
    let rows = [
        [cap, 100, 1],
        [tee, 3, 1, 2],
        [nP.R(1e6), 3, 4],
        [short, 4],
        [device, 2, 5, 6],
        common === 'output' ? [tee, 8, 5, 7] : [tee, 7, 5, 8],
        [nP.R(drainResistance), 9, 7],
        [nP.V(supply === undefined ? 12 * sign : supply), bypass ? 15 : 9, 10],
        [short, 10],
        [cap, 8, 101]
    ];
    if (bypass) rows.push([tee, 16, 9, 15], [cap, 16, 17], [short, 17]);
    if (source === 'split') rows.push([tee, 6, 11, 13], [nP.R(resistance), 11, 12], [short, 12], [cap, 13, 14], [short, 14]);
    else rows.push([source === 'combined' ? nP.sePaRC(resistance, 10e-9) : nP.R(resistance), 6, 12], [short, 12]);
    if (reordered) rows = rows.reverse().map(([part, ...nodes]) => [part, ...nodes.map(node => 103 + 7 * node)]);
    if (grouped) return nP.nodal({commonSource: rows}, {series: [[nP.R(25), 101, 102]]}, ['out', 100, 102]);
    return nP.nodal(...rows, ['out', ...(reordered ? [803, 810] : [100, 101])]);
}
