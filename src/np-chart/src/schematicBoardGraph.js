// Modified: 2026-11-08
// General graph operations for ORI's automatic board. No RF circuit patterns.
const AXES = [[1, 0], [0, 1], [-1, 0], [0, -1]];

function snap(value, grid) {
    return Math.round(value / grid) * grid;
}

function same(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}

function rotate(vector, angle, mirrorX, mirrorY) {
    const x = vector[0] * (mirrorX ? -1 : 1), y = vector[1] * (mirrorY ? -1 : 1);
    return angle === 0 ? [x, y] : angle === 90 ? [-y, x] : angle === 180 ? [-x, -y] : [y, -x];
}

function graphIncidence(root) {
    const adjacency = new Map(), byNode = new Map(), edges = [];
    root.components.forEach((entry, index) => entry.nodes.forEach((node, port) => {
        if (!byNode.has(node)) byNode.set(node, []);
        byNode.get(node).push({index, port: port + 1});
    }));
    let nextNode = root.components.length;
    for (const [node, terminals] of byNode) {
        const vertex = nextNode++;
        for (const terminal of terminals) {
            const edge = {a: terminal.index, b: vertex, node, port: terminal.port, id: edges.length};
            edges.push(edge);
            for (const endpoint of [edge.a, edge.b]) {
                if (!adjacency.has(endpoint)) adjacency.set(endpoint, []);
                adjacency.get(endpoint).push(edge);
            }
        }
    }
    return {adjacency, byNode, edges};
}

// Iterative Tarjan decomposition on the component/node incidence graph. A node
// shared by many ports is a junction, rather than a clique of artificial loops.
function graphBlocks(graph) {
    const depth = new Map(), low = new Map(), edgeStack = [], blocks = [];
    let serial = 0;
    for (const start of graph.adjacency.keys()) {
        if (depth.has(start)) continue;
        depth.set(start, ++serial);
        low.set(start, serial);
        const stack = [{vertex: start, parent: null, edge: null, position: 0}];
        while (stack.length) {
            const frame = stack.at(-1), neighbors = graph.adjacency.get(frame.vertex);
            if (frame.position < neighbors.length) {
                const edge = neighbors[frame.position++];
                if (edge.id === frame.edge?.id) continue;
                const next = edge.a === frame.vertex ? edge.b : edge.a;
                if (!depth.has(next)) {
                    edgeStack.push(edge);
                    depth.set(next, ++serial);
                    low.set(next, serial);
                    stack.push({vertex: next, parent: frame.vertex, edge, position: 0});
                } else if (depth.get(next) < depth.get(frame.vertex)) {
                    edgeStack.push(edge);
                    low.set(frame.vertex, Math.min(low.get(frame.vertex), depth.get(next)));
                }
            } else {
                stack.pop();
                if (frame.parent === null) continue;
                low.set(frame.parent, Math.min(low.get(frame.parent), low.get(frame.vertex)));
                if (low.get(frame.vertex) >= depth.get(frame.parent)) {
                    const block = [];
                    let edge;
                    do { edge = edgeStack.pop(); block.push(edge); } while (edge.id !== frame.edge.id);
                    blocks.push(block);
                }
            }
        }
    }
    return blocks;
}

function automaticRegions(root, graph) {
    const groups = [];
    for (const edges of graphBlocks(graph)) {
        const vertices = new Set(edges.flatMap(edge => [edge.a, edge.b]));
        if (edges.length < vertices.size) continue;
        const members = new Set([...vertices].filter(vertex => vertex < root.components.length));
        // Regions sharing an articulation component must place that component once.
        for (let index = groups.length - 1; index >= 0; index--) {
            if ([...groups[index]].some(part => members.has(part))) {
                groups[index].forEach(part => members.add(part));
                groups.splice(index, 1);
            }
        }
        groups.push(members);
    }
    const loopGroupCount = groups.length;
    const used = new Set(groups.flatMap(group => [...group]));
    for (let index = 0; index < root.components.length; index++) {
        if (!used.has(index)) groups.push(new Set([index]));
    }
    return groups.map((members, index) => ({members: [...members], cyclic: index < loopGroupCount,
        neighbors: new Set()}));
}

function regionOrder(region, graph) {
    const members = new Set(region.members), seen = new Set(), order = [];
    const pending = [region.members[0]];
    while (pending.length) {
        const index = pending.pop();
        if (seen.has(index)) continue;
        seen.add(index);
        order.push(index);
        for (const terminals of graph.byNode.values()) {
            if (!terminals.some(terminal => terminal.index === index)) continue;
            for (const terminal of terminals) {
                if (members.has(terminal.index) && !seen.has(terminal.index)) pending.push(terminal.index);
            }
        }
    }
    return order;
}

function rectanglePoint(distance, side) {
    const d = distance % (4 * side);
    return d < side ? [0, side - d] : d < 2 * side ? [d - side, 0] :
        d < 3 * side ? [side, d - 2 * side] : [4 * side - d, side];
}

function automaticDirections(board) {
    const names = ['right', 'down', 'left', 'up'];
    const flow = AXES[names.indexOf(board.flow)], branch = AXES[names.indexOf(board.branches)];
    if (!flow || !branch || flow[0] * branch[0] + flow[1] * branch[1] !== 0 ||
        board.loopArrangement !== 'rectangular') {
        throw new TypeError('ORI automatic board needs perpendicular flow/branch directions and rectangular loop arrangement.');
    }
    return {flow, branch};
}

function automaticPositions(root, board, graph, geometry) {
    const regions = automaticRegions(root, graph), membership = new Map();
    regions.forEach((region, index) => region.members.forEach(part => membership.set(part, index)));
    for (const terminals of graph.byNode.values()) {
        const indices = [...new Set(terminals.map(terminal => membership.get(terminal.index)))];
        for (const a of indices) for (const b of indices) if (a !== b) regions[a].neighbors.add(b);
    }
    const source = membership.get(graph.byNode.get(root.externalNodes[0])?.[0]?.index) ?? 0;
    const levels = new Map(), queue = [source];
    levels.set(source, 0);
    for (let position = 0; position < queue.length; position++) {
        const index = queue[position];
        for (const next of regions[index].neighbors) {
            if (levels.has(next)) continue;
            levels.set(next, levels.get(index) + 1);
            queue.push(next);
        }
    }
    for (let index = 0; index < regions.length; index++) {
        if (!levels.has(index)) { levels.set(index, 0); queue.push(index); }
    }
    const sizes = regions.map(region => {
        const extent = Math.max(...region.members.map(index => {
            const b = geometry.symbol(root.components[index]).bounds;
            return Math.max(b[2] - b[0], b[3] - b[1]);
        }));
        const pitch = Math.ceil((extent + board.componentGap) / board.grid) * board.grid;
        const side = region.cyclic ? Math.ceil(region.members.length / 4) * pitch * 2 : 0;
        return {pitch, side, width: side + pitch, height: side + pitch};
    });
    const positions = new Map();
    let x = board.origin[0];
    const maxLevel = Math.max(...levels.values());
    for (let level = 0; level <= maxLevel; level++) {
        const indices = queue.filter(index => levels.get(index) === level);
        let y = board.origin[1];
        for (const index of indices) {
            const region = regions[index], size = sizes[index], order = regionOrder(region, graph);
            order.forEach((part, position) => {
                const point = region.cyclic ? rectanglePoint(size.side / 2 +
                    position * 4 * size.side / order.length, size.side) : [0, 0];
                positions.set(part, [snap(x + size.pitch / 2 + point[0], board.grid),
                    snap(y + size.pitch / 2 + point[1], board.grid)]);
            });
            y += size.height + board.branchGap;
        }
        x += Math.max(...indices.map(index => sizes[index].width), 0) + board.componentGap;
    }
    const {flow, branch} = automaticDirections(board);
    for (const [index, at] of positions) {
        const x = at[0] - board.origin[0], y = at[1] - board.origin[1];
        positions.set(index, [board.origin[0] + x * flow[0] + y * branch[0],
            board.origin[1] + x * flow[1] + y * branch[1]]);
    }
    return {positions, regions};
}

function terminalDirection(symbol, port) {
    const point = symbol.ports[port - 1], lead = symbol.leads?.[port - 1];
    const inside = lead?.find(at => !same(at, point));
    if (inside) return [Math.sign(point[0] - inside[0]), Math.sign(point[1] - inside[1])];
    const center = [(symbol.bodyBounds[0] + symbol.bodyBounds[2]) / 2,
        (symbol.bodyBounds[1] + symbol.bodyBounds[3]) / 2];
    const delta = [point[0] - center[0], point[1] - center[1]];
    return Math.abs(delta[0]) >= Math.abs(delta[1]) ? [Math.sign(delta[0]) || 1, 0] : [0, Math.sign(delta[1])];
}

function automaticPlacement(root, index, positions, graph, board, geometry) {
    const entry = root.components[index], symbol = geometry.symbol(entry), center = positions.get(index);
    const bodyCenter = [(symbol.bodyBounds[0] + symbol.bodyBounds[2]) / 2,
        (symbol.bodyBounds[1] + symbol.bodyBounds[3]) / 2];
    let best = null;
    for (const mirrorX of [false, true]) for (const mirrorY of [false, true]) {
        for (const angle of [0, 90, 180, 270]) {
            let score = 0;
            entry.nodes.forEach((node, port) => {
                const outward = rotate(terminalDirection(symbol, port + 1), angle, mirrorX, mirrorY);
                const neighbors = graph.byNode.get(node).filter(terminal => terminal.index !== index);
                for (const neighbor of neighbors) {
                    const target = positions.get(neighbor.index);
                    const delta = [target[0] - center[0], target[1] - center[1]], length = Math.hypot(...delta);
                    if (length) score += (outward[0] * delta[0] + outward[1] * delta[1]) / length;
                }
                const external = root.externalNodes.indexOf(node);
                if (external !== -1) {
                    const flow = automaticDirections(board).flow;
                    score += (external === 0 ? -1 : 1) * (outward[0] * flow[0] + outward[1] * flow[1]) * 3;
                }
            });
            if (best && best.score >= score) continue;
            const delta = rotate([symbol.ports[0][0] - bodyCenter[0], symbol.ports[0][1] - bodyCenter[1]],
                angle, mirrorX, mirrorY);
            best = {score, angle, mirrorX, mirrorY,
                at: [snap(center[0] + delta[0], board.grid), snap(center[1] + delta[1], board.grid)]};
        }
    }
    const placement = geometry.placement(entry, 1, best.at, best.angle, best.mirrorY, best.mirrorX);
    placement.boardTile = {kind: 'component', role: 'automaticPart', id: `part:${index}`};
    return placement;
}

function placementBounds(placement, symbol) {
    const source = symbol.ports[placement.sourcePort - 1];
    const [x1, y1, x2, y2] = symbol.bounds;
    const corners = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]].map(point => {
        const v = rotate([point[0] - source[0], point[1] - source[1]], placement.rotation,
            placement.mirrorX, placement.mirrorY);
        return [v[0] + placement.at[0], v[1] + placement.at[1]];
    });
    return [Math.min(...corners.map(p => p[0])), Math.min(...corners.map(p => p[1])),
        Math.max(...corners.map(p => p[0])), Math.max(...corners.map(p => p[1]))];
}

function heapPush(heap, item) {
    heap.push(item);
    let i = heap.length - 1;
    while (i) {
        const parent = Math.floor((i - 1) / 2);
        if (heap[parent].score <= item.score) break;
        heap[i] = heap[parent]; i = parent;
    }
    heap[i] = item;
}

function heapPop(heap) {
    const first = heap[0], last = heap.pop();
    if (heap.length) {
        let i = 0;
        while (2 * i + 1 < heap.length) {
            let child = 2 * i + 1;
            if (child + 1 < heap.length && heap[child + 1].score < heap[child].score) child++;
            if (heap[child].score >= last.score) break;
            heap[i] = heap[child]; i = child;
        }
        heap[i] = last;
    }
    return first;
}

function blocked(point, bounds, clearance) {
    return bounds.some(box => point[0] > box[0] - clearance && point[0] < box[2] + clearance &&
        point[1] > box[1] - clearance && point[1] < box[3] + clearance);
}

function simplifyRoute(points) {
    return points.filter((point, index) => !index || index === points.length - 1 ||
        (point[0] - points[index - 1][0]) * (points[index + 1][1] - point[1]) !==
        (point[1] - points[index - 1][1]) * (points[index + 1][0] - point[0]));
}

export function automaticRoute(start, finish, bounds, obstacles, occupied, node, board) {
    if (same(start, finish)) return [start];
    const points = [start, finish].concat(bounds.flatMap(box => [[box[0], box[1]], [box[2], box[3]]]));
    const min = [0, 1].map(axis => Math.floor((Math.min(...points.map(p => p[axis])) - board.routingMargin) / board.grid) * board.grid);
    const max = [0, 1].map(axis => Math.ceil((Math.max(...points.map(p => p[axis])) + board.routingMargin) / board.grid) * board.grid);
    const key = (point, direction) => `${point[0]},${point[1]},${direction}`;
    const initialDirection = board.startDirection ? AXES.findIndex(axis => same(axis, board.startDirection)) : -1;
    const finishDirection = board.finishDirection ? AXES.findIndex(axis => same(axis, board.finishDirection)) : -1;
    const startKey = key(start, initialDirection), target = finish.join(','), queue = [];
    const best = new Map([[startKey, 0]]), previous = new Map();
    heapPush(queue, {point: start, cost: 0, score: 0, direction: initialDirection, key: startKey});
    while (queue.length) {
        const item = heapPop(queue), currentKey = item.key;
        if (item.cost !== best.get(currentKey)) continue;
        if (item.point[0] === finish[0] && item.point[1] === finish[1]) {
            const path = [finish];
            for (let current = currentKey; previous.has(current);) {
                const prior = previous.get(current);
                current = prior.key;
                path.push(prior.point);
            }
            return simplifyRoute(path.reverse());
        }
        AXES.forEach((direction, index) => {
            const point = [item.point[0] + direction[0] * board.grid, item.point[1] + direction[1] * board.grid];
            const nextKey = key(point, index);
            const pointKey = point.join(',');
            if (point.some((value, axis) => value < min[axis] || value > max[axis]) ||
                blocked(point, bounds, board.clearance) ||
                !same(point, finish) && obstacles.has(pointKey)) return;
            const axis = direction[0] ? 1 : 2;
            if ([point, item.point].some(at => [...(occupied.get(at.join(',')) || [])].some(([id, mask]) =>
                id !== node && (board.allowCrossings === false || mask & axis || mask === 3)))) return;
            const cost = item.cost + board.grid + (item.direction !== -1 && item.direction !== index ? board.bendCost : 0) +
                (same(point, finish) && finishDirection !== -1 && index !== finishDirection ? board.bendCost : 0);
            if (best.has(nextKey) && best.get(nextKey) <= cost) return;
            best.set(nextKey, cost); previous.set(nextKey, {key: currentKey, point: item.point});
            heapPush(queue, {point, cost, direction: index,
                score: cost + Math.abs(point[0] - finish[0]) + Math.abs(point[1] - finish[1]), key: nextKey});
        });
    }
    throw new RangeError('ORI could not route an automatic board connection.');
}

export function recordBoardRoute(points, node, occupied, grid) {
    for (let index = 1; index < points.length; index++) {
        const a = points[index - 1], b = points[index];
        const axis = a[0] === b[0] ? 2 : 1;
        const length = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        for (let step = 0; step <= length; step += grid) {
            const at = [a[0] + Math.sign(b[0] - a[0]) * step, a[1] + Math.sign(b[1] - a[1]) * step];
            const key = at.join(',');
            if (!occupied.has(key)) occupied.set(key, new Map());
            const ids = occupied.get(key);
            ids.set(node, (ids.get(node) || 0) | axis);
        }
    }
}

export function graphWireBoxes(result, node, points, board, id) {
    const path = simplifyRoute(points.filter((point, index) => !index || !same(point, points[index - 1])));
    if (path.length < 2) return;
    // Reserve a corner box at each bend; ordinary wires separate corners from symbols.
    const starts = path.map(point => point.slice()), ends = path.map(point => point.slice());
    for (let i = 1; i < path.length - 1; i++) {
        const before = path[i - 1], at = path[i], after = path[i + 1];
        const reach = Math.min(board.cornerSize,
            (Math.abs(at[0] - before[0]) + Math.abs(at[1] - before[1])) / 3,
            (Math.abs(after[0] - at[0]) + Math.abs(after[1] - at[1])) / 3);
        const distance = Math.floor(reach / board.grid) * board.grid;
        if (!distance) continue;
        const entry = at.map((value, axis) => value - Math.sign(value - before[axis]) * distance);
        const exit = at.map((value, axis) => value + Math.sign(after[axis] - value) * distance);
        ends[i] = entry; starts[i] = exit;
        const tile = {kind: 'cornerWire', id: `${id}:corner:${i}`, length: distance * 2};
        result.wires.push({node, points: [entry, at], boardTile: tile}, {node, points: [at, exit], boardTile: tile});
    }
    for (let i = 0; i < path.length - 1; i++) {
        const a = starts[i], b = ends[i + 1];
        const length = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
        if (length) result.wires.push({node, points: [a, b], boardTile: {kind: 'wire', id: `${id}:${i}`, length}});
    }
}

function automaticJunctions(wires, grid) {
    const nodes = new Map();
    for (const wire of wires) {
        if (!nodes.has(wire.node)) nodes.set(wire.node, new Map());
        const points = nodes.get(wire.node), [a, b] = wire.points;
        const length = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        for (let step = 0; step < length; step += grid) {
            const from = a.map((value, axis) => value + Math.sign(b[axis] - value) * step);
            const to = a.map((value, axis) => value + Math.sign(b[axis] - value) * (step + grid));
            for (const [p, q] of [[from, to], [to, from]]) {
                const key = p.join(',');
                if (!points.has(key)) points.set(key, new Set());
                points.get(key).add(q.join(','));
            }
        }
    }
    return [...nodes].flatMap(([node, points]) => [...points].flatMap(([key, neighbors]) =>
        neighbors.size > 2 ? [{node, at: key.split(',').map(Number)}] : []));
}

export function layoutAutomaticBoard(root, definition, geometry) {
    const {board} = definition;
    const graph = graphIncidence(root);
    if (!root.components.length || root.externalNodes.some(node => !graph.byNode.has(node))) {
        throw new TypeError('ORI needs component terminals for each external node.');
    }
    const {positions, regions} = automaticPositions(root, board, graph, geometry);
    const ordered = [...positions.keys()].sort((a, b) => positions.get(a)[0] - positions.get(b)[0] ||
        positions.get(a)[1] - positions.get(b)[1] || a - b);
    const byIndex = new Map(ordered.map(index => [index,
        automaticPlacement(root, index, positions, graph, board, geometry)]));
    const placements = root.components.map((_, index) => byIndex.get(index));
    const bounds = placements.map((placement, index) => placementBounds(placement, geometry.symbol(root.components[index])));
    const result = {grid: board.grid, placements, wires: [], nodePoints: new Map(), externalPorts: [],
        regions: regions.filter(region => region.cyclic).map(region => ({kind: 'loop', components: region.members.map(index => index + 1)}))};
    const terminals = new Map();
    placements.forEach((placement, index) => placement.ports.forEach(port => {
        const direction = rotate(terminalDirection(geometry.symbol(root.components[index]), port.port),
            placement.rotation, placement.mirrorX, placement.mirrorY);
        if (!terminals.has(port.node)) terminals.set(port.node, []);
        terminals.get(port.node).push({...port, escape: port.at.map((value, axis) => value + direction[axis] * board.wireBoxLength)});
    }));
    root.externalNodes.forEach((node, index) => {
        const owner = terminals.get(node)[0];
        const direction = owner.escape.map((value, axis) => Math.sign(value - owner.at[axis]));
        const port = {port: index + 1, node,
            at: owner.at.map((value, axis) => value + direction[axis] * board.externalPortLead)};
        result.externalPorts.push(port);
        terminals.get(node).push({...port, escape: port.at});
    });
    const obstacles = new Map();
    for (const [node, ends] of terminals) for (const terminal of ends) {
        for (const point of [terminal.at, terminal.escape]) obstacles.set(point.join(','), node);
    }
    const occupied = new Map();
    for (const [node, ends] of terminals) {
        const excluded = new Set([...obstacles].filter(([, id]) => id !== node).map(([key]) => key));
        for (let index = 1; index < ends.length; index++) {
            const a = ends[0], b = ends[index];
            const routed = automaticRoute(a.escape, b.escape, bounds, excluded, occupied, node, board);
            const points = [a.at, ...routed, b.at];
            recordBoardRoute(points, node, occupied, board.grid);
            graphWireBoxes(result, node, points, board, `net:${node}:${index}`);
        }
    }
    for (const node of terminals.keys()) {
        const wires = result.wires.filter(wire => wire.node === node && wire.boardTile.kind === 'wire')
            .sort((a, b) => b.boardTile.length - a.boardTile.length);
        let point = null;
        for (const wire of wires) {
            const [a, b] = wire.points, length = wire.boardTile.length;
            for (let offset = 0; offset <= length && !point; offset += board.grid) {
                const step = Math.min(length, Math.max(0, snap(length / 2, board.grid) +
                    (offset % (2 * board.grid) ? -offset : offset)));
                const candidate = a.map((value, axis) => value + Math.sign(b[axis] - value) * step);
                if ([...(occupied.get(candidate.join(',')) || [])].every(([id]) => id === node)) point = candidate;
            }
            if (point) break;
        }
        if (!point) throw new RangeError('ORI could not place a node dot clear of other connections.');
        result.nodePoints.set(node, point);
    }
    result.junctions = automaticJunctions(result.wires, board.grid);
    result.crossings = [...occupied].filter(([, ids]) => ids.size > 1)
        .map(([key]) => key.split(',').map(Number));
    return result;
}
