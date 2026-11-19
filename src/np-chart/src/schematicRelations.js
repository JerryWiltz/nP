// Modified: 2026-11-19
// Measured layout of oriented components connected by semantic terminal roles.
import {addRouteConstraints, routeDirections, separateComponents, routePoints} from './schematicInputLayout';
import {schematicBranchFamilies} from './schematicBranches';
import {automaticRoute, recordBoardRoute, graphWireBoxes} from './schematicBoardGraph';

const DIRECTIONS = {right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1]};

function relationEndpoint(reference, bindings, entries) {
    const binding = bindings.get(reference.slot);
    if (!binding || !binding.ports[reference.port]) throw new TypeError('Unknown layout terminal role.');
    const port = binding.ports[reference.port], entry = entries[binding.index];
    return {variable: binding.index, offset: entry.preview.ports[port - 1].at,
        direction: entry.outward[port - 1], node: entry.preview.ports[port - 1].node};
}

function equalLayoutPoints(state, axis, a, b) {
    const gap = a.offset[axis] - b.offset[axis];
    if (gap % 10) throw new TypeError('Layout alignment conflicts with the placement grid.');
    state.equalities[axis].push({a: a.variable, b: b.variable, gap});
}

function componentMidpoint(index, entries) {
    const ports = entries[index].preview.ports;
    return {variable: index, offset: ports[0].at.map((value, axis) =>
        (value + ports[1].at[axis]) / 2)};
}

function addBranchRelations(root, entries, geometry, state) {
    for (const family of schematicBranchFamilies(root, geometry.symbol)) {
        const grouped = new Map();
        for (const branch of family) {
            const direction = entries[branch.termination].outward[0], key = direction.join(',');
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(branch);
        }
        for (const branches of grouped.values()) {
            const first = branches[0], normal = entries[first.termination].outward[0], axis = normal[0] ? 0 : 1;
            addBranchBalance(branches, axis, entries, geometry, state);
            const a = {variable: first.termination, offset: entries[first.termination].preview.ports[0].at};
            for (const branch of branches.slice(1)) {
                equalLayoutPoints(state, axis, a, {variable: branch.termination,
                    offset: entries[branch.termination].preview.ports[0].at});
                if (branch.chain.length === first.chain.length) {
                    first.chain.forEach((index, stage) => equalLayoutPoints(state, axis,
                        componentMidpoint(index, entries), componentMidpoint(branch.chain[stage], entries)));
                }
            }
        }
    }
}

function addBranchBalance(branches, axis, entries, geometry, state) {
    if (branches.length !== 2 || branches.some(branch => !branch.chain.length || branch.anchor !== branches[0].anchor)) return;
    const across = 1 - axis, anchor = entries[branches[0].anchor];
    const directions = branches.map(branch => anchor.outward[branch.port - 1][across]);
    if (!directions[0] || directions[0] !== -directions[1]) return;
    const parts = branches.map(branch => entries[branch.chain[0]]);
    if (parts.some(part => part.outward.some(normal => normal[across]))) return;
    const center = anchor.preview.ports.reduce((sum, port) => sum + port.at[across], 0) / anchor.preview.ports.length;
    const pitch = Math.ceil(Math.max(...branches.map((branch, index) => {
        const box = (geometry.packingBounds || geometry.bounds)(parts[index].preview);
        return Math.max(Math.abs(anchor.preview.ports[branch.port - 1].at[across] - center),
            (box[across + 2] - box[across]) / 2) + 40;
    })) / 10) * 10;
    branches.forEach((branch, index) => {
        const part = componentMidpoint(branch.chain[0], entries);
        equalLayoutPoints(state, across,
            {variable: branch.anchor, offset: anchor.preview.ports[0].at.map((value, i) => i === across ? center + directions[index] * pitch : value)}, part);
    });
}

function addBoardRelations(board, bindings, entries, geometry, state) {
    for (const rule of board.order || []) {
        const axis = rule.axis === 'x' ? 0 : 1;
        for (let i = 1; i < rule.slots.length; i++) {
            for (const from of [rule.slots[i - 1]].flat()) for (const to of [rule.slots[i]].flat()) {
                const a = bindings.get(from).index, b = bindings.get(to).index;
                const boundsFor = geometry.packingBounds || geometry.bounds;
                const left = boundsFor(entries[a].preview), right = boundsFor(entries[b].preview);
                state.minima[axis].push({a, b, gap: Math.ceil((left[axis + 2] - right[axis] + 40) / 10) * 10});
            }
        }
    }
    for (const rule of board.centerlines || []) {
        const axis = rule.axis === 'x' ? 0 : 1;
        let reference;
        if (rule.reference.between) {
            const points = rule.reference.between.map(port => relationEndpoint({slot: rule.reference.slot, port}, bindings, entries));
            reference = {...points[0], offset: points[0].offset.map((value, i) => (value + points[1].offset[i]) / 2)};
        } else reference = relationEndpoint(rule.reference, bindings, entries);
        for (const member of rule.align) equalLayoutPoints(state, axis, reference, relationEndpoint(member, bindings, entries));
    }
}

function clearRoute(points, boxes) {
    return points.slice(1).every((b, index) => {
        const a = points[index];
        return boxes.every(box => a[0] === b[0] ?
            a[0] <= box[0] || a[0] >= box[2] || Math.max(a[1], b[1]) <= box[1] || Math.min(a[1], b[1]) >= box[3] :
            a[1] <= box[1] || a[1] >= box[3] || Math.max(a[0], b[0]) <= box[0] || Math.min(a[0], b[0]) >= box[2]);
    });
}

function clearOccupied(points, occupied, node, grid) {
    return points.slice(1).every((b, index) => {
        const a = points[index], length = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        for (let step = 0; step <= length; step += grid) {
            const key = a.map((value, axis) => value + Math.sign(b[axis] - value) * step).join(',');
            if ([...(occupied.get(key)?.keys() || [])].some(other => other !== node)) return false;
        }
        return true;
    });
}

function connectLayout(result, route, values, boxes, occupied, board, id) {
    let points = routePoints(route, values);
    if (!clearRoute(points, boxes) || !clearOccupied(points, occupied, route.node, board.grid)) {
        const first = DIRECTIONS[route.directions[0]], last = DIRECTIONS[route.directions.at(-1)];
        const start = points[0].map((value, axis) => value + first[axis] * board.wireBoxLength);
        const finish = points.at(-1).map((value, axis) => value - last[axis] * board.wireBoxLength);
        try {
            points = [points[0], ...automaticRoute(start, finish, boxes, new Set(), occupied, route.node,
                {...board, startDirection: first, finishDirection: last}), points.at(-1)];
        } catch (error) {
            throw new RangeError(`Layout cannot route node ${route.node} from ${start} to ${finish}.`, {cause: error});
        }
    }
    recordBoardRoute(points, route.node, occupied, board.grid);
    graphWireBoxes(result, route.node, points, board, id);
    result.nodePoints.set(route.node, points[0].map((value, axis) =>
        Math.round((value + points[1][axis]) / (2 * board.grid)) * board.grid));
}

export function layoutSchematicRelations(root, definition, bindings, entries, geometry) {
    const board = {grid: 10, wireBoxLength: 40, clearance: 10, routingMargin: 200,
        cornerSize: 10, bendCost: 20, allowCrossings: false};
    const state = {count: entries.length, equalities: [[], []], minima: [[], []]};
    const routes = definition.board.wires.filter(wire => !wire.from.externalPort && !wire.to.externalPort).map(wire => {
        const a = relationEndpoint(wire.from, bindings, entries), b = relationEndpoint(wire.to, bindings, entries);
        const route = {a, b, node: a.node, minimum: board.wireBoxLength,
            directions: routeDirections(a.direction, b.direction, [])};
        if (a.node !== b.node) throw new TypeError('Layout wire changes an electrical node.');
        addRouteConstraints(route, state);
        return route;
    });
    addBoardRelations(definition.board, bindings, entries, geometry, state);
    addBranchRelations(root, entries, geometry, state);
    const {values, placements} = separateComponents(state, entries, geometry);
    const origin = definition.board.origin || [0, 0];
    if (!origin.every(value => Number.isFinite(value) && value % board.grid === 0)) throw new TypeError('Invalid layout origin.');
    placements.forEach(part => { part.at = part.at.map((value, i) => value + origin[i]);
        part.ports.forEach(port => { port.at = port.at.map((value, i) => value + origin[i]); }); });
    values.forEach((list, axis) => list.forEach((value, index) => { list[index] = value + origin[axis]; }));
    const boxes = placements.flatMap(placement => [geometry.bounds(placement),
        ...(geometry.captionBounds ? [geometry.captionBounds(placement)] : [])]), occupied = new Map();
    const result = {grid: board.grid, placements, wires: [], externalPorts: [], nodePoints: new Map(),
        byIndex: new Map(placements.map((part, index) => [index, part]))};
    placements.forEach((part, index) => part.ports.forEach((port, number) => {
        const escape = port.at.map((value, axis) => value + entries[index].outward[number][axis] * board.wireBoxLength);
        recordBoardRoute([port.at, escape], port.node, occupied, board.grid);
    }));
    routes.forEach((route, index) => connectLayout(result, route, values, boxes, occupied, board, `relation:${index}`));
    const bounds = [Math.min(...boxes.map(box => box[0])), Math.min(...boxes.map(box => box[1])),
        Math.max(...boxes.map(box => box[2])), Math.max(...boxes.map(box => box[3]))];
    for (const port of definition.board.externalPorts) {
        const terminal = relationEndpoint(port.from, bindings, entries), normal = DIRECTIONS[port.side];
        const axis = normal[0] ? 0 : 1, sign = normal[axis];
        const start = terminal.offset.map((value, i) => value + values[i][terminal.variable]);
        const end = start.slice(); end[axis] = (sign > 0 ? Math.ceil(bounds[axis + 2] / board.grid) :
            Math.floor(bounds[axis] / board.grid)) * board.grid + sign * 80;
        const direction = Object.keys(DIRECTIONS).find(name => DIRECTIONS[name].every((value, i) => value === normal[i]));
        const route = {node: terminal.node, minimum: 0, a: {variable: terminal.variable, offset: terminal.offset},
            b: {variable: terminal.variable, offset: end.map((value, i) => value - values[i][terminal.variable])}, directions: [direction]};
        connectLayout(result, route, values, boxes, occupied, board, `external:${port.port}`);
        result.externalPorts.push({port: port.port, node: terminal.node, at: end, direction: normal});
    }
    return result;
}
