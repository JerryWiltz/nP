// Modified: 2026-11-16
// Rank-revealing real solve. Keep the null space so floating observations and
// nonunique ideal-wire currents are reported, rather than assigned fake values.
export function solveDcLinearSystem(equations, size) {
    const original = equations.map(equation => Array.from({length: size}, (_, col) => equation.terms.get(col) || 0));
    const a = original.map((row, index) => [...row, equations[index].value]);
    const columnScale = Array(size).fill(1), permutation = Array.from({length: size}, (_, index) => index);
    for (let pass = 0; pass < 4; pass++) {
        for (const row of a) {
            const scale = Math.max(0, ...row.slice(0, size).map(Math.abs));
            if (scale) for (let col = 0; col <= size; col++) row[col] /= scale;
        }
        for (let col = 0; col < size; col++) {
            const scale = Math.max(0, ...a.map(row => Math.abs(row[col])));
            if (scale) {
                columnScale[col] /= scale;
                for (const row of a) row[col] /= scale;
            }
        }
    }
    if (a.some(row => row.some(value => !Number.isFinite(value))) || columnScale.some(value => !Number.isFinite(value))) {
        throw dcLinearError('DC_NUMERICAL_FAILURE', 'DC equations exceed the supported numerical range.');
    }
    const tolerance = Number.EPSILON * Math.max(32, 8 * size);
    const rhsBounds = a.map(row => Math.abs(row[size]));
    let rank = 0;
    for (; rank < size; rank++) {
        let pivotRow = rank, pivotCol = rank, largest = 0;
        for (let row = rank; row < size; row++) {
            for (let col = rank; col < size; col++) {
                if (Math.abs(a[row][col]) > largest) {
                    largest = Math.abs(a[row][col]); pivotRow = row; pivotCol = col;
                }
            }
        }
        if (largest <= tolerance) break;
        [a[rank], a[pivotRow]] = [a[pivotRow], a[rank]];
        [rhsBounds[rank], rhsBounds[pivotRow]] = [rhsBounds[pivotRow], rhsBounds[rank]];
        for (const row of a) [row[rank], row[pivotCol]] = [row[pivotCol], row[rank]];
        [permutation[rank], permutation[pivotCol]] = [permutation[pivotCol], permutation[rank]];
        const pivot = a[rank][rank];
        rhsBounds[rank] /= Math.abs(pivot);
        for (let col = rank; col <= size; col++) a[rank][col] /= pivot;
        for (let row = 0; row < size; row++) {
            if (row === rank) continue;
            const factor = a[row][rank];
            rhsBounds[row] += Math.abs(factor) * rhsBounds[rank];
            for (let col = rank + 1; col <= size; col++) a[row][col] -= factor * a[rank][col];
            a[row][rank] = 0;
        }
    }
    if (a.slice(rank).some((row, index) => Math.abs(row[size]) > tolerance * Math.max(1, rhsBounds[rank + index]))) {
        throw dcLinearError('DC_INCONSISTENT', 'DC constraints are inconsistent; check conflicting voltage sources and ideal shorts.');
    }
    const values = Array(size).fill(0), nullSpace = [];
    for (let row = 0; row < rank; row++) values[permutation[row]] = a[row][size] * columnScale[permutation[row]];
    for (let free = rank; free < size; free++) {
        const direction = Array(size).fill(0);
        direction[permutation[free]] = columnScale[permutation[free]];
        for (let row = 0; row < rank; row++) direction[permutation[row]] = -a[row][free] * columnScale[permutation[row]];
        const scale = Math.max(...direction.map(Math.abs));
        nullSpace.push(direction.map(value => value / scale));
    }
    let maxKclAmps = 0, maxScaledResidual = 0;
    for (let row = 0; row < size; row++) {
        const terms = original[row].map((coefficient, col) => coefficient * values[col]);
        const residual = Math.abs(terms.reduce((sum, term) => sum + term, 0) - equations[row].value);
        const scale = Math.abs(equations[row].value) + terms.reduce((sum, term) => sum + Math.abs(term), 0);
        const absoluteTolerance = equations[row].kind === 'kcl' ? 1e-12 : 1e-9;
        if (!Number.isFinite(residual) || residual > absoluteTolerance + 1e-9 * scale) {
            throw dcLinearError('DC_NUMERICAL_FAILURE', 'DC residual checks failed; the network is numerically ill-conditioned.');
        }
        if (equations[row].kind === 'kcl') maxKclAmps = Math.max(maxKclAmps, residual);
        maxScaledResidual = Math.max(maxScaledResidual, residual / (absoluteTolerance + scale));
    }
    return {values, nullSpace, rank, tolerance, residuals: {maxKclAmps, maxScaledResidual}};
}

export function dcLinearValue(solution, terms) {
    for (const direction of solution.nullSpace) {
        let sum = 0, scale = 0;
        for (const [index, coefficient] of terms) {
            const term = coefficient * direction[index]; sum += term; scale += Math.abs(term);
        }
        if (Math.abs(sum) > solution.tolerance * scale) return null;
    }
    let value = 0;
    for (const [index, coefficient] of terms) value += coefficient * solution.values[index];
    if (!Number.isFinite(value)) throw dcLinearError('DC_NUMERICAL_FAILURE', 'DC result exceeds the supported numerical range.');
    return value === 0 ? 0 : value;
}

export function dcLinearError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}
