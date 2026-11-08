// Modified: 2026-11-08
import {matchSchematicBoard} from './schematicBoardInterpreter';
import {boardInterface, validateSchematicSections} from './schematicBoardComposition';

function groupError(message) {
    throw new RangeError(`Schematic shape groups: ${message}`);
}

export function detectionBoards(boards) {
    return Object.entries(boards).filter(([, definition]) =>
        definition.detect === true && !definition.board?.automatic)
        .sort(([a, left], [b, right]) => (right.detectionPriority ?? 0) - (left.detectionPriority ?? 0) ||
            a.localeCompare(b));
}

function groupRegions(root) {
    const owners = new Map(), used = new Set();
    root.components.forEach((entry, index) => entry.nodes.forEach(node => {
        if (!owners.has(node)) owners.set(node, []);
        owners.get(node).push(index);
    }));
    return root.groups.map((group, groupIndex) => {
        const indices = group.components;
        if (!Array.isArray(indices) || !indices.length || indices.some(index =>
            !Number.isInteger(index) || index < 0 || index >= root.components.length || used.has(index))) {
            groupError(`group ${groupIndex + 1} has invalid or overlapping component occurrences.`);
        }
        for (const index of indices) {
            if (used.has(index)) groupError(`group ${groupIndex + 1} repeats an occurrence.`);
            used.add(index);
        }
        const members = new Set(indices), nodes = [...new Set(indices.flatMap(index => root.components[index].nodes))];
        const boundaries = nodes.filter(node => root.externalNodes.includes(node) ||
            owners.get(node).some(index => !members.has(index)));
        return {indices: indices.slice(), boundaries};
    });
}

function boundaryDepths(root, regions) {
    const used = new Set(regions.flatMap(region => region.indices));
    const units = regions.map(region => region.boundaries).concat(root.components
        .filter((_, index) => !used.has(index)).map(entry => entry.nodes));
    const neighbors = new Map();
    units.forEach((nodes, index) => nodes.forEach(node => {
        if (!neighbors.has(node)) neighbors.set(node, []);
        neighbors.get(node).push(index);
    }));
    const depths = new Map([[root.externalNodes[0], 0]]), visited = new Set(), pending = [root.externalNodes[0]];
    for (let i = 0; i < pending.length; i++) {
        const node = pending[i];
        for (const unit of neighbors.get(node) || []) {
            if (visited.has(unit)) continue;
            visited.add(unit);
            for (const next of units[unit]) if (!depths.has(next)) {
                depths.set(next, depths.get(node) + 1); pending.push(next);
            }
        }
    }
    return depths;
}

function permutations(values) {
    if (!values.length) return [[]];
    return values.flatMap((value, index) => permutations(values.filter((_, i) => i !== index))
        .map(rest => [value, ...rest]));
}

function nodesValue(nodes) {
    return nodes.length === 1 ? nodes[0] : nodes;
}

function interfaceCandidates(root, region, definitions, boards, geometry, depths) {
    const candidates = [];
    for (const [name, definition] of definitions) {
        const ports = boardInterface(definition, boards);
        if (ports.from.length + ports.to.length !== region.boundaries.length) continue;
        const components = region.indices.map(index => root.components[index]);
        for (const externalNodes of permutations(region.boundaries)) {
            const from = ports.from.map(port => externalNodes[port - 1]);
            const to = ports.to.map(port => externalNodes[port - 1]);
            if (region.boundaries.includes(root.externalNodes[0]) && !from.includes(root.externalNodes[0]) ||
                root.externalNodes.slice(1).some(node => region.boundaries.includes(node) && !to.includes(node))) continue;
            if (!matchSchematicBoard({kind: 'nodal', components, externalNodes}, definition, {...geometry, boards})) continue;
            const meanFrom = from.reduce((sum, node) => sum + (depths.get(node) ?? 0), 0) / from.length;
            const meanTo = to.reduce((sum, node) => sum + (depths.get(node) ?? 0), 0) / to.length;
            candidates.push({section: {name, from: nodesValue(from), to: nodesValue(to)},
                cost: meanFrom - meanTo, priority: definition.detectionPriority ?? 0});
        }
    }
    return candidates.sort((a, b) => a.cost - b.cost || b.priority - a.priority);
}

function sectionEnds(section, side) {
    return Array.isArray(section[side]) ? section[side] : [section[side]];
}

function compatibleSections(selected, candidate) {
    for (const prior of selected) for (const side of ['from', 'to']) {
        if (sectionEnds(prior, side).some(node => sectionEnds(candidate, side).includes(node))) return false;
    }
    return true;
}

function chooseGroupInterfaces(root, regions, candidates, selected, budget) {
    if (--budget.remaining < 0) return null;
    if (selected.length === candidates.length) {
        try {
            validateSchematicSections(root, selected, regions.map(region => region.indices));
            return selected;
        } catch (error) {
            if (!(error instanceof RangeError)) throw error;
            return null;
        }
    }
    for (const candidate of candidates[selected.length]) {
        if (!compatibleSections(selected, candidate.section)) continue;
        const result = chooseGroupInterfaces(root, regions, candidates, selected.concat(candidate.section), budget);
        if (result) return result;
    }
    return null;
}

// Declared group names guide layout. Blind detection uses only membership and
// never reads those names; both derive the interfaces from electrical connections.
export function groupedSchematicShapes(root, boards, geometry, declared = false) {
    if (!root?.groups?.length) return null;
    const regions = groupRegions(root), enabled = detectionBoards(boards);
    const definitions = regions.map((_, index) => {
        if (!declared) return enabled;
        const name = root.groups[index].name;
        if (!Object.prototype.hasOwnProperty.call(boards, name)) groupError(`group ${index + 1} names unknown shape "${name}".`);
        return [[name, boards[name]]];
    });
    // A single group covering the whole network keeps its existing numbered
    // external ports and uses the ordinary single-board request.
    if (regions.length === 1 && regions[0].indices.length === root.components.length) {
        for (const [name, definition] of definitions[0]) {
            if (matchSchematicBoard(root, definition, {...geometry, boards})) return {shapes: [name]};
        }
        if (declared) groupError('the complete network does not fit its declared shape.');
        return null;
    }
    const depths = boundaryDepths(root, regions);
    const candidates = regions.map((region, index) => interfaceCandidates(root, region,
        definitions[index], boards, geometry, depths));
    const missing = candidates.findIndex(choices => !choices.length);
    if (missing >= 0) {
        if (declared) groupError(`group ${missing + 1} does not fit its declared shape or a forward interface.`);
        return null;
    }
    const shapes = chooseGroupInterfaces(root, regions, candidates, [], {remaining: 10000});
    if (!shapes && declared) groupError('could not connect the grouped sections; group all two-port rows and check their connections.');
    return shapes ? {shapes} : null;
}
