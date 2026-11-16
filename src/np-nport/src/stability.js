// Modified: 2026-11-15
// Rollett K belongs to the resulting two-port, never to its component history.
export function stabilityAt(row) {
    if (row.length !== 5) throw new RangeError('K and deltaMag require a two-port network.');
    const [, s11, s12, s21, s22] = row;
    const deltaMag = s11.mul(s22).sub(s12.mul(s21)).mag();
    const numerator = 1 - s11.mag() ** 2 - s22.mag() ** 2 + deltaMag ** 2;
    const denominator = 2 * s12.mag() * s21.mag();
    // 0/0 remains indeterminate, rather than claiming unconditional stability.
    const K = numerator / denominator;
    return {frequency: row[0], K, deltaMag,
        unconditionallyStable: !Number.isNaN(K) && K > 1 && deltaMag < 1};
}
export function stabilityRows(spars) {
    if (!spars?.length || spars.some(row => row.length !== 5)) return undefined;
    return spars.map(stabilityAt);
}
