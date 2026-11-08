// Modified: 2026-11-08
// Compose measured boards and direct junction symbols through their electrical boundaries.
import {automaticRoute, recordBoardRoute, graphWireBoxes} from './schematicBoardGraph';

function compositionError(message) {
    throw new RangeError(`Schematic board composition: ${message}`);
}

function boundaryNodes(value) {
    return Array.isArray(value) ? value.slice() : [value];
}

export function boardInterface(definition, boards, visited = new Set()) {
    if (!definition || visited.has(definition)) compositionError('unknown or circular board reference.');
    if (definition.interface) return definition.interface;
    if (!definition.use) compositionError(`"${definition.name}" has no declared from/to interface.`);
    return boardInterface(boards[definition.use], boards, new Set([...visited, definition]));
}

function sectionExternalNodes(section, definition, boards) {
    const ports = boardInterface(definition, boards), nodes = [];
    for (const side of ['from', 'to']) {
        const boundary = boundaryNodes(section[side]);
        if (!Array.isArray(ports[side]) || boundary.length !== ports[side].length) {
            compositionError(`"${section.name}" ${side} needs ${ports[side]?.length || 0} node(s).`);
        }
        ports[side].forEach((port, index) => {
            if (!Number.isInteger(port) || port < 1 || nodes[port - 1] !== undefined) {
                compositionError('board interface must name distinct positive port numbers.');
            }
            nodes[port - 1] = boundary[index];
        });
    }
    if (Array.from(nodes).includes(undefined) || new Set(nodes).size !== nodes.length) {
        compositionError('section interface must cover consecutive ports with distinct nodes.');
    }
    return nodes;
}

function compositionRegions(root, sections) {
    const boundaries = new Set(root.externalNodes.concat(sections.flatMap(section =>
        boundaryNodes(section.from).concat(boundaryNodes(section.to)))));
    const adjacency = new Map();
    root.components.forEach((entry, index) => entry.nodes.forEach(node => {
        if (!adjacency.has(node)) adjacency.set(node, []);
        adjacency.get(node).push(index);
    }));
    const external = new Set(root.externalNodes);
    if (external.size !== root.externalNodes.length) compositionError('external nodes must be distinct.');
    for (const node of boundaries) {
        if ((adjacency.get(node)?.length || 0) + (external.has(node) ? 1 : 0) !== 2) {
            compositionError(`node ${node} must join two terminals; use an explicit junction component.`);
        }
    }
    const seen = new Set(), regions = [];
    for (let start = 0; start < root.components.length; start++) {
        if (seen.has(start)) continue;
        const pending = [start], indices = [], ends = [];
        while (pending.length) {
            const index = pending.pop();
            if (seen.has(index)) continue;
            seen.add(index); indices.push(index);
            for (const node of root.components[index].nodes) {
                if (boundaries.has(node)) ends.push(node);
                else pending.push(...adjacency.get(node));
            }
        }
        regions.push({indices: indices.sort((a, b) => a - b), ends});
    }
    return regions;
}

function sameNodes(a, b) {
    return a.length === b.length && new Set(a).size === a.length && a.every(node => b.includes(node));
}

function translateSection(result, offset) {
    for (const placement of result.placements) {
        placement.at = placement.at.map((value, axis) => value + offset[axis]);
        placement.ports = placement.ports.map(port => ({...port,
            at: port.at.map((value, axis) => value + offset[axis])}));
    }
    result.wires = result.wires.map(wire => ({...wire,
        points: wire.points.map(point => point.map((value, axis) => value + offset[axis]))}));
    result.nodePoints = new Map([...result.nodePoints].map(([node, point]) =>
        [node, point.map((value, axis) => value + offset[axis])]));
    result.externalPorts = result.externalPorts.map(port => ({...port,
        at: port.at.map((value, axis) => value + offset[axis])}));
}

function measureSection(result, geometry) {
    const points = result.externalPorts.map(port => port.at).concat(result.wires.flatMap(wire => wire.points),
        result.placements.flatMap(part => {
            const box = geometry.bounds(part);
            return [[box[0], box[1]], [box[2], box[3]]];
        }));
    return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])),
        Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))];
}

function compactSectionLeads(item, geometry, grid) {
    if (item.entry) return;
    const result = item.result, leads = new Map();
    for (const external of result.externalPorts) {
        const wires = result.wires.filter(wire => wire.node === external.node);
        const terminal = result.placements.flatMap(part => part.ports).find(port => port.node === external.node);
        if (wires.length !== 1 || wires[0].boardTile.kind !== 'wire' || !terminal) continue;
        const wire = wires[0];
        if (!wire.points.some(point => point[0] === terminal.at[0] && point[1] === terminal.at[1])) continue;
        const direction = terminalDirection(item, external, geometry);
        leads.set(external.node, {wire, terminal, direction, external});
    }
    if (!leads.size) return;
    result.wires = result.wires.filter(wire => !leads.has(wire.node));
    result.externalPorts = result.externalPorts.map(port => leads.has(port.node) ?
        {...port, at: leads.get(port.node).terminal.at.slice()} : port);
    const bounds = measureSection(result, geometry);
    result.externalPorts = result.externalPorts.map(port => {
        const lead = leads.get(port.node);
        if (!lead) return port;
        const {terminal, direction, external, wire} = lead;
        const axis = direction[0] ? 0 : 1;
        const reach = Math.max(0, (bounds[axis + (direction[axis] > 0 ? 2 : 0)] - terminal.at[axis]) * direction[axis]);
        const original = Math.abs(external.at[axis] - terminal.at[axis]);
        // Retain only the part of a lead needed to reach the complete section's
        // outer envelope. The composer supplies the wire between sections.
        const length = Math.min(original, Math.ceil(reach / grid) * grid);
        const at = terminal.at.map((value, index) => value + direction[index] * length);
        if (length) result.wires.push({...wire, points: [terminal.at.slice(), at.slice()],
            boardTile: {...wire.boardTile, length}});
        result.nodePoints.delete(port.node);
        return {...port, at, direction};
    });
}

function bindSections(root, definition, geometry, interpret) {
    const regions = compositionRegions(root, definition.sections), claimed = new Set(), items = [];
    for (const [sectionIndex, section] of definition.sections.entries()) {
        const source = geometry.boards[section.name];
        const externalNodes = sectionExternalNodes(section, source, geometry.boards);
        const candidates = regions.filter(region => sameNodes(region.ends, externalNodes));
        if (candidates.length !== 1 || claimed.has(candidates[0])) {
            compositionError(`"${section.name}" boundaries do not isolate one complete, unclaimed section.`);
        }
        const region = candidates[0]; claimed.add(region);
        const network = {...root, components: region.indices.map(index => root.components[index]), externalNodes};
        const result = interpret(network, source, geometry);
        if (!result) compositionError(`section boundaries for section ${sectionIndex + 1} do not match "${section.name}".`);
        if (result.grid !== definition.board.grid) compositionError('sections must share a placement grid.');
        items.push({section, sectionIndex, source, indices: region.indices, result,
            from: boundaryNodes(section.from), to: boundaryNodes(section.to)});
    }
    for (const region of regions.filter(region => !claimed.has(region))) {
        if (region.indices.some(index => root.components[index].nodes.length === 2)) {
            compositionError('sections must cover every component; only direct junctions and terminations may remain.');
        }
        for (const index of region.indices) items.push({indices: [index],
            entry: root.components[index], from: [], to: []});
    }
    return items;
}

function sectionGraph(root, items) {
    const byNode = new Map(), add = (node, end) => {
        if (!byNode.has(node)) byNode.set(node, []);
        byNode.get(node).push(end);
    };
    for (const item of items) {
        const nodes = item.entry ? item.entry.nodes : item.from.concat(item.to);
        for (const node of nodes) add(node, {item, side: item.entry ? null : item.from.includes(node) ? 'from' : 'to'});
    }
    const externalItems = root.externalNodes.map((node, index) => {
        const item = {external: index + 1, node, from: index ? [node] : [], to: index ? [] : [node]};
        add(node, {item, side: index ? 'from' : 'to'});
        return item;
    });
    const vertices = items.concat(externalItems), edges = [];
    for (const [node, ends] of byNode) {
        if (ends.length !== 2) compositionError(`boundary node ${node} must connect exactly two sections or terminals.`);
        let [a, b] = ends;
        if (a.side === 'from' || b.side === 'to') [a, b] = [b, a];
        if (a.side && b.side && a.side === b.side) compositionError(`node ${node} joins two ${a.side} boundaries.`);
        edges.push({node, source: a.item, target: b.item, unknown: !a.side && !b.side});
    }
    // Only direct-to-direct junction links lack a direction. Orient those away
    // from port 1; explicit shape interfaces determine every other direction.
    const depth = new Map([[externalItems[0], 0]]), pending = [externalItems[0]];
    for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        for (const edge of edges.filter(edge => edge.source === item || edge.target === item)) {
            const next = edge.source === item ? edge.target : edge.source;
            if (!depth.has(next)) { depth.set(next, depth.get(item) + 1); pending.push(next); }
        }
    }
    if (depth.size !== vertices.length) compositionError('sections must form one connected network.');
    for (const edge of edges.filter(edge => edge.unknown)) {
        if (depth.get(edge.source) === depth.get(edge.target)) compositionError('direct junction flow is ambiguous; supply section boundaries.');
        if (depth.get(edge.source) > depth.get(edge.target)) [edge.source, edge.target] = [edge.target, edge.source];
    }
    for (const item of vertices) {
        item.inputs = edges.filter(edge => edge.target === item);
        item.outputs = edges.filter(edge => edge.source === item);
        if (item.entry) {
            item.from = item.entry.nodes.filter(node => item.inputs.some(edge => edge.node === node));
            item.to = item.entry.nodes.filter(node => item.outputs.some(edge => edge.node === node));
        }
        item.inputs.sort((a, b) => item.from.indexOf(a.node) - item.from.indexOf(b.node));
        item.outputs.sort((a, b) => item.to.indexOf(a.node) - item.to.indexOf(b.node));
    }
    const ordered = [], remaining = new Map(vertices.map(item => [item, item.inputs.length]));
    const queue = vertices.filter(item => !item.inputs.length);
    if (queue.length !== 1 || queue[0] !== externalItems[0]) compositionError('flow must start at external port 1.');
    for (let i = 0; i < queue.length; i++) {
        const item = queue[i]; ordered.push(item);
        for (const edge of item.outputs) {
            const next = edge.target; remaining.set(next, remaining.get(next) - 1);
            if (!remaining.get(next)) queue.push(next);
        }
    }
    if (ordered.length !== vertices.length) compositionError('section flow contains a cycle; keep loops inside a shaped section.');
    return {ordered, edges};
}

function leadDirection(entry, placement, port, geometry) {
    const symbol = geometry.symbol(entry), at = symbol.ports[port - 1];
    const inner = symbol.leads?.[port - 1]?.find(point => point[0] !== at[0] || point[1] !== at[1]);
    if (!inner) compositionError('direct components need canonical terminal lead directions.');
    let [x, y] = at.map((value, axis) => Math.sign(value - inner[axis]));
    if (placement.mirrorX) x = -x;
    if (placement.mirrorY) y = -y;
    return placement.rotation === 0 ? [x, y] : placement.rotation === 90 ? [-y, x] :
        placement.rotation === 180 ? [-x, -y] : [y, -x];
}

function placeDirectItem(item, geometry, grid) {
    const {entry} = item;
    let best = null, bestCost = Infinity;
    for (const mirrorX of [false, true]) for (const angle of [0, 90, 180, 270]) {
        const part = geometry.preview(entry, 1, [0, 0], angle, false, mirrorX);
        let cost = part.ports.reduce((sum, port) => {
            const direction = leadDirection(entry, part, port.port, geometry);
            const input = item.from.includes(port.node);
            const single = (input ? item.from : item.to).length === 1;
            return sum + (direction[0] === (input ? -1 : 1) ? 0 : direction[0] === 0 ? (single ? 20 : 1) : 40);
        }, 0);
        for (const side of ['from', 'to']) {
            const ports = item[side].map(node => part.ports.find(port => port.node === node));
            for (let i = 1; i < ports.length; i++) if (ports[i].at[1] < ports[i - 1].at[1]) cost += 10;
        }
        if (cost < bestCost) { best = part; bestCost = cost; }
    }
    const placement = geometry.placement(entry, 1, [0, 0], best.rotation, best.mirrorY, best.mirrorX);
    placement.boardTile = {kind: 'component', role: 'junction', id: 'component'};
    // Canonical top-to-bottom geometry gives direct junctions their track order.
    for (const side of ['from', 'to']) item[side].sort((a, b) => {
        const p = placement.ports.find(port => port.node === a), q = placement.ports.find(port => port.node === b);
        return p.at[1] - q.at[1] || p.at[0] - q.at[0];
    });
    item.inputs.sort((a, b) => item.from.indexOf(a.node) - item.from.indexOf(b.node));
    item.outputs.sort((a, b) => item.to.indexOf(a.node) - item.to.indexOf(b.node));
    item.result = {grid, placements: [placement], byIndex: new Map([[0, placement]]), wires: [],
        nodePoints: new Map(), externalPorts: placement.ports.map(port => ({...port}))};
}

function commonTrack(keys) {
    const result = keys[0].slice();
    for (const key of keys.slice(1)) {
        let length = 0;
        while (length < result.length && length < key.length && result[length] === key[length]) length++;
        result.length = length;
    }
    return result;
}

function compareTracks(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
}

function trackContains(parent, child) {
    return parent.length <= child.length && parent.every((value, index) => child[index] === value);
}

function sectionAxis(item) {
    if (item.external) return 0;
    const centers = ['from', 'to'].map(side => {
        const ports = item.result.externalPorts.filter(port => item[side].includes(port.node));
        return ports.length ? ports.reduce((sum, port) => sum + port.at[1], 0) / ports.length : null;
    }).filter(value => value !== null);
    return centers.reduce((sum, value) => sum + value, 0) / centers.length;
}

function layoutSections(ordered, geometry, grid) {
    for (const item of ordered) {
        item.rank = item.inputs.length ? Math.max(...item.inputs.map(edge => edge.source.rank)) + 1 : 0;
        item.track = item.inputs.length ? commonTrack(item.inputs.map(edge => edge.track)) : [];
        if (item.inputs.some((edge, index) => index && compareTracks(item.inputs[index - 1].track, edge.track) > 0)) {
            compositionError('input boundary order requires a crossover; crossover routing is not enabled.');
        }
        item.outputs.forEach((edge, index) => {
            edge.track = item.outputs.length > 1 ? item.track.concat(index) : item.track.slice();
        });
        item.bounds = item.external ? [0, 0, 0, 0] : measureSection(item.result, geometry);
        item.axis = sectionAxis(item);
    }
    const keys = ordered.map(item => item.track);
    const leaves = keys.filter(key => !keys.some(other => other.length > key.length && trackContains(key, other)))
        .filter((key, index, all) => all.findIndex(other => compareTracks(key, other) === 0) === index)
        .sort(compareTracks);
    // Reserve asymmetric clearance around the electrical axis. A downward
    // attachment needs room below its track; it must not lift the main path.
    const bands = leaves.map(key => {
        const items = ordered.filter(item => compareTracks(item.track, key) === 0);
        return {above: Math.ceil(Math.max(100, ...items.map(item => item.axis - item.bounds[1] + 100)) / grid) * grid,
            below: Math.ceil(Math.max(100, ...items.map(item => item.bounds[3] - item.axis + 100)) / grid) * grid};
    });
    // A complete enclosing section must fit its descendant band too. Grow the
    // measured bands, rather than moving individual symbols inside any board.
    for (const item of ordered) {
        const indices = leaves.map((key, index) => trackContains(item.track, key) ? index : -1).filter(index => index >= 0);
        const required = item.bounds[3] - item.bounds[1] + 200;
        const available = indices.reduce((sum, index) => sum + bands[index].above + bands[index].below, 0);
        if (required > available) for (const index of indices) {
            const growth = Math.ceil((required - available) / (2 * indices.length * grid)) * grid;
            bands[index].above += growth;
            bands[index].below += growth;
        }
    }
    let cursor = 0;
    const centers = bands.map(band => {
        // Keep track axes on every second placement-grid line. Their midpoint
        // then lies on the placement grid too, so centering a splitter or
        // combiner cannot add half a grid step to one vertical leg.
        const center = Math.ceil((cursor + band.above) / (2 * grid)) * 2 * grid;
        cursor = center + band.below;
        return center;
    });
    const ranks = Array.from({length: Math.max(...ordered.map(item => item.rank)) + 1}, () => []);
    for (const item of ordered) ranks[item.rank].push(item);
    const links = ordered.flatMap(item => item.outputs);
    let x = 0;
    for (const rank of ranks) {
        const width = Math.max(...rank.map(item => item.bounds[2] - item.bounds[0]));
        for (const item of rank) {
            const tracks = leaves.map((key, index) => trackContains(item.track, key) ? index : -1).filter(index => index >= 0);
            const y = Math.round((centers[tracks[0]] + centers[tracks.at(-1)]) / (2 * grid)) * grid;
            if (item.external) item.at = [x, y];
            else {
                translateSection(item.result, [x - item.bounds[0], Math.round((y - item.axis) / grid) * grid]);
            }
        }
        // Standard wire spacing joins already measured section envelopes.
        // Reserve additional channels only when several interfaces cross a cut.
        const channels = links.filter(edge =>
            edge.source.rank <= rank[0].rank && edge.target.rank > rank[0].rank).length;
        x += width + Math.max(8 * grid, (channels + 1) * 2 * grid);
    }
}

function existingTerminal(item, node) {
    if (item.external) return {node, at: item.at, direction: [item.external === 1 ? 1 : -1, 0]};
    const port = item.result.externalPorts.find(port => port.node === node);
    return {...port};
}

function terminalDirection(item, terminal, geometry) {
    if (terminal.direction) return terminal.direction;
    if (item.entry) {
        const placement = item.result.placements[0];
        const port = placement.ports.find(port => port.node === terminal.node);
        return leadDirection(item.entry, placement, port.port, geometry);
    }
    for (const wire of item.result.wires) {
        const index = wire.points.findIndex(point => point[0] === terminal.at[0] && point[1] === terminal.at[1]);
        if (index < 0) continue;
        const inner = wire.points[index ? index - 1 : 1];
        return terminal.at.map((value, axis) => Math.sign(value - inner[axis]));
    }
    compositionError('a section boundary has no wire terminal.');
}

function interfaceShifts(items, adjacency) {
    const anchor = items.slice().sort((a, b) => interfaceAnchorPriority(a) - interfaceAnchorPriority(b) || a.rank - b.rank)[0];
    const shifts = new Map([[anchor, 0]]), pending = [anchor];
    for (let index = 0; index < pending.length; index++) {
        const item = pending[index];
        for (const link of adjacency.get(item) || []) {
            const shift = shifts.get(item) + link.shift;
            if (shifts.has(link.other)) {
                if (shifts.get(link.other) !== shift) return null;
            } else {
                shifts.set(link.other, shift);
                pending.push(link.other);
            }
        }
    }
    return shifts;
}

function interfaceAnchorPriority(item) {
    return item.external ? 0 : item.from.length + item.to.length > 2 ? 1 : 2;
}

function interfaceClearance(ordered, shifts, geometry, grid) {
    const bounds = ordered.filter(item => !item.external).map(item => {
        const box = measureSection(item.result, geometry), shift = shifts.get(item) || 0;
        return {item, box: [box[0], box[1] + shift, box[2], box[3] + shift]};
    });
    for (let i = 0; i < bounds.length; i++) for (const other of bounds.slice(i + 1)) {
        const a = bounds[i], b = other;
        if (!shifts.has(a.item) && !shifts.has(b.item)) continue;
        if (a.box[0] < b.box[2] + grid && b.box[0] < a.box[2] + grid &&
            a.box[1] < b.box[3] + grid && b.box[1] < a.box[3] + grid) return false;
    }
    return true;
}

function alignSectionInterfaces(ordered, edges, geometry, grid) {
    const adjacency = new Map();
    for (const edge of edges) {
        const a = existingTerminal(edge.source, edge.node), b = existingTerminal(edge.target, edge.node);
        const from = terminalDirection(edge.source, a, geometry), to = terminalDirection(edge.target, b, geometry);
        // Vertical leads deliberately turn toward their tracks. Horizontal
        // interfaces that face each other should share the same wire height.
        if (from[0] !== 1 || from[1] !== 0 || to[0] !== -1 || to[1] !== 0 || a.at[0] >= b.at[0]) continue;
        const shift = a.at[1] - b.at[1];
        for (const [item, other, delta] of [[edge.source, edge.target, shift], [edge.target, edge.source, -shift]]) {
            if (!adjacency.has(item)) adjacency.set(item, []);
            adjacency.get(item).push({other, shift: delta});
        }
    }
    const visited = new Set();
    for (const start of ordered) {
        if (visited.has(start) || !adjacency.has(start)) continue;
        const members = [], pending = [start];
        while (pending.length) {
            const item = pending.pop();
            if (visited.has(item)) continue;
            visited.add(item); members.push(item);
            pending.push(...adjacency.get(item).map(link => link.other));
        }
        // An external port or multiport section anchors this system. Unequal
        // fixed port pitches can make its equations inconsistent; those keep
        // their original placement and use the ordinary routed connections.
        const shifts = interfaceShifts(members, adjacency);
        if (!shifts || [...shifts.values()].some(shift => shift % grid !== 0) ||
            !interfaceClearance(ordered, shifts, geometry, grid)) continue;
        for (const [item, shift] of shifts) {
            if (!shift) continue;
            if (item.external) item.at = [item.at[0], item.at[1] + shift];
            else translateSection(item.result, [0, shift]);
        }
    }
}

function registerSection(result, item, root, combined) {
    const prefix = item.section ? `section:${item.sectionIndex}` : `direct:${item.indices[0]}`;
    for (const [localIndex, index] of item.indices.entries()) {
        const placement = result.byIndex.get(localIndex);
        if (!placement || combined.byIndex.has(index)) compositionError('each component must have exactly one placement.');
        placement.boardTile = {...placement.boardTile, id: `${prefix}:${placement.boardTile.id}`};
        combined.byIndex.set(index, placement);
    }
    combined.wires.push(...result.wires.map(wire => ({...wire, boardTile: {...wire.boardTile,
        id: `${prefix}:${wire.boardTile.id}`}})));
    for (const [node, point] of result.nodePoints) combined.nodePoints.set(node, point);
    if (item.section) combined.sections.push({name: item.section.name, from: item.section.from, to: item.section.to,
        ...(result.definition?.variant || item.source.variant ? {pattern: result.definition?.variant || item.source.variant} : {}),
        components: result.placements.map(placement => placement.id)});
}

function routeSections(root, ordered, edges, geometry, combined) {
    const grid = combined.grid, board = {grid, clearance: 10, routingMargin: 100,
        wireBoxLength: 20, cornerSize: 10, bendCost: 20, allowCrossings: false};
    const bounds = ordered.filter(item => !item.external).map(item => measureSection(item.result, geometry));
    const occupied = new Map(), obstacles = new Set();
    for (const wire of combined.wires) recordBoardRoute(wire.points, wire.node, occupied, grid);
    const routes = edges.map(edge => {
        const ends = [edge.source, edge.target].map(item => {
            const terminal = existingTerminal(item, edge.node), direction = terminalDirection(item, terminal, geometry);
            const escape = terminal.at.map((value, axis) => value + direction[axis] * 20);
            obstacles.add(terminal.at.join(',')); obstacles.add(escape.join(','));
            return {...terminal, direction, escape};
        });
        return {...edge, ends};
    });
    // Reserve terminal leads first, so another route cannot steal their exits.
    for (const {node, ends} of routes) for (const end of ends) recordBoardRoute([end.at, end.escape], node, occupied, grid);
    for (const [index, {node, ends}] of routes.entries()) {
        const [a, b] = ends, excluded = new Set(obstacles);
        for (const end of ends) { excluded.delete(end.at.join(',')); excluded.delete(end.escape.join(',')); }
        let points;
        try { points = automaticRoute(a.escape, b.escape, bounds, excluded, occupied, node,
            {...board, startDirection: a.direction, finishDirection: b.direction.map(value => -value)}); }
        catch (error) {
            if (!(error instanceof RangeError)) throw error;
            compositionError(`node ${node} could not be routed without a crossover; crossover routing is not enabled.`);
        }
        points = [a.at, ...points, b.at];
        recordBoardRoute(points, node, occupied, grid);
        graphWireBoxes(combined, node, points, board, `seam:${index}`);
    }
    // Reject contacts and overlaps as well as perpendicular crossings. A single
    // electrical node may of course have several contiguous wire boxes.
    const checked = new Map();
    for (const wire of combined.wires) {
        const own = new Map(); recordBoardRoute(wire.points, wire.node, own, grid);
        for (const key of own.keys()) {
            if (checked.has(key) && checked.get(key) !== wire.node) compositionError('drawing requires a wire crossover; crossover routing is not enabled.');
            checked.set(key, wire.node);
        }
    }
    for (const node of new Set(root.components.flatMap(entry => entry.nodes))) {
        const wires = combined.wires.filter(wire => wire.node === node && wire.boardTile.kind === 'wire')
            .sort((a, b) => b.boardTile.length - a.boardTile.length);
        if (!wires.length) compositionError(`node ${node} has no straight wire box.`);
        const [a, b] = wires[0].points;
        combined.nodePoints.set(node, a.map((value, axis) => Math.round((value + b[axis]) / (2 * grid)) * grid));
    }
}

// Reuse the composer's electrical-flow validation while inferring group interfaces.
// This step never creates placements, labels or wires.
export function validateSchematicSections(root, sections, memberships) {
    const used = new Set();
    const items = sections.map((section, index) => {
        for (const part of memberships[index]) used.add(part);
        return {section, indices: memberships[index], from: boundaryNodes(section.from), to: boundaryNodes(section.to)};
    });
    root.components.forEach((entry, index) => {
        if (used.has(index)) return;
        if (entry.nodes.length === 2) compositionError('ungrouped two-port components must belong to a shape group.');
        items.push({indices: [index], entry, from: [], to: []});
    });
    sectionGraph(root, items);
    return true;
}

export function composeSchematicBoards(root, definition, geometry, interpret) {
    const items = bindSections(root, definition, geometry, interpret);
    const {ordered, edges} = sectionGraph(root, items);
    for (const item of items.filter(item => item.entry)) placeDirectItem(item, geometry, definition.board.grid);
    for (const item of items) compactSectionLeads(item, geometry, definition.board.grid);
    layoutSections(ordered, geometry, definition.board.grid);
    alignSectionInterfaces(ordered, edges, geometry, definition.board.grid);
    const combined = {grid: definition.board.grid, placements: [], wires: [], nodePoints: new Map(),
        byIndex: new Map(), externalPorts: [], sections: []};
    for (const item of items) registerSection(item.result, item, root, combined);
    routeSections(root, ordered, edges, geometry, combined);
    combined.placements = root.components.map((_, index) => combined.byIndex.get(index));
    for (const item of ordered.filter(item => item.external)) combined.externalPorts.push({
        port: item.external, node: item.node, at: item.at});
    combined.externalPorts.sort((a, b) => a.port - b.port);
    return combined;
}
