// Modified: 2026-11-25
import * as nP from '../../src/index.js';

export function singleDetector(model = 'SMS7630', temperature = 300.15, loadOhms = 10000) {
    const d = nP.D({model, qPoint: {vd: 0.4}, temperature});
    const input = nP.Tee(), output = nP.Tee(), ground = nP.Short();
    const choke = nP.L(1e-6), coupling = nP.C(1e-9), bypass = nP.C(1e-10), load = nP.R(loadOhms);
    return nP.nodal(
        [coupling, 'rf', 'input'],
        [input, 'choke', 'input', 'anode'],
        [choke, 'choke', 'return'],
        [ground, 'return'],
        [d, 'anode', 'cathode'],
        [output, 'cathode', 'load', 'bypass'],
        [load, 'load', 'ground'],
        [ground, 'ground'],
        [bypass, 'bypass', 'capGround'],
        [ground, 'capGround'],
        ['out', 'rf']
    );
}

export function differentialDetector(model = 'SMS7630', temperature = 300.15, reverseRows = false) {
    // Reuse one template in distinct placements; neither its construction Q nor
    // shared JavaScript identity may merge the detector/reference operating points.
    const d = nP.D({model, qPoint: {vd: .4}, temperature});
    const t = nP.Tee(), ground = nP.Short();
    const supply = nP.V(1), bias = nP.R(1e4), load = nP.R(1000);
    const choke = nP.L(1e-6), coupling = nP.C(1e-9), bypass = nP.C(1e-10);
    const supplyBypass = nP.C(10e-9);
    const rows = [
        [supply, 'supplyTap', 'supplyGround'], [ground, 'supplyGround'],
        [t, 'supplyTap', 'supply', 'decouple'],
        [supplyBypass, 'decouple', 'decoupleGround'], [ground, 'decoupleGround'],
        [bias, 'supply', 'rail'], [t, 'rail', 'feed1', 'feed2'],
        [choke, 'feed1', 'bias1'], [choke, 'feed2', 'anode2'],
        [coupling, 'rf', 'input'], [t, 'bias1', 'input', 'anode1'],
        [d, 'anode1', 'cathode1'], [t, 'cathode1', 'detector', 'bypass1'],
        [load, 'detector', 'ground1'], [ground, 'ground1'],
        [bypass, 'bypass1', 'capGround1'], [ground, 'capGround1'],
        [d, 'anode2', 'cathode2'], [t, 'cathode2', 'reference', 'bypass2'],
        [load, 'reference', 'ground2'], [ground, 'ground2'],
        [bypass, 'bypass2', 'capGround2'], [ground, 'capGround2']
    ];
    return nP.nodal(...(reverseRows ? rows.reverse() : rows), ['out', 'rf']);
}
