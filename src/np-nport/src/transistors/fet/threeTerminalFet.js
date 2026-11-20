// Modified: 2026-11-19
// Shared terminal/contact equations for three-terminal FETs. Intrinsic device
// laws remain separate; a common pin order does not imply common device physics.
export function threeTerminalFetPoint(equations, p, intrinsicVgs, intrinsicVgd, polarity, vs = 0) {
    const data = equations(p, intrinsicVgs, intrinsicVgd, polarity);
    const [ig, id, source] = data.currents.map(row => row[0]);
    const vgs = intrinsicVgs - p.RS * source, vds = intrinsicVgs - intrinsicVgd + p.RD * id - p.RS * source;
    return {ig, id, is: source, vgs, vds, intrinsicVgs, intrinsicVgd, vs,
        vg: vs === null ? null : vs + vgs, vd: vs === null ? null : vs + vds, region: data.region, data};
}
export function solveThreeTerminalFet(equations, p, vgs, vds, polarity, initial, label) {
    let values = initial ? initial.slice() : [vgs, vgs - vds];
    for (let iteration = 0; iteration < 240; iteration++) {
        let data;
        try { data = equations(p, ...values, polarity); }
        catch (error) { throw new RangeError(label + ' fixed-Q state exceeds the model domain.', {cause: error}); }
        const drain = data.currents[1], source = data.currents[2];
        const f = [values[0] - vgs - p.RS * source[0], values[1] - (vgs - vds) - p.RD * drain[0]];
        const a = 1 - p.RS * source[1], b = -p.RS * source[2], c = -p.RD * drain[1], d = 1 - p.RD * drain[2];
        const determinant = a * d - b * c;
        const delta = [(-d * f[0] + b * f[1]) / determinant, (c * f[0] - a * f[1]) / determinant];
        if (Math.max(...f.map(Math.abs)) < 1e-11 && Math.max(...delta.map(Math.abs)) < 1e-9) return threeTerminalFetPoint(equations, p, ...values, polarity);
        if (delta.some(value => !Number.isFinite(value))) throw new RangeError(label + ' fixed-Q equations are singular.');
        const step = Math.min(1, 0.12 / Math.max(0.12, ...delta.map(Math.abs)));
        values = values.map((value, index) => value + step * delta[index]);
    }
    throw new RangeError(label + ' fixed-Q solve did not converge.');
}
