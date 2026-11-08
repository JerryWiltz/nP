// Modified: 2026-11-08
import {matchSchematicBoard} from './schematicBoardInterpreter';
import {detectionBoards, groupedSchematicShapes} from './schematicGroups';

function cascadeEntries(root, geometry) {
    const entries = [], pending = [root];
    while (pending.length) {
        const part = pending.pop();
        if (part?.kind === 'cascade') {
            pending.push(part.right, part.left);
        } else if (part && (part.kind === 'component' || part.kind === 'nodal')) {
            // An upstream nodal network is one block, never its internal parts.
            const count = part.kind === 'nodal' ? part.externalNodes.length :
                geometry.symbol({part, nodes: [0, 1]})?.ports.length;
            if (count !== 2) return null;
            entries.push({part, nodes: [entries.length, entries.length + 1]});
        } else return null;
    }
    return entries.length ? {kind: 'nodal', components: entries, externalNodes: [0, entries.length]} : null;
}

// Deliberately has no options argument: supplied shapes cannot influence detection.
// Boards opt in individually as their blind detection coverage is established.
export function detectSchematicShapes(circuit, boards, geometry) {
    const root = circuit?._schematic;
    if (!root) return null;
    if (root.kind === 'nodal' && root.groups?.length) return groupedSchematicShapes(root, boards, geometry);
    const network = root.kind === 'nodal' ? root : cascadeEntries(root, geometry);
    if (!network) return null;
    const candidates = detectionBoards(boards);
    for (const [name, definition] of candidates) {
        if (matchSchematicBoard(network, definition, {...geometry, boards})) return {shapes: [name]};
    }
    return null;
}
