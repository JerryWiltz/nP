// Modified: 2026-11-19
import * as nP from '../../src/index.js';

export function mosfetNetwork({name = 'NMOS', source = 'split', bypass = true, common = 'output', railOrder = 'collectorFirst', reordered = false, grouped = false, q, supply = 12, resistance = 1000, lowerBias = 47000} = {}) {
    const sign = name === 'PMOS' ? -1 : 1, device = q || nP[name]();
    const tee = nP.Tee(), short = nP.Short(), cap = nP.C(10e-9);
    const feedFirst = bypass && railOrder === 'collectorFirst';
    let rows = [
        [cap, 1, 2],
        [nP.Tee4(), 9, 2, 21, 3],
        [device, 3, 20, 11],
        [nP.R(100e3), 21, 6],
        [nP.R(lowerBias), 9, 10],
        [short, 10],
        feedFirst ? [tee, 18, 6, 8] : [tee, 16, 6, 7],
        [nP.V(sign * supply), feedFirst ? 7 : 16, 17],
        [short, 17],
        [nP.R(2200), 18, 19],
        common === 'output' ? [tee, 4, 20, 19] : [tee, 19, 20, 4],
        [cap, 4, 5]
    ];
    rows.push(...(bypass ? [feedFirst ? [tee, 16, 8, 7] : [tee, 18, 7, 8], [cap, feedFirst ? 16 : 8, 22], [short, 22]] : [[tee, 16, 6, 18]]));
    if (!bypass) rows.splice(6, 1);
    if (source === 'split') rows.push([tee, 11, 14, 12], [nP.R(resistance), 12, 13], [short, 13], [cap, 14, 15], [short, 15]);
    else rows.push([source === 'combined' ? nP.sePaRC(resistance, 10e-9) : nP.R(resistance), 11, 13], [short, 13]);
    if (device._dcModel.portCount === 4) { rows[2].push(23); rows.push([short, 23]); }
    if (reordered) rows = rows.reverse().map(([part, ...nodes]) => [part, ...nodes.map(node => node * 7 + 103)]);
    if (grouped) return nP.nodal({commonSource: rows}, {series: [[nP.R(25), 5, 99]]}, ['out', 1, 99]);
    return nP.nodal(...rows, ['out', ...(reordered ? [110, 138] : [1, 5])]);
}
