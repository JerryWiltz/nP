// Modified: 2026-11-14
import {drawingError} from './schematicInputParser';

// Per-axis difference constraints: equality groups carry terminal offsets;
// longest-path relaxation supplies the smallest coordinates satisfying gaps.
export function solveDrawingAxis(count, equalities, minima) {
    const links = Array.from({length: count}, () => []);
    for (const {a, b, gap, line} of equalities) {
        links[a].push({to: b, delta: gap, line});
        links[b].push({to: a, delta: -gap, line});
    }
    const groups = new Array(count), offsets = new Array(count), roots = [];
    for (let start = 0; start < count; start++) {
        if (groups[start] !== undefined) continue;
        const group = roots.length, pending = [start]; roots.push(start);
        groups[start] = group; offsets[start] = 0;
        for (let index = 0; index < pending.length; index++) {
            const from = pending[index];
            for (const link of links[from]) {
                const value = offsets[from] + link.delta;
                if (groups[link.to] !== undefined) {
                    if (offsets[link.to] !== value) drawingError(link.line, 'conflicting alignment or straight-path constraints.');
                } else {
                    groups[link.to] = group; offsets[link.to] = value; pending.push(link.to);
                }
            }
        }
    }
    const edges = minima.map(rule => ({...rule, a: groups[rule.a], b: groups[rule.b],
        gap: rule.gap + offsets[rule.a] - offsets[rule.b]}));
    const values = roots.map(() => 0);
    for (let pass = 0; pass <= roots.length; pass++) {
        let changed = false;
        for (const edge of edges) if (values[edge.b] < values[edge.a] + edge.gap) {
            if (pass === roots.length) drawingError(edge.line, 'direction or clearance constraints cannot be satisfied.');
            values[edge.b] = values[edge.a] + edge.gap; changed = true;
        }
        if (!changed) return groups.map((group, index) => values[group] + offsets[index]);
    }
}

export function solveDrawingConstraints(state) {
    return [0, 1].map(axis => solveDrawingAxis(state.count, state.equalities[axis], state.minima[axis]));
}
