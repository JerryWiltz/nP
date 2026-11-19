// Modified: 2026-11-19
// Discover related terminated branches from connectivity, never instance names.
export function schematicBranchFamilies(root, symbolFor, paths = []) {
    const adjacency = new Map(), parents = new Map();
    root.components.forEach((entry, index) => {
        if (symbolFor(entry).junction) parents.set(index, index);
        entry.nodes.forEach((node, port) => {
            if (!adjacency.has(node)) adjacency.set(node, []);
            adjacency.get(node).push({index, port: port + 1});
        });
    });
    for (const terminals of adjacency.values()) {
        const junctions = terminals.filter(end => parents.has(end.index));
        for (const end of junctions.slice(1)) joinBranches(parents, junctions[0].index, end.index);
    }
    // A bound main path supplies an engineering relationship between its shunts.
    for (const path of paths) {
        const junctions = path.filter(index => parents.has(index));
        for (const index of junctions.slice(1)) joinBranches(parents, junctions[0], index);
    }
    const families = new Map();
    root.components.forEach((entry, termination) => {
        if (entry.nodes.length !== 1) return;
        const chain = [], visited = new Set([termination]);
        let node = entry.nodes[0], prior = termination;
        while (!root.externalNodes.includes(node)) {
            const terminals = adjacency.get(node);
            if (terminals.length !== 2) break;
            const next = terminals.find(end => end.index !== prior);
            if (!next || visited.has(next.index)) break;
            if (parents.has(next.index)) {
                const anchor = branchRoot(parents, next.index);
                const key = `${anchor}:${entry.part.symbol}`;
                if (!families.has(key)) families.set(key, []);
                families.get(key).push({termination, anchor: next.index, port: next.port, chain: chain.reverse()});
                break;
            }
            const component = root.components[next.index];
            if (component.nodes.length !== 2) break;
            visited.add(next.index); chain.push(next.index);
            prior = next.index; node = component.nodes[2 - next.port];
        }
    });
    return [...families.values()].filter(family => family.length > 1);
}

function branchRoot(parents, index) {
    let root = index;
    while (parents.get(root) !== root) root = parents.get(root);
    return root;
}

function joinBranches(parents, a, b) {
    parents.set(branchRoot(parents, b), branchRoot(parents, a));
}

export function measuredBranchAlignment(families, measurements) {
    const plan = new Map();
    for (const family of families) {
        const directions = new Map();
        for (const branch of family) {
            const measured = measurements.get(branch.termination);
            if (!measured) continue;
            const key = measured.direction.join(',');
            if (!directions.has(key)) directions.set(key, []);
            directions.get(key).push({...branch, ...measured, shift: 0});
        }
        for (const branches of directions.values()) {
            if (branches.length < 2) continue;
            const direction = branches[0].direction, axis = direction[0] ? 0 : 1, sign = direction[axis];
            if (branches.every(branch => branch.chain.length === branches[0].chain.length)) {
                for (let stage = 0; stage < branches[0].chain.length; stage++) {
                    const target = Math.max(...branches.map(branch => {
                        const part = branch.result.byIndex.get(branch.chain[stage]);
                        return sign * (part.ports[0].at[axis] + part.ports[1].at[axis]) / 2 + branch.shift;
                    }));
                    for (const branch of branches) {
                        const index = branch.chain[stage], part = branch.result.byIndex.get(index);
                        const center = sign * (part.ports[0].at[axis] + part.ports[1].at[axis]) / 2;
                        branch.shift = target - center;
                        plan.set(index, {axis, sign, target});
                    }
                }
            }
            const target = Math.max(...branches.map(branch => sign *
                branch.result.byIndex.get(branch.termination).ports[0].at[axis] + branch.shift));
            for (const branch of branches) plan.set(branch.termination, {axis, sign, target});
        }
    }
    return plan;
}
