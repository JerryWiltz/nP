// Modified: 2026-11-20
// Manufacturer p.16 topology. Public source joins the two package source pins;
// all three source bond paths and the inter-pad bridge remain explicit.
export function hemtTopology(p, pkg) {
    const network = {nodeCount: pkg ? 21 : 9, ports: [0, 1, 2], intrinsic: [6, 7, 8], joins: [],
        resistors: [[3, 6, p.RG], [4, 7, p.RD], [5, 8, p.RS]],
        inductors: pkg ? [[9, 3, p.LG], [10, 4, p.LD], [11, 5, p.LS]] : [[0, 3, p.LG], [1, 4, p.LD], [2, 5, p.LS]],
        capacitors: [[7, 8, p.CDS]], seriesRC: [[7, 8, p.RC, p.CRF, false]]};
    if (pkg) {
        network.inductors.push([0, 12, pkg.Lc], [1, 14, pkg.Ld], [2, 13, pkg.La], [2, 15, pkg.La / 2],
            [16, 9, pkg.Lb], [17, 10, pkg.Lb], [18, 11, pkg.Lb], [19, 11, pkg.Lb], [20, 11, pkg.Lb]);
        network.resistors.push([12, 16, pkg.Rb], [14, 17, pkg.Rb], [13, 18, pkg.Rb],
            [15, 19, pkg.Rb], [15, 20, pkg.Rb], [13, 15, pkg.Rbridge]);
        network.capacitors.push([12, 13, pkg.Ca], [14, 15, pkg.Cb]);
    }
    return network;
}
