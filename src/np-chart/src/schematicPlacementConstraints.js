// Modified: 2026-11-22
// Shared measured separation while preserving electrical/authoring constraints.
import {drawingError} from './schematicInputParser';
import {solveDrawingConstraints} from './schematicInputConstraints';

const GRID = 10;

function placedEntries(entries, values) {
    return entries.map((entry, index) => {
        const at = [values[0][index], values[1][index]];
        return {...entry.preview, at, ports: entry.preview.ports.map(port =>
            ({...port, at: port.at.map((value, axis) => value + at[axis])}))};
    });
}

function overlap(a, b, gap = 20) {
    return a[0] < b[2] + gap && a[2] > b[0] - gap && a[1] < b[3] + gap && a[3] > b[1] - gap;
}

export function separateComponents(state, entries, geometry) {
    const boundsFor = geometry.packingBounds || geometry.bounds;
    let values = solveDrawingConstraints(state);
    for (let pass = 0; pass < entries.length * entries.length + 1; pass++) {
        const placements = placedEntries(entries, values), boxes = placements.map(boundsFor);
        let pair;
        for (let a = 0; a < boxes.length && !pair; a++) for (let b = a + 1; b < boxes.length; b++) {
            if (overlap(boxes[a], boxes[b])) { pair = [a, b]; break; }
        }
        if (!pair) return {values, placements};
        const [a, b] = pair, candidates = [];
        for (const axis of [0, 1]) for (const [from, to] of [[a, b], [b, a]]) {
            const start = boundsFor(entries[from].preview), end = boundsFor(entries[to].preview);
            const rule = {a: from, b: to, gap: Math.ceil((start[axis + 2] - end[axis] + 40) / GRID) * GRID,
                line: entries[to].part.line};
            const trial = {...state, minima: state.minima.map((list, index) => index === axis ? list.concat(rule) : list)};
            try {
                const solution = solveDrawingConstraints(trial), measured = placedEntries(entries, solution).map(boundsFor);
                const extent = [0, 1].map(i => Math.max(...measured.map(box => box[i + 2])) - Math.min(...measured.map(box => box[i])));
                candidates.push({axis, rule, values: solution, cost: extent[0] + extent[1]});
            } catch (error) { if (!(error instanceof TypeError)) throw error; }
        }
        candidates.sort((a, b) => a.cost - b.cost);
        if (!candidates.length) drawingError(entries[b].part.line, 'component boxes overlap under the requested constraints.');
        const best = candidates[0]; state.minima[best.axis].push(best.rule); values = best.values;
    }
    drawingError(0, 'layout clearance did not converge.');
}

// Orthogonal compaction preserves the order of overlapping projection intervals.
// Other-axis coordinates stay fixed during each pass, so tightening space cannot
// introduce a body/caption overlap or undo a terminal-axis equality.
export function compactComponents(state, entries, geometry, placements, origin, grid = GRID) {
    const envelopes = geometry.clearanceEnvelopes || (part => [(geometry.packingBounds || geometry.bounds)(part)]);
    const local = entries.map(entry => envelopes(entry.preview)), anchor = entries.length;
    const compact = {...state, minima: state.minima.map(rows => rows.slice())};
    const values = [0, 1].map(axis => placements.map(part => part.at[axis]).concat(0));
    for (const axis of [0, 1]) {
        const across = 1 - axis, boxes = placedEntries(entries, values).map(envelopes);
        for (let a = 0; a < entries.length; a++) {
            compact.minima[axis].push({a: anchor, b: a,
                gap: Math.ceil((origin[axis] - Math.min(...local[a].map(box => box[axis]))) / grid) * grid});
            for (let b = a + 1; b < entries.length; b++) {
                for (let i = 0; i < boxes[a].length; i++) for (let j = 0; j < boxes[b].length; j++) {
                    const x = boxes[a][i], y = boxes[b][j];
                    if (x[across] >= y[across + 2] + 20 || y[across] >= x[across + 2] + 20) continue;
                    const [from, to, first, last] = x[axis] < y[axis] ? [a, b, local[a][i], local[b][j]] : [b, a, local[b][j], local[a][i]];
                    compact.minima[axis].push({a: from, b: to,
                        gap: Math.ceil((first[axis + 2] - last[axis] + 20) / grid) * grid});
                }
            }
        }
        values[axis] = solveDrawingConstraints(compact)[axis];
    }
    return placedEntries(entries, values);
}
