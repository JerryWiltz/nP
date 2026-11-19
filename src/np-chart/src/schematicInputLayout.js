// Modified: 2026-11-19
import {drawingDirections, drawingError, drawingTerminal} from './schematicInputParser';
import {solveDrawingConstraints} from './schematicInputConstraints';
import {automaticRoute, recordBoardRoute, graphWireBoxes} from './schematicBoardGraph';

const GRID = 10, WIRE = 40;

function rotate(point, angle, mirrorX = false, mirrorY = false) {
    const [x, y] = [point[0] * (mirrorX ? -1 : 1), point[1] * (mirrorY ? -1 : 1)];
    return angle === 0 ? [x, y] : angle === 90 ? [-y, x] : angle === 180 ? [-x, -y] : [y, -x];
}

function directionName(vector) {
    return Object.keys(drawingDirections).find(name => drawingDirections[name].every((value, axis) => value === Math.sign(vector[axis])));
}

function leadDirection(symbol, port) {
    const terminal = symbol.ports[port - 1], lead = symbol.leads[port - 1];
    const inside = lead.find(point => point.some((value, axis) => value !== terminal[axis]));
    return terminal.map((value, axis) => Math.sign(value - inside[axis]));
}

function orientPart(part, parsed, geometry, oriented) {
    if (oriented.has(part.id)) return oriented.get(part.id);
    const prior = part.previous && orientPart(parsed.declarations.get(part.previous), parsed, geometry, oriented);
    const flow = part.directions.at(-1) || directionName(prior.outward[parsed.declarations.get(part.previous).outputPort - 1]);
    const target = drawingDirections[flow];
    const entry = {part: {kind: 'component', symbol: part.symbol, displayName: part.id, displayValue: part.caption}, nodes: part.nodes};
    const symbol = geometry.symbol(entry), normal = leadDirection(symbol, part.inputPort);
    // Reflect across the world approach axis after the quarter turn.
    let selected;
    for (const angle of [0, 90, 180, 270]) {
        const transformed = rotate(normal, angle);
        if (transformed.every((value, axis) => value === -target[axis])) { selected = angle; break; }
    }
    if (selected === undefined) drawingError(part.line, 'canonical input lead has no orthogonal approach.');
    const localMirrorX = part.mirror && (selected % 180 ? target[0] !== 0 : target[1] !== 0);
    const localMirrorY = part.mirror && !localMirrorX;
    const preview = geometry.placement(entry, part.inputPort, [0, 0], selected, localMirrorY, localMirrorX, part.id);
    preview.boardTile = {kind: 'component', id: part.id};
    const result = {part, entry, preview, flow,
        outward: symbol.ports.map((_, index) => rotate(leadDirection(symbol, index + 1), selected, localMirrorX, localMirrorY))};
    oriented.set(part.id, result);
    return result;
}

export function routeDirections(start, target, requested) {
    const names = [directionName(start), ...requested, directionName(target.map(value => -value))];
    const result = [];
    for (const name of names) {
        if (result.at(-1) === name) continue;
        if (result.length && drawingDirections[result.at(-1)].every((value, axis) => value === -drawingDirections[name][axis])) {
            // Opposed leads need a U-shaped path, not a 180-degree corner.
            result.push(drawingDirections[name][0] ? 'down' : 'right');
        }
        result.push(name);
    }
    return result;
}

export function addRouteConstraints(route, state) {
    for (const axis of [0, 1]) {
        const steps = route.directions.map(name => drawingDirections[name][axis]).filter(Boolean);
        const {a, b} = route, offset = a.offset[axis] - b.offset[axis];
        if (!steps.length) state.equalities[axis].push({a: a.variable, b: b.variable, gap: offset, line: route.line});
        else if (steps.every(value => value === steps[0])) {
            const positive = steps[0] > 0;
            state.minima[axis].push({a: positive ? a.variable : b.variable,
                b: positive ? b.variable : a.variable,
                gap: steps.length * route.minimum + (positive ? offset : -offset), line: route.line});
        }
    }
}

function endpoint(variable, offset, direction, extra = {}) {
    return {variable, offset, direction, ...extra};
}

function buildRoutes(parsed, entries) {
    const state = {count: entries.length, equalities: [[], []], minima: [[], []], routes: []};
    const byNode = new Map(), byId = new Map(entries.map((entry, index) => [entry.part.id, index]));
    entries.forEach((entry, index) => entry.preview.ports.forEach((port, portIndex) => {
        if (!byNode.has(port.node)) byNode.set(port.node, []);
        byNode.get(port.node).push(endpoint(index, port.at, entry.outward[portIndex],
            {part: entry.part, port: portIndex + 1, node: port.node}));
    }));
    for (const rule of parsed.alignments) {
        const terminals = rule.references.map(reference => drawingTerminal(reference, parsed.declarations, rule.line));
        const first = terminals[0], a = byId.get(first.part.id), offset = entries[a].preview.ports[first.port - 1].at[rule.axis];
        for (const terminal of terminals.slice(1)) {
            const b = byId.get(terminal.part.id);
            state.equalities[rule.axis].push({a, b, gap: offset - entries[b].preview.ports[terminal.port - 1].at[rule.axis], line: rule.line});
        }
    }
    for (const [node, ends] of byNode) {
        const targets = ends.filter(end => end.port === end.part.inputPort);
        if (ends.length === 1) {
            const end = ends[0], isInput = targets.length > 0;
            const requested = isInput ? end.part.directions : [];
            const directions = requested.length ? requested : [directionName(end.direction.map(value => -value))];
            const offset = end.offset.slice();
            directions.forEach(name => drawingDirections[name].forEach((value, axis) => { offset[axis] -= value * WIRE; }));
            const free = endpoint(end.variable, offset, drawingDirections[directions[0]], {free: true, node});
            state.routes.push({node, a: free, b: end, directions, line: end.part.line});
        } else if (ends.length === 2) {
            const target = targets.length === 1 ? targets[0] : ends.slice().sort((a, b) => a.part.id.localeCompare(b.part.id))[1];
            const start = ends.find(end => end !== target);
            const requested = target.port === target.part.inputPort ? target.part.directions : [];
            state.routes.push({node, a: start, b: target,
                directions: routeDirections(start.direction, target.direction, requested), line: target.part.line});
        } else {
            const hub = endpoint(state.count++, [0, 0], null, {hub: true, node});
            // Each terminal owns one straight leg to a shared junction. Junction
            // coordinates are independent of component/node label positions.
            for (const end of ends) state.routes.push({node, a: end, b: hub,
                directions: [directionName(end.direction)], line: end.part.line});
        }
    }
    for (const route of state.routes) {
        route.minimum = parsed.annotations.some(annotation => annotation.node === route.node &&
            ['label', 'arrow', 'port'].includes(annotation.type)) ? 80 : WIRE;
        if (route.a.free) {
            route.a.offset = route.b.offset.slice();
            route.directions.forEach(name => drawingDirections[name].forEach((value, axis) => {
                route.a.offset[axis] -= value * route.minimum;
            }));
        } else addRouteConstraints(route, state);
    }
    return state;
}

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

export function routePoints(route, values) {
    const start = route.a.offset.map((value, axis) => value + values[axis][route.a.variable]);
    const finish = route.b.offset.map((value, axis) => value + values[axis][route.b.variable]);
    const lengths = route.directions.map(() => route.minimum);
    for (const axis of [0, 1]) {
        const difference = finish[axis] - start[axis] - route.directions.reduce((sum, name) => sum + drawingDirections[name][axis] * route.minimum, 0);
        if (!difference) continue;
        const index = route.directions.findIndex(name => drawingDirections[name][axis] === Math.sign(difference));
        if (index < 0) drawingError(route.line, 'route directions conflict with terminal alignment.');
        lengths[index] += Math.abs(difference);
    }
    const points = [start];
    route.directions.forEach((name, index) => points.push(points.at(-1).map((value, axis) =>
        value + drawingDirections[name][axis] * lengths[index])));
    return points;
}

function pathClear(points, boxes) {
    return points.slice(1).every((end, index) => {
        const start = points[index];
        return boxes.every(box => !overlap([Math.min(start[0], end[0]), Math.min(start[1], end[1]),
            Math.max(start[0], end[0]), Math.max(start[1], end[1])], box, 0));
    });
}

export function layoutSchematicInput(parsed, geometry) {
    const oriented = new Map();
    const entries = parsed.parts.slice().sort((a, b) => a.id.localeCompare(b.id, 'en', {numeric: true}))
        .map(part => orientPart(part, parsed, geometry, oriented));
    const state = buildRoutes(parsed, entries), {values, placements} = separateComponents(state, entries, geometry);
    const result = {grid: GRID, placements, wires: [], externalPorts: [], nodePoints: new Map(), junctions: [], regions: []};
    const boxes = placements.flatMap(placement => [geometry.bounds(placement),
        ...(geometry.captionBounds ? [geometry.captionBounds(placement)] : [])]), occupied = new Map();
    const board = {grid: GRID, cornerSize: 10, wireBoxLength: WIRE, routingMargin: 200,
        clearance: 10, bendCost: 20, allowCrossings: true};
    for (const [index, route] of state.routes.entries()) {
        let points = routePoints(route, values);
        if (!pathClear(points, boxes)) {
            const first = drawingDirections[route.directions[0]], last = drawingDirections[route.directions.at(-1)];
            const start = points[0].map((value, axis) => value + first[axis] * 20);
            const finish = points.at(-1).map((value, axis) => value - last[axis] * 20);
            points = [points[0], ...automaticRoute(start, finish, boxes, new Set(), occupied, route.node,
                {...board, startDirection: first, finishDirection: last}), points.at(-1)];
        }
        recordBoardRoute(points, route.node, occupied, GRID);
        graphWireBoxes(result, route.node, points, board, `input:${route.node}:${index}`);
        result.nodePoints.set(route.node, points[0].map((value, axis) =>
            Math.round((value + points[1][axis]) / (2 * GRID)) * GRID));
        if (route.b.hub) {
            const at = points.at(-1);
            result.nodePoints.set(route.node, at);
            if (!result.junctions.some(junction => junction.node === route.node)) result.junctions.push({node: route.node, at});
        }
    }
    for (const annotation of parsed.annotations.filter(item => item.type === 'port')) {
        const free = state.routes.find(route => route.node === annotation.node && route.a.free);
        const at = free ? routePoints(free, values)[0] : result.nodePoints.get(annotation.node);
        result.externalPorts.push({port: annotation.number, node: annotation.node, at,
            ...(!free ? {onWire: true} : {}),
            ...(annotation.reference === undefined ? {} : {reference: annotation.reference}), side: annotation.side});
    }
    return result;
}
