// Modified: 2026-11-07
// Shared composition of node-bounded boards. No RF shape is selected by name.

function compositionError(message) {
    throw new RangeError(`Schematic board composition: ${message}`);
}

function boundaryNodes(value) {
    return Array.isArray(value) ? value.slice() : [value];
}

function boardInterface(definition, boards, visited = new Set()) {
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

function compositionAdjacency(root, sections) {
    const adjacency = new Map();
    root.components.forEach((entry, index) => entry.nodes.forEach(node => {
        if (!adjacency.has(node)) adjacency.set(node, []);
        adjacency.get(node).push(index);
    }));
    const counts = new Map(), externalCounts = new Map();
    for (const node of root.externalNodes) externalCounts.set(node, (externalCounts.get(node) || 0) + 1);
    for (const section of sections) {
        for (const node of boundaryNodes(section.from).concat(boundaryNodes(section.to))) {
            counts.set(node, (counts.get(node) || 0) + 1);
        }
    }
    for (const [node, count] of counts) {
        const externalCount = externalCounts.get(node) || 0;
        if (count !== (externalCount ? 1 : 2) || (adjacency.get(node)?.length || 0) + externalCount !== 2) {
            compositionError(`node ${node} must join two terminals and belong to the correct section boundaries.`);
        }
    }
    if (root.externalNodes.some(node => !counts.has(node))) compositionError('an external port is outside the sections.');
    return {adjacency, boundaries: new Set(counts.keys())};
}

function sectionComponents(root, section, adjacency, boundaries, used) {
    const pending = boundaryNodes(section.from).flatMap(node => adjacency.get(node) || [])
        .filter(index => !used.has(index));
    const selected = new Set();
    while (pending.length) {
        const index = pending.pop();
        if (selected.has(index) || used.has(index)) continue;
        selected.add(index);
        for (const node of root.components[index].nodes) {
            if (!boundaries.has(node)) pending.push(...adjacency.get(node));
        }
    }
    const indices = [...selected].sort((a, b) => a - b);
    const terminals = indices.flatMap(index => root.components[index].nodes);
    const expected = new Set(boundaryNodes(section.from).concat(boundaryNodes(section.to)));
    if (!indices.length || [...expected].some(node => terminals.filter(value => value === node).length !== 1) ||
        terminals.some(node => boundaries.has(node) && !expected.has(node))) {
        compositionError(`"${section.name}" boundaries do not isolate one complete section.`);
    }
    return indices;
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

function alignSection(result, section, seams, grid) {
    const inputs = boundaryNodes(section.from).map(node => result.externalPorts.find(port => port.node === node));
    const shared = inputs.filter(port => seams.has(port.node));
    if (!shared.length) compositionError('sections must be supplied in connected input-to-output order.');
    const first = shared[0], target = seams.get(first.node);
    const offset = first.at.map((value, axis) => target[axis] - value);
    if (offset.some(value => value % grid !== 0) || shared.some(port =>
        port.at.some((value, axis) => value + offset[axis] !== seams.get(port.node)[axis]))) {
        compositionError('connected board interfaces need matching port spacing and ordering.');
    }
    translateSection(result, offset);
}

export function composeSchematicBoards(root, definition, geometry, interpret) {
    const {sections} = definition, boards = geometry.boards;
    const {adjacency, boundaries} = compositionAdjacency(root, sections);
    const used = new Set(), seams = new Map(), components = new Map();
    const combined = {grid: definition.board.grid, placements: [], wires: [], nodePoints: new Map(),
        byIndex: components, externalPorts: [], sections: []};
    for (const [sectionIndex, section] of sections.entries()) {
        const source = boards[section.name];
        const externalNodes = sectionExternalNodes(section, source, boards);
        const indices = sectionComponents(root, section, adjacency, boundaries, used);
        const network = {...root, components: indices.map(index => root.components[index]), externalNodes};
        const result = interpret(network, source, geometry);
        if (!result) compositionError(`section ${sectionIndex + 1} does not match "${section.name}".`);
        if (result.grid !== combined.grid) compositionError('sections must share a placement grid.');
        if (sectionIndex) alignSection(result, section, seams, combined.grid);
        for (const port of result.externalPorts) {
            if (seams.has(port.node)) combined.nodePoints.set(port.node, port.at.slice());
            else seams.set(port.node, port.at.slice());
        }
        for (const [node, point] of result.nodePoints) {
            if (!combined.nodePoints.has(node)) combined.nodePoints.set(node, point);
        }
        indices.forEach((index, localIndex) => {
            if (used.has(index)) compositionError('a component belongs to more than one section.');
            used.add(index);
            const placement = result.byIndex.get(localIndex);
            if (!placement) compositionError('a bound component has no placement.');
            // Tile IDs are local to a board; namespace them when several boards
            // share one graph so separate corner boxes cannot be merged.
            placement.boardTile = {...placement.boardTile,
                id: `section:${sectionIndex}:${placement.boardTile.id}`};
            components.set(index, placement);
        });
        combined.wires.push(...result.wires.map(wire => ({...wire, boardTile: {...wire.boardTile,
            id: `section:${sectionIndex}:${wire.boardTile.id}`}})));
        combined.sections.push({name: section.name, from: section.from, to: section.to,
            ...(result.definition?.variant || source.variant ? {pattern: result.definition?.variant || source.variant} : {}),
            components: result.placements.map(placement => placement.id)});
        for (const port of result.externalPorts.filter(port => root.externalNodes.includes(port.node))) {
            combined.externalPorts.push({...port, port: root.externalNodes.indexOf(port.node) + 1});
        }
    }
    if (used.size !== root.components.length || combined.externalPorts.length !== root.externalNodes.length) {
        compositionError('sections must cover every component and external port exactly once.');
    }
    combined.placements = root.components.map((_, index) => components.get(index));
    combined.externalPorts.sort((a, b) => a.port - b.port);
    return combined;
}
