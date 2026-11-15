// Modified: 2026-11-14
// Final node-marker selection uses complete routes, after composition/reflection.
// Wire points retain layout traversal direction; this is not current direction.

function pointKey(point) {
    return point.join(',');
}

function wireOrder(a, b) {
    const left = a.wire.boardTile?.id || '', right = b.wire.boardTile?.id || '';
    return left.localeCompare(right, 'en', {numeric: true}) || a.index - b.index;
}

function incomingCornerWires(wires) {
    const outgoing = new Map(), incoming = new Set();
    const edges = wires.map((wire, index) => ({wire, index})).sort(wireOrder);
    for (const edge of edges) {
        const from = pointKey(edge.wire.points[0]), to = pointKey(edge.wire.points.at(-1));
        if (!outgoing.has(from)) outgoing.set(from, []);
        outgoing.get(from).push(edge);
        incoming.add(to);
    }
    const roots = [...outgoing.keys()].filter(key => !incoming.has(key));
    // Several outgoing paths share one electrical node. Use stable board-tile
    // order to break ties, including closed routes that have no unique start.
    const starts = roots.length ? roots : [pointKey(edges[0].wire.points[0])];
    const pending = starts.flatMap(key => outgoing.get(key).map(edge => ({edge, previous: null}))).reverse();
    const visited = new Set(), selected = new Set(), candidates = [];
    while (pending.length) {
        const {edge, previous} = pending.pop();
        if (visited.has(edge.index)) continue;
        visited.add(edge.index);
        const corner = edge.wire.boardTile?.kind === 'cornerWire';
        if (corner && previous && !selected.has(previous.index)) {
            selected.add(previous.index);
            candidates.push(previous.wire);
        }
        const next = outgoing.get(pointKey(edge.wire.points.at(-1))) || [];
        for (let index = next.length - 1; index >= 0; index--) {
            pending.push({edge: next[index], previous: corner ? null : edge});
        }
    }
    return candidates;
}

function distanceToSegment(point, start, end) {
    return Math.hypot(...point.map((value, axis) =>
        value - Math.min(Math.max(value, Math.min(start[axis], end[axis])), Math.max(start[axis], end[axis]))));
}

function clearMarkerPoint(point, node, result, grid) {
    // Keep the four-unit marker away from terminals and other nets, including
    // a crossing that would otherwise falsely suggest an electrical junction.
    const terminals = result.placements.flatMap(part => part.ports).concat(result.externalPorts);
    if (terminals.some(port => Math.hypot(point[0] - port.at[0], point[1] - port.at[1]) < grid)) return false;
    return result.wires.every(wire => wire.node === node || wire.points.slice(1).every((end, index) =>
        distanceToSegment(point, wire.points[index], end) >= grid));
}

function markerOnWire(wire, result, grid) {
    const [start, end] = wire.points;
    const length = Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1]);
    const steps = Math.round(length / grid), middle = Math.round(steps / 2);
    // Distances measured from the route start preserve the chosen point under
    // either reflection, including ties on odd-length grid spans.
    for (let offset = 0; offset < steps; offset++) {
        for (const step of offset ? [middle - offset, middle + offset] : [middle]) {
            if (step <= 0 || step >= steps) continue;
            const point = start.map((value, axis) => value + Math.sign(end[axis] - value) * step * grid);
            if (clearMarkerPoint(point, wire.node, result, grid)) return point;
        }
    }
    return null;
}

export function placeBoardNodeMarkers(result) {
    const nodePoints = new Map(result.nodePoints), byNode = new Map();
    for (const wire of result.wires) {
        if (!byNode.has(wire.node)) byNode.set(wire.node, []);
        byNode.get(wire.node).push(wire);
    }
    for (const [node, wires] of byNode) {
        if (!wires.some(wire => wire.boardTile?.kind === 'cornerWire')) continue;
        const preferred = incomingCornerWires(wires);
        const fallback = wires.filter(wire => wire.boardTile?.kind === 'wire' && !preferred.includes(wire));
        // Prefer the wire before the first corner. A wholly blocked/too-short
        // lead may use another clear straight wire rather than lose its marker.
        for (const wire of preferred.concat(fallback)) {
            const point = markerOnWire(wire, result, result.grid);
            if (point) {
                nodePoints.set(node, point);
                break;
            }
        }
    }
    return nodePoints;
}
