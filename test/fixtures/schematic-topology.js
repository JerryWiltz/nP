// Modified: 2026-11-24
// Rendering-only topology fixtures can include multiway wire nodes or dangling
// branches. They do not construct an nPort or claim an RF/DC analysis result.
export function drawingNetwork(...rows) {
    const output = rows.at(-1);
    return {_schematic: {kind: 'nodal',
        components: rows.slice(0, -1).map(([component, ...nodes]) => ({part: component._schematic, nodes})),
        externalNodes: output.slice(1), groups: []}};
}
