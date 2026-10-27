// Modified: 2026-10-27
import {schematicSymbols} from './schematicSymbols';

const GRID = 20;
const DEFAULT_SIGNIFICANT_DIGITS = 3;

function schematicSignificantDigits(options) {
    const digits = options.significantDigits ?? DEFAULT_SIGNIFICANT_DIGITS;
    if (!Number.isInteger(digits) || digits < 1 || digits > 15) {
        throw new TypeError('schematic() significantDigits must be an integer from 1 to 15.');
    }
    return digits;
}

function formatSchematicNumber(value, digits) {
    return typeof value === 'number' && Number.isFinite(value) ?
        String(Number(value.toPrecision(digits))) : String(value);
}

function componentLabel(part, id, digits) {
    if (part.symbol === 'coupler-180' || part.value === undefined) return id;
    const unit = part.symbol === 'resistor' ? ' Ω' : part.symbol === 'capacitor' ? ' F' :
        part.symbol === 'inductor' ? ' H' : part.symbol === 'attenuator' ||
        part.symbol === 'amplifier' ? ' dB' : '';
    return `${id} = ${formatSchematicNumber(part.value, digits)}${unit}`;
}

function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    }[character]));
}

function flattenCascade(node, parts) {
    if (!node) throw new TypeError('schematic() needs components with schematic metadata.');
    if (node.kind === 'component') {
        parts.push(node);
        return parts;
    }
    if (node.kind !== 'cascade') throw new TypeError(`schematic() cannot draw ${node.kind} yet.`);
    flattenCascade(node.left, parts);
    flattenCascade(node.right, parts);
    return parts;
}

function blockOperand(node) {
    return node.kind === 'cascade' ? {kind: 'component', symbol: 'cascade'} : node;
}

function repeatedCascades(root) {
    const counts = new Map();
    function visit(node) {
        if (node.kind !== 'cascade') return;
        counts.set(node, (counts.get(node) || 0) + 1);
        visit(node.left);
        visit(node.right);
    }
    visit(root);
    return new Set([...counts].filter(([, count]) => count > 1).map(([node]) => node));
}

function blockViewTree(node, repeated, depth) {
    if (node.kind !== 'cascade') return node;
    if (depth > 0 && (repeated.has(node) || (depth === 1 && repeated.size === 0))) {
        return blockOperand(node);
    }
    return {kind: 'cascade', left: blockViewTree(node.left, repeated, depth + 1),
        right: blockViewTree(node.right, repeated, depth + 1)};
}

function drawingRoot(root, view) {
    if (view === 'detail') return root;
    if (view !== 'blocks') throw new TypeError('schematic() view must be "detail" or "blocks".');
    if (root.kind !== 'cascade') return root;
    return blockViewTree(root, repeatedCascades(root), 0);
}

function rotateVector(vector, angle) {
    if (angle === 90) return [-vector[1], vector[0]];
    if (angle === 180) return [-vector[0], -vector[1]];
    if (angle === 270) return [vector[1], -vector[0]];
    return vector.slice();
}

function chooseSymbolOrientation(direction) {
    if (direction[0] === 1) return 0;
    if (direction[1] === 1) return 90;
    if (direction[0] === -1) return 180;
    return 270;
}

function transformedBounds(bounds, source, input, angle) {
    const corners = [[bounds[0], bounds[1]], [bounds[2], bounds[1]],
        [bounds[2], bounds[3]], [bounds[0], bounds[3]]];
    const points = corners.map(point => {
        const rotated = rotateVector([point[0] - source[0], point[1] - source[1]], angle);
        return [input[0] + rotated[0], input[1] + rotated[1]];
    });
    return [Math.min(...points.map(point => point[0])), Math.min(...points.map(point => point[1])),
        Math.max(...points.map(point => point[0])), Math.max(...points.map(point => point[1]))];
}

function transformedPoint(point, source, input, angle) {
    const rotated = rotateVector([point[0] - source[0], point[1] - source[1]], angle);
    return [input[0] + rotated[0], input[1] + rotated[1]];
}

function intersects(a, b, clearance = 0) {
    return a[0] < b[2] + clearance && a[2] > b[0] - clearance &&
        a[1] < b[3] + clearance && a[3] > b[1] - clearance;
}

function segmentBounds([start, end], thickness = 2) {
    return [Math.min(start[0], end[0]) - thickness, Math.min(start[1], end[1]) - thickness,
        Math.max(start[0], end[0]) + thickness, Math.max(start[1], end[1]) + thickness];
}

function labelBounds(text, x, y) {
    const halfWidth = Math.ceil((text.length * 9) / 2);
    return [x - halfWidth, y - 16, x + halfWidth, y + 4];
}

function circleBounds(x, y, radius = 12) {
    return [x - radius, y - radius, x + radius, y + radius];
}

function nodeGroups(layout) {
    const groups = [];
    layout.nodes.forEach((point, index) => {
        const angle = index < layout.placements.length ? layout.placements[index].angle :
            chooseSymbolOrientation([
                Math.sign(layout.end[0] - layout.placements[layout.placements.length - 1].output[0]),
                Math.sign(layout.end[1] - layout.placements[layout.placements.length - 1].output[1])
            ]);
        const axis = angle % 180 === 0 ? 'horizontal' : 'vertical';
        const baseline = axis === 'horizontal' ? point[1] : point[0];
        const previous = groups.at(-1);
        if (previous && previous.axis === axis && previous.baseline === baseline) {
            previous.nodes.push({id: index + 1, point});
        } else {
            groups.push({axis, baseline, nodes: [{id: index + 1, point}]});
        }
    });
    return groups;
}

function nodeGroupCandidates(group) {
    const candidates = [];
    for (let distance = 40; distance <= 400; distance += GRID) {
        const members = group.nodes.map(node => {
            const x = group.axis === 'horizontal' ? node.point[0] : group.baseline + distance;
            const y = group.axis === 'horizontal' ? group.baseline - distance : node.point[1];
            return {id: node.id, x, y, bounds: circleBounds(x, y)};
        });
        candidates.push({members, cost: distance * members.length});
    }
    return candidates;
}

function labelCandidates(text, bounds) {
    const centerX = Math.round((bounds[0] + bounds[2]) / (2 * GRID)) * GRID;
    const centerY = Math.round((bounds[1] + bounds[3]) / (2 * GRID)) * GRID;
    const halfWidth = Math.ceil(text.length * 9 / 2);
    const tall = bounds[3] - bounds[1] > bounds[2] - bounds[0];
    const candidates = [];
    for (let distance = GRID; distance <= 400; distance += GRID) {
        for (const offset of [0, -GRID, GRID, -2 * GRID, 2 * GRID]) {
            const horizontal = [
                [centerX + offset, bounds[1] - distance - 4],
                [centerX + offset, bounds[3] + distance + 16]
            ];
            const vertical = [
                [bounds[2] + distance + halfWidth, centerY + offset + 6],
                [bounds[0] - distance - halfWidth, centerY + offset + 6]
            ];
            const positions = tall ? vertical.concat(horizontal) : horizontal.concat(vertical);
            positions.forEach(([x, y], preference) => {
                candidates.push({x, y, bounds: labelBounds(text, x, y),
                    cost: distance + Math.abs(offset) / 2 + preference * 4});
            });
        }
    }
    return candidates;
}

function candidateBounds(candidate) {
    return candidate.members ? candidate.members.map(member => member.bounds) : [candidate.bounds];
}

function boxesClear(boxes, occupied) {
    return boxes.every((box, index) =>
        !occupied.some(other => intersects(box, other, 8)) &&
        !boxes.slice(index + 1).some(other => intersects(box, other, 8)));
}

function annotationOptions(candidates, fixedBounds) {
    return candidates.filter(candidate => boxesClear(candidateBounds(candidate), fixedBounds))
        .sort((a, b) => a.cost - b.cost)
        .slice(0, 32);
}

function chooseAnnotations(tasks, fixedBounds) {
    let states = [{cost: 0, choices: [], occupied: fixedBounds}];
    for (const task of tasks) {
        const options = annotationOptions(task.candidates, fixedBounds);
        const next = [];
        for (const state of states) {
            for (const option of options) {
                const bounds = candidateBounds(option);
                if (!boxesClear(bounds, state.occupied)) continue;
                next.push({cost: state.cost + option.cost, choices: state.choices.concat(option),
                    occupied: state.occupied.concat(bounds)});
            }
        }
        if (!next.length) throw new RangeError('schematic() could not place annotations without a collision.');
        next.sort((a, b) => a.cost - b.cost);
        states = next.slice(0, 96);
    }
    return states[0].choices;
}

function annotateLayout(layout) {
    const fixedBounds = layout.placements.flatMap(placement => placement.inkBounds)
        .concat(layout.wires.map(wire => segmentBounds(wire)));
    const labels = layout.placements.map(placement => ({
        text: placement.label, component: placement.id,
        candidates: labelCandidates(placement.label, placement.bounds)
    }));
    const externalLabels = [[0, 0], layout.end].map((point, index) => {
        const text = `Port ${index + 1}`;
        return {text, candidates: labelCandidates(text, circleBounds(...point, 4))};
    });
    const groups = nodeGroups(layout);
    const tasks = groups.map(group => ({candidates: nodeGroupCandidates(group)}))
        .concat(labels, externalLabels);
    const choices = chooseAnnotations(tasks, fixedBounds);
    const placedNodeNumbers = choices.slice(0, groups.length).flatMap(choice => choice.members)
        .sort((a, b) => a.id - b.id);
    let cursor = groups.length;
    const placedLabels = labels.map(label => ({...choices[cursor++], text: label.text, component: label.component}));
    const placedExternalLabels = externalLabels.map(label => ({...choices[cursor++], text: label.text}));
    return {...layout, nodeNumbers: placedNodeNumbers, labels: placedLabels,
        externalLabels: placedExternalLabels};
}

function layoutViewBox(layout) {
    const bounds = layout.placements.map(placement => placement.bounds)
        .concat(layout.wires.map(wire => segmentBounds(wire)))
        .concat(layout.nodeNumbers.map(number => number.bounds))
        .concat(layout.labels.map(label => label.bounds))
        .concat(layout.externalLabels.map(label => label.bounds));
    const minX = Math.floor((Math.min(...bounds.map(box => box[0])) - 40) / GRID) * GRID;
    const minY = Math.floor((Math.min(...bounds.map(box => box[1])) - 40) / GRID) * GRID;
    const maxX = Math.ceil((Math.max(...bounds.map(box => box[2])) + 40) / GRID) * GRID;
    const maxY = Math.ceil((Math.max(...bounds.map(box => box[3])) + 40) / GRID) * GRID;
    return [minX, minY, maxX - minX, maxY - minY];
}

function placeComponents(parts, digits) {
    const placements = [];
    const wires = [];
    const nodes = [[0, 0]];
    const counters = {};
    let direction = [1, 0];
    let previous = [0, 0];

    for (const part of parts) {
        const symbol = schematicSymbols[part.symbol];
        if (!symbol) throw new TypeError(`schematic() has no bundled symbol for ${part.symbol}.`);
        const angle = (chooseSymbolOrientation(direction) -
            chooseSymbolOrientation(symbol.entry || [1, 0]) + 360) % 360;
        let input;
        let bounds;
        let bodyBounds;
        for (let gap = placements.length ? 0 : 60; gap <= 1000; gap += GRID) {
            const candidate = [previous[0] + direction[0] * gap,
                previous[1] + direction[1] * gap];
            const candidateBody = transformedBounds(symbol.bodyBounds, symbol.ports[0], candidate, angle);
            const collidesWithBody = placements.some(placed => intersects(candidateBody, placed.bodyBounds, 8));
            const collidesWithWire = wires.some(wire => intersects(candidateBody, segmentBounds(wire), 4));
            const connector = [previous, candidate];
            const blocksConnector = gap > 0 && placements.slice(0, -1).some(placed =>
                intersects(segmentBounds(connector), placed.bodyBounds, 4));
            if (!collidesWithBody && !collidesWithWire && !blocksConnector) {
                input = candidate;
                bodyBounds = candidateBody;
                bounds = transformedBounds(symbol.bounds, symbol.ports[0], candidate, angle);
                break;
            }
        }
        if (!input) throw new RangeError('schematic() could not place a component without a collision.');
        if (input[0] !== previous[0] || input[1] !== previous[1]) wires.push([previous, input]);
        if (placements.length) nodes.push(input);
        const delta = rotateVector([
            symbol.ports[1][0] - symbol.ports[0][0],
            symbol.ports[1][1] - symbol.ports[0][1]
        ], angle);
        const output = [input[0] + delta[0], input[1] + delta[1]];
        const prefix = ({resistor: 'R', capacitor: 'C', inductor: 'L', cascade: 'CAS',
            'microstrip-right-bend': 'MB', 'microstrip-left-bend': 'MB',
            'transmission-line': 'TLIN', 'microstrip-line': 'MLIN', attenuator: 'ATT',
            amplifier: 'AMP', thru: 'THRU', 'microstrip-step': 'MSTEP',
            'microstrip-via-transition': 'MVIA', 'microstrip-thin-film-resistor': 'MTFR',
            'diode-1n4148': 'D', mod: 'MOD', demod: 'DEMOD'}[part.symbol] ||
            part.symbol.toUpperCase().replace(/[^A-Z]/g, ''));
        const id = `${prefix}${counters[prefix] = (counters[prefix] || 0) + 1}`;
        const label = componentLabel(part, id, digits);
        const inkBounds = [bodyBounds].concat(symbol.leads.map(lead => segmentBounds(
            lead.map(point => transformedPoint(point, symbol.ports[0], input, angle)), 4)));
        placements.push({part, symbol, input, output, angle, id, label, bounds, bodyBounds, inkBounds});
        previous = output;
        direction = rotateVector(symbol.exit, angle);
    }

    const end = [previous[0] + direction[0] * 60, previous[1] + direction[1] * 60];
    wires.push([previous, end]);
    nodes.push(end);
    return {placements, wires, nodes, end};
}

function renderSymbol(placement) {
    const {symbol, input, angle} = placement;
    const source = symbol.ports[0];
    const transform = `translate(${input[0]} ${input[1]}) rotate(${angle}) translate(${-source[0]} ${-source[1]})`;
    return `<g transform="${transform}" fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbol.geometry}<circle cx="${source[0]}" cy="${source[1]}" r="4" fill="#202020"/><circle cx="${symbol.ports[1][0]}" cy="${symbol.ports[1][1]}" r="4" fill="#202020"/></g>`;
}

function renderNodes(layout) {
    return layout.nodes.map((node, index) => {
        const number = layout.nodeNumbers[index];
        return `<circle cx="${node[0]}" cy="${node[1]}" r="4" fill="#202020"/><circle cx="${number.x}" cy="${number.y}" r="12" fill="#ffffff" stroke="#202020" stroke-width="2"/><text x="${number.x}" y="${number.y + 5}" text-anchor="middle">${number.id}</text>`;
    }).join('');
}

function constructionTree(node, placements, cursor) {
    if (node.kind === 'component') return {kind: 'component', id: placements[cursor.index++].id};
    return {
        kind: 'cascade',
        left: constructionTree(node.left, placements, cursor),
        right: constructionTree(node.right, placements, cursor)
    };
}

function buildSchematicGraph(root, layout, viewBox) {
    const components = layout.placements.map((placement, index) => ({
        id: placement.id,
        symbol: placement.part.symbol,
        value: placement.part.value ?? null,
        rotation: placement.angle,
        bounds: placement.bounds.slice(),
        bodyBounds: placement.bodyBounds.slice(),
        inkBounds: placement.inkBounds.map(bounds => bounds.slice()),
        ports: [
            {port: 1, node: index + 1, at: placement.input.slice()},
            {port: 2, node: index + 2, at: placement.output.slice()}
        ]
    }));
    const connections = components.slice(1).map((component, index) => ({
        node: index + 2,
        from: {component: components[index].id, port: 2},
        to: {component: component.id, port: 1}
    }));
    return {
        kind: 'rf-cascade',
        viewBox,
        components,
        nodes: layout.nodes.map((point, index) => ({id: index + 1, at: point.slice()})),
        nodeNumbers: layout.nodeNumbers.map(number => ({id: number.id, at: [number.x, number.y], bounds: number.bounds.slice()})),
        labels: layout.labels.concat(layout.externalLabels).map(label => ({text: label.text, at: [label.x, label.y], bounds: label.bounds.slice()})),
        connections,
        externalPorts: [
            {port: 1, node: 1, at: [0, 0]},
            {port: 2, node: layout.nodes.length, at: layout.end.slice()}
        ],
        wires: layout.wires.map((wire, index) => ({
            node: index === 0 ? 1 : index === layout.wires.length - 1 ? layout.nodes.length :
                layout.nodes.findIndex(point => point[0] === wire[1][0] && point[1] === wire[1][1]) + 1,
            from: wire[0].slice(),
            to: wire[1].slice()
        })),
        construction: constructionTree(root, layout.placements, {index: 0})
    };
}

function buildSchematicTopology(graph) {
    const parts = graph.components.map(component => ({id: component.id,
        type: component.symbol, value: component.value}));
    const connections = [[`Port ${graph.externalPorts[0].port}`, `${parts[0].id}.1`]];
    for (const connection of graph.connections) {
        connections.push([
            `${connection.from.component}.${connection.from.port}`,
            `${connection.to.component}.${connection.to.port}`
        ]);
    }
    connections.push([`${parts[parts.length - 1].id}.2`, `Port ${graph.externalPorts[1].port}`]);
    return {parts, connections};
}

function wilkinsonRoles(root) {
    const entries = root.components;
    const tees = entries.filter(entry => entry.part?.symbol === 'tee');
    const lines = entries.filter(entry => entry.part?.symbol === 'transmission-line');
    const resistors = entries.filter(entry => entry.part?.symbol === 'resistor');
    if (entries.length !== 6 || root.externalNodes.length !== 3 ||
        tees.length !== 3 || lines.length !== 2 || resistors.length !== 1) return null;
    const input = tees.find(entry => entry.nodes[0] === root.externalNodes[0]);
    if (!input) return null;
    const branch1 = lines.find(entry => entry.nodes[0] === input.nodes[1]);
    const branch2 = lines.find(entry => entry.nodes[0] === input.nodes[2]);
    if (!branch1 || !branch2 || branch1 === branch2) return null;
    const output1 = tees.find(entry => entry !== input &&
        entry.nodes[1] === branch1.nodes[1] && entry.nodes[2] === root.externalNodes[1]);
    const output2 = tees.find(entry => entry !== input &&
        entry.nodes[1] === branch2.nodes[1] && entry.nodes[2] === root.externalNodes[2]);
    const isolation = resistors[0];
    if (!output1 || !output2 || output1 === output2 ||
        isolation.nodes[0] !== output1.nodes[0] || isolation.nodes[1] !== output2.nodes[0]) return null;
    return {input, branch1, branch2, output1, output2, isolation};
}

function nodalPlacement(id, entry, sourcePort, at, angle = 0, mirrorY = false) {
    const symbol = schematicSymbols[entry.part.symbol];
    const source = symbol.ports[sourcePort - 1];
    const reflect = point => mirrorY ? [point[0], 200 - point[1]] : point;
    const transformed = point => transformedPoint(reflect(point), reflect(source), at, angle);
    return {
        id, symbol: entry.part.symbol, part: entry.part, rotation: angle, mirrorY,
        ports: symbol.ports.map((point, index) => ({port: index + 1, node: entry.nodes[index], at: transformed(point)})),
        at: at.slice(), sourcePort
    };
}

function nodalPath(node, points) {
    return {node, points};
}

function flowPairs(symbol) {
    if (symbol === 'tee' || symbol === 'microstrip-tee') return [[2, 3], [3, 2]];
    if (symbol === 'series-tee') return [[1, 2], [2, 1]];
    return schematicSymbols[symbol]?.ports.length === 2 ? [[1, 2], [2, 1]] : [];
}

function findFlowPath(root) {
    const start = root.externalNodes[0];
    const finish = root.externalNodes[1];
    function visit(node, used, path) {
        if (node === finish && path.length) return path;
        for (let index = 0; index < root.components.length; index++) {
            if (used.has(index)) continue;
            const entry = root.components[index];
            for (const [inputPort, outputPort] of flowPairs(entry.part.symbol)) {
                if (entry.nodes[inputPort - 1] !== node) continue;
                const next = visit(entry.nodes[outputPort - 1],
                    new Set([...used, index]), path.concat({index, inputPort, outputPort}));
                if (next) return next;
            }
        }
        return null;
    }
    return visit(start, new Set(), []);
}

function flowPartId(part, counters) {
    const prefix = ({resistor: 'R', capacitor: 'C', inductor: 'L', tee: 'TEE',
        'series-tee': 'STEE', short: 'SHORT', open: 'OPEN',
        'transmission-line': 'TLIN', amplifier: 'AMP', attenuator: 'ATT',
        'microstrip-tee': 'MTEE'}[part.symbol] || part.symbol.toUpperCase().replace(/[^A-Z]/g, ''));
    counters[prefix] = (counters[prefix] || 0) + 1;
    return `${prefix}${counters[prefix]}`;
}

function flowTopology(root, placements, externalPorts) {
    const nodeIds = [...new Set(root.components.flatMap(entry => entry.nodes).concat(root.externalNodes))];
    return {
        parts: placements.map(placement => ({id: placement.id, type: placement.symbol,
            nodes: placement.ports.map(port => port.node), value: placement.part.value ?? null,
            impedance: placement.part.impedance ?? null, length: placement.part.length ?? null})),
        connections: nodeIds.map(node => ({node,
            ports: placements.flatMap(placement => placement.ports.filter(port => port.node === node)
                .map(port => `${placement.id}.${port.port}`)),
            externalPorts: externalPorts.filter(port => port.node === node).map(port => port.port)}))
    };
}

function buildFlowNodalModel(root, digits) {
    if (root.externalNodes.length !== 2) return null;
    const path = findFlowPath(root);
    if (!path) return null;
    const entries = root.components;
    const used = new Set(path.map(step => step.index));
    const counters = {};
    const placements = [];
    const wires = [];
    const nodePositions = new Map();
    const labels = [];
    const mainPorts = [];
    let cursorX = 120;

    for (const step of path) {
        const entry = entries[step.index];
        const angle = step.inputPort < step.outputPort ? 0 : 180;
        const placement = nodalPlacement(flowPartId(entry.part, counters), entry,
            step.inputPort, [cursorX, 100], angle);
        const output = placement.ports[step.outputPort - 1].at;
        if (output[0] <= cursorX || output[1] !== 100) return null;
        placements.push(placement);
        mainPorts.push({step, placement});
        labels.push({text: componentLabel(placement.part, placement.id, digits),
            at: [(cursorX + output[0]) / 2, 10]});
        cursorX = output[0] + 80;
    }

    const inputPoint = [40, 100];
    const outputPoint = [cursorX, 100];
    const externalPorts = [
        {port: 1, node: root.externalNodes[0], at: inputPoint},
        {port: 2, node: root.externalNodes[1], at: outputPoint}
    ];
    let previous = inputPoint;
    for (const {step, placement} of mainPorts) {
        const input = placement.ports[step.inputPort - 1];
        wires.push(nodalPath(input.node, [previous, input.at]));
        nodePositions.set(input.node, {at: [(previous[0] + input.at[0]) / 2, 100],
            numberAt: [(previous[0] + input.at[0]) / 2, 60]});
        previous = placement.ports[step.outputPort - 1].at;
    }
    wires.push(nodalPath(root.externalNodes[1], [previous, outputPoint]));
    nodePositions.set(root.externalNodes[1], {at: [(previous[0] + outputPoint[0]) / 2, 100],
        numberAt: [(previous[0] + outputPoint[0]) / 2, 60]});

    let lowestY = 100;
    for (const {step, placement} of mainPorts) {
        const otherPorts = placement.ports.filter(port =>
            port.port !== step.inputPort && port.port !== step.outputPort);
        for (const branchPort of otherPorts) {
            if (root.externalNodes.includes(branchPort.node)) return null;
            let current = branchPort;
            let branchY = branchPort.at[1] + 80;
            const branchX = branchPort.at[0];
            while (true) {
                const matches = entries.map((entry, index) => ({entry, index}))
                    .filter(item => !used.has(item.index) && item.entry.nodes.includes(current.node));
                if (matches.length !== 1) return null;
                const {entry, index} = matches[0];
                if (entry.nodes.length > 2) return null;
                const sourcePort = entry.nodes.indexOf(current.node) + 1;
                const angle = sourcePort === 1 ? 90 : 270;
                const child = nodalPlacement(flowPartId(entry.part, counters), entry,
                    sourcePort, [branchX, branchY], angle);
                const childInput = child.ports[sourcePort - 1];
                if (childInput.at[0] !== current.at[0] || childInput.at[1] <= current.at[1]) return null;
                placements.push(child);
                used.add(index);
                wires.push(nodalPath(current.node, [current.at, childInput.at]));
                nodePositions.set(current.node, {at: [branchX, (current.at[1] + childInput.at[1]) / 2],
                    numberAt: [branchX + 40, (current.at[1] + childInput.at[1]) / 2]});
                labels.push({text: componentLabel(child.part, child.id, digits),
                    at: [branchX + 110, branchY + 10]});
                lowestY = Math.max(lowestY, branchY + 100);
                if (entry.nodes.length === 1) break;
                const outputPort = sourcePort === 1 ? 2 : 1;
                current = child.ports[outputPort - 1];
                branchY = current.at[1] + 80;
            }
        }
    }
    if (used.size !== entries.length) return null;
    const nodes = [...nodePositions].map(([id, position]) => ({id, ...position}));
    labels.push({text: 'Port 1', at: [40, 160]},
        {text: 'Port 2', at: [outputPoint[0], 160]});
    const graph = {kind: 'rf-nodal', viewBox: [0, -80, outputPoint[0] + 100,
        Math.max(340, lowestY + 200)], components: placements, nodes, wires, labels, externalPorts};
    return {graph, topology: flowTopology(root, placements, externalPorts)};
}

function nodalTree(root) {
    const entries = root.components;
    const byNode = new Map();
    entries.forEach((entry, index) => entry.nodes.forEach((node, port) => {
        if (!byNode.has(node)) byNode.set(node, []);
        byNode.get(node).push({index, port: port + 1});
    }));
    const links = entries.map(() => []);
    for (const [node, ends] of byNode) {
        if (ends.length > 2) return null;
        if (ends.length === 2) {
            const [left, right] = ends;
            if (left.index === right.index) return null;
            links[left.index].push({index: right.index, ownPort: left.port,
                otherPort: right.port, node});
            links[right.index].push({index: left.index, ownPort: right.port,
                otherPort: left.port, node});
        }
    }
    const sources = byNode.get(root.externalNodes[0]) || [];
    const source = sources.find(end => entries[end.index].nodes.length > 1) || sources[0];
    if (!source) return null;
    const parent = new Map([[source.index, null]]);
    const depth = new Map([[source.index, 0]]);
    const stack = [source.index];
    while (stack.length) {
        const index = stack.pop();
        for (const link of links[index]) {
            if (parent.get(index)?.index === link.index) continue;
            if (parent.has(link.index)) return null;
            parent.set(link.index, {index, ownPort: link.otherPort,
                parentPort: link.ownPort, node: link.node});
            depth.set(link.index, depth.get(index) + 1);
            stack.push(link.index);
        }
    }
    if (parent.size !== entries.length) return null;
    const candidates = [...parent.keys()].filter(index => entries[index].nodes.length > 1);
    const end = candidates.sort((a, b) => depth.get(b) - depth.get(a))[0] ?? source.index;
    const spine = [];
    for (let index = end; index !== undefined; index = parent.get(index)?.index) spine.unshift(index);
    return {links, parent, source, spine, byNode};
}

function spineAngle(symbol, inputPort, outputPort) {
    const input = symbol.ports[inputPort - 1];
    if (!outputPort) {
        const center = [(symbol.bodyBounds[0] + symbol.bodyBounds[2]) / 2,
            (symbol.bodyBounds[1] + symbol.bodyBounds[3]) / 2];
        return [0, 90, 180, 270].sort((left, right) =>
            rotateVector([input[0] - center[0], input[1] - center[1]], left)[0] -
            rotateVector([input[0] - center[0], input[1] - center[1]], right)[0])[0];
    }
    const output = symbol.ports[outputPort - 1];
    const dx = output[0] - input[0];
    const dy = output[1] - input[1];
    if (!dx && !dy) return null;
    if (dx && dy) {
        const center = [(symbol.bodyBounds[0] + symbol.bodyBounds[2]) / 2,
            (symbol.bodyBounds[1] + symbol.bodyBounds[3]) / 2];
        const candidates = [0, 90, 180, 270].map(angle => ({angle,
            advance: rotateVector([dx, dy], angle),
            inputOutward: rotateVector([input[0] - center[0], input[1] - center[1]], angle)}));
        const suitable = candidates.filter(candidate => candidate.advance[0] > 0);
        suitable.sort((a, b) => a.inputOutward[0] - b.inputOutward[0]);
        return suitable[0]?.angle ?? null;
    }
    return (360 - chooseSymbolOrientation([Math.sign(dx), Math.sign(dy)])) % 360;
}

function routeBetween(start, end, verticalFirst = false) {
    if (start[0] === end[0] || start[1] === end[1]) return [start, end];
    return verticalFirst ? [start, [start[0], end[1]], end] :
        [start, [end[0], start[1]], end];
}

function wireNodePoint(points) {
    const segments = points.slice(1).map((point, index) => [points[index], point]);
    segments.sort((left, right) =>
        (Math.abs(right[1][0] - right[0][0]) + Math.abs(right[1][1] - right[0][1])) -
        (Math.abs(left[1][0] - left[0][0]) + Math.abs(left[1][1] - left[0][1])));
    const [start, end] = segments[0];
    return [0, 1].map(axis => Math.round((start[axis] + end[axis]) / (2 * GRID)) * GRID);
}

function treeLayoutBounds(placement) {
    const symbol = schematicSymbols[placement.symbol];
    return transformedBounds(symbol.bodyBounds, symbol.ports[placement.sourcePort - 1],
        placement.at, placement.rotation);
}

function outwardPortDirection(placement, portNumber) {
    const [left, top, right, bottom] = treeLayoutBounds(placement);
    const [x, y] = placement.ports[portNumber - 1].at;
    const distances = [
        {distance: Math.max(0, left - x), vector: [-1, 0]},
        {distance: Math.max(0, x - right), vector: [1, 0]},
        {distance: Math.max(0, top - y), vector: [0, -1]},
        {distance: Math.max(0, y - bottom), vector: [0, 1]}
    ];
    distances.sort((a, b) => b.distance - a.distance);
    return distances[0].vector;
}

function treeNodeCandidates(point) {
    const offsets = [[0, -40], [0, 40], [40, 0], [-40, 0],
        [0, -60], [0, 60], [60, 0], [-60, 0]];
    return offsets.map(([dx, dy], index) => ({x: point[0] + dx, y: point[1] + dy,
        bounds: circleBounds(point[0] + dx, point[1] + dy), cost: 40 + index * 4}));
}

function buildTreeNodalModel(root, digits) {
    const tree = nodalTree(root);
    if (!tree) return null;
    const entries = root.components;
    const placements = [];
    const placed = new Map();
    const counters = {};
    const spine = tree.spine;
    let cursorX = 140;

    for (let position = 0; position < spine.length; position++) {
        const index = spine[position];
        const entry = entries[index];
        const inputPort = position ? tree.parent.get(index).ownPort : tree.source.port;
        const next = spine[position + 1];
        const outgoing = next === undefined ? null :
            tree.links[index].find(link => link.index === next);
        const symbol = schematicSymbols[entry.part.symbol];
        const angle = spineAngle(symbol, inputPort, outgoing?.ownPort);
        if (angle === null) return null;
        const placement = nodalPlacement(flowPartId(entry.part, counters), entry,
            inputPort, [cursorX, 100], angle);
        placements.push(placement);
        placed.set(index, placement);
        cursorX = outgoing ? placement.ports[outgoing.ownPort - 1].at[0] + 160 :
            Math.max(...placement.ports.map(port => port.at[0])) + 100;
    }

    const spineSet = new Set(spine);
    const branchQueue = spine.slice();
    while (branchQueue.length) {
        const index = branchQueue.shift();
        const parent = placed.get(index);
        const centerY = (treeLayoutBounds(parent)[1] + treeLayoutBounds(parent)[3]) / 2;
        for (const link of tree.links[index]) {
            if (placed.has(link.index) || tree.parent.get(link.index)?.index !== index) continue;
            const port = parent.ports[link.ownPort - 1];
            const direction = port.at[1] < centerY ? -1 : 1;
            const child = nodalPlacement(flowPartId(entries[link.index].part, counters),
                entries[link.index], link.otherPort,
                [port.at[0], port.at[1] + direction * 160], direction > 0 ? 90 : 270);
            placements.push(child);
            placed.set(link.index, child);
            branchQueue.push(link.index);
        }
    }
    if (placed.size !== entries.length) return null;

    const wires = [];
    const wireOwners = [];
    const nodePoints = new Map();
    for (const [index, relation] of tree.parent) {
        if (!relation) continue;
        const start = placed.get(relation.index).ports[relation.parentPort - 1].at;
        const end = placed.get(index).ports[relation.ownPort - 1].at;
        const verticalFirst = !spineSet.has(index);
        const route = routeBetween(start, end, verticalFirst);
        wires.push(nodalPath(relation.node, route));
        wireOwners.push(new Set([index, relation.index]));
        nodePoints.set(relation.node, wireNodePoint(route));
    }

    const externalPorts = root.externalNodes.map((node, index) => {
        const end = tree.byNode.get(node)?.[0];
        if (!end) return null;
        const placement = placed.get(end.index);
        const port = placement.ports[end.port - 1].at;
        const direction = outwardPortDirection(placement, end.port);
        const point = [port[0] + direction[0] * 100,
            port[1] + direction[1] * 100];
        const route = routeBetween(port, point, true);
        wires.push(nodalPath(node, route));
        wireOwners.push(new Set([end.index]));
        nodePoints.set(node, wireNodePoint(route));
        return {port: index + 1, node, at: point};
    });
    if (externalPorts.includes(null)) return null;

    const bodyBounds = new Map([...placed].map(([index, placement]) =>
        [index, treeLayoutBounds(placement)]));
    const bodyEntries = [...bodyBounds];
    if (bodyEntries.some(([index, bounds], position) => bodyEntries.slice(position + 1)
        .some(([other, otherBounds]) => index !== other && intersects(bounds, otherBounds, 8)))) {
        return null;
    }
    if (wires.some((wire, wireIndex) => wire.points.slice(1).some((point, segmentIndex) =>
        bodyEntries.some(([index, bounds]) => !wireOwners[wireIndex].has(index) &&
            intersects(bounds, segmentBounds([wire.points[segmentIndex], point]), 4))))) {
        return null;
    }

    const nodeIds = [...tree.byNode.keys()];
    const fixedBounds = placements.map(treeLayoutBounds)
        .concat(wires.flatMap(wire => wire.points.slice(1).map((point, index) =>
            segmentBounds([wire.points[index], point], 4))));
    const nodeTasks = nodeIds.map(node => ({candidates: treeNodeCandidates(
        nodePoints.get(node) || placed.get(tree.byNode.get(node)[0].index)
            .ports[tree.byNode.get(node)[0].port - 1].at)}));
    const labelTasks = placements.map(placement => {
        const label = componentLabel(placement.part, placement.id, digits);
        return {text: label, candidates: labelCandidates(label, treeLayoutBounds(placement))};
    });
    const portTasks = externalPorts.map(port => ({text: `Port ${port.port}`,
        candidates: labelCandidates(`Port ${port.port}`, circleBounds(...port.at, 4))}));
    const choices = chooseAnnotations(nodeTasks.concat(labelTasks, portTasks), fixedBounds);
    const nodes = nodeIds.map((node, index) => ({id: node,
        at: nodePoints.get(node) || placed.get(tree.byNode.get(node)[0].index)
            .ports[tree.byNode.get(node)[0].port - 1].at,
        numberAt: [choices[index].x, choices[index].y]}));
    const labels = labelTasks.concat(portTasks).map((task, index) => ({
        text: task.text, at: [choices[nodeIds.length + index].x,
            choices[nodeIds.length + index].y]}));
    const occupied = fixedBounds.concat(choices.map(choice => choice.bounds));
    const minX = Math.floor((Math.min(...occupied.map(box => box[0])) - 40) / GRID) * GRID;
    const minY = Math.floor((Math.min(...occupied.map(box => box[1])) - 40) / GRID) * GRID;
    const maxX = Math.ceil((Math.max(...occupied.map(box => box[2])) + 40) / GRID) * GRID;
    const maxY = Math.ceil((Math.max(...occupied.map(box => box[3])) + 40) / GRID) * GRID;
    const graph = {kind: 'rf-nodal', viewBox: [minX, minY, maxX - minX, maxY - minY],
        components: placements, nodes, wires, labels, externalPorts};
    return {graph, topology: flowTopology(root, placements, externalPorts)};
}

function buildNodalModel(root, options, digits) {
    if (options.view && options.view !== 'detail') {
        throw new TypeError('schematic() nodal circuits currently support only the detail view.');
    }
    const roles = wilkinsonRoles(root);
    if (!roles) {
        const model = buildFlowNodalModel(root, digits) || buildTreeNodalModel(root, digits);
        if (model) return model;
        throw new RangeError('schematic() cannot make a readable layout for this nodal circuit yet.');
    }
    const placements = [
        nodalPlacement('TEE1', roles.input, 1, [0, 0], 90),
        nodalPlacement('TLIN1', roles.branch1, 1, [180, -160]),
        nodalPlacement('TLIN2', roles.branch2, 1, [180, 160]),
        nodalPlacement('TEE2', roles.output1, 2, [440, -160]),
        nodalPlacement('TEE3', roles.output2, 2, [440, 160], 0, true),
        nodalPlacement('R1', roles.isolation, 1, [480, -40], 90)
    ];
    const n = {
        input: roles.input.nodes, branch1: roles.branch1.nodes, branch2: roles.branch2.nodes,
        output1: roles.output1.nodes, output2: roles.output2.nodes
    };
    const wires = [
        nodalPath(n.input[0], [[-100, 0], [0, 0]]),
        nodalPath(n.input[1], [[40, -40], [120, -40], [120, -160], [180, -160]]),
        nodalPath(n.input[2], [[40, 40], [120, 40], [120, 160], [180, 160]]),
        nodalPath(n.branch1[1], [[300, -160], [440, -160]]),
        nodalPath(n.branch2[1], [[300, 160], [440, 160]]),
        nodalPath(n.output1[0], [[480, -120], [480, -40]]),
        nodalPath(n.output2[0], [[480, 60], [480, 120]]),
        nodalPath(n.output1[2], [[520, -160], [620, -160]]),
        nodalPath(n.output2[2], [[520, 160], [620, 160]])
    ];
    const nodePoints = [
        [n.input[0], [-100, 0], [-100, -40]],
        [n.input[1], [120, -160], [120, -200]],
        [n.input[2], [120, 160], [120, 200]],
        [n.branch1[1], [370, -160], [370, -200]],
        [n.branch2[1], [370, 160], [370, 200]],
        [n.output1[0], [480, -100], [540, -100]],
        [n.output1[2], [620, -160], [620, -200]],
        [n.output2[0], [480, 100], [540, 100]],
        [n.output2[2], [620, 160], [620, 200]]
    ];
    const labels = [
        {text: 'TEE1', at: [20, -100]},
        {text: `TLIN1 = ${formatSchematicNumber(roles.branch1.part.impedance, digits)} Ω`, at: [240, -240]},
        {text: `TLIN2 = ${formatSchematicNumber(roles.branch2.part.impedance, digits)} Ω`, at: [240, 240]},
        {text: 'TEE2', at: [480, -240]},
        {text: 'TEE3', at: [480, 240]},
        {text: componentLabel(roles.isolation.part, 'R1', digits), at: [600, 0]},
        {text: 'Port 1', at: [-100, 60]},
        {text: 'Port 2', at: [700, -160]},
        {text: 'Port 3', at: [700, 160]}
    ];
    const nodes = nodePoints.map(([id, at, numberAt]) => ({id, at, numberAt}));
    const graph = {
        kind: 'rf-nodal', viewBox: [-180, -300, 960, 600], components: placements,
        nodes, wires, labels,
        externalPorts: root.externalNodes.map((node, index) => ({
            port: index + 1, node, at: index === 0 ? [-100, 0] : [620, index === 1 ? -160 : 160]
        }))
    };
    const topology = {
        parts: placements.map(placement => ({id: placement.id, type: placement.symbol,
            nodes: placement.ports.map(port => port.node), value: placement.part.value ?? null,
            impedance: placement.part.impedance ?? null, length: placement.part.length ?? null})),
        connections: nodes.map(node => ({node: node.id,
            ports: placements.flatMap(placement => placement.ports.filter(port => port.node === node.id)
                .map(port => `${placement.id}.${port.port}`)),
            externalPorts: graph.externalPorts.filter(port => port.node === node.id).map(port => port.port)}))
    };
    return {graph, topology};
}

function buildSignalFlowModel(path, options, digits) {
    const {transmitter, circuit, receiver} = path;
    if (!transmitter || typeof transmitter.mode !== 'string' ||
        !circuit?._schematic || receiver !== undefined && typeof receiver.out !== 'function') {
        throw new TypeError('schematic() signal path needs a transmitter, circuit, and optional receiver.');
    }
    if (circuit.signal?.mode && circuit.signal.mode !== transmitter.mode) {
        throw new TypeError('schematic() transmitter mode does not match the circuit signal.');
    }
    const rfRoot = drawingRoot(circuit._schematic, options.view || 'detail');
    if (rfRoot.kind === 'nodal') {
        throw new TypeError('schematic() signal path needs a two-port cascade circuit.');
    }
    const parts = [{kind: 'component', symbol: 'mod', value: transmitter.mode}]
        .concat(flattenCascade(rfRoot, []));
    if (receiver) parts.push({kind: 'component', symbol: 'demod', value: transmitter.mode});
    const construction = parts.slice(1).reduce((left, right) =>
        ({kind: 'cascade', left, right}), parts[0]);
    const layout = annotateLayout(placeComponents(parts, digits));
    const graph = buildSchematicGraph(construction, layout, layoutViewBox(layout));
    graph.kind = 'signal-flow';
    return {layout, graph, topology: buildSchematicTopology(graph)};
}

function buildSchematicModel(circuit, options = {}) {
    const digits = schematicSignificantDigits(options);
    if (circuit?.transmitter && circuit.circuit) {
        return buildSignalFlowModel(circuit, options, digits);
    }
    const root = circuit && circuit._schematic;
    if (!root) throw new TypeError('schematic() needs components with schematic metadata.');
    if (root.kind === 'nodal') return buildNodalModel(root, options, digits);
    if (root.kind === 'component' && schematicSymbols[root.symbol]?.ports.length !== 2) {
        const portCount = schematicSymbols[root.symbol].ports.length;
        const nodes = Array.from({length: portCount}, (_, index) => index + 1);
        return buildNodalModel({kind: 'nodal', components: [{part: root, nodes}],
            externalNodes: nodes}, options, digits);
    }
    const shownRoot = drawingRoot(root, options.view || 'detail');
    const parts = flattenCascade(shownRoot, []);
    const layout = annotateLayout(placeComponents(parts, digits));
    const graph = buildSchematicGraph(shownRoot, layout, layoutViewBox(layout));
    return {layout, graph, topology: buildSchematicTopology(graph)};
}

function renderNodalSvg(model) {
    const graph = model.graph;
    const [minX, minY, width, height] = graph.viewBox;
    const wires = graph.wires.map(wire => `<path d="${wire.points.map((point, index) =>
        `${index ? 'L' : 'M'}${point[0]} ${point[1]}`).join(' ')}"/>`).join('');
    const junctions = graph.wires.filter(wire => wire.points.length > 2).map(wire => {
        const point = wire.points[wire.points.length - 1];
        return `<circle cx="${point[0]}" cy="${point[1]}" r="4" fill="#202020"/>`;
    }).join('');
    const terminals = graph.externalPorts.map(port =>
        `<circle cx="${port.at[0]}" cy="${port.at[1]}" r="4" fill="#202020"/>`).join('');
    const symbols = graph.components.map(placement => {
        const symbol = schematicSymbols[placement.symbol];
        const source = symbol.ports[placement.sourcePort - 1];
        const transform = `translate(${placement.at[0]} ${placement.at[1]}) rotate(${placement.rotation}) ` +
            (placement.mirrorY ? `translate(${-source[0]} ${source[1] - 200}) translate(0 200) scale(1 -1)` :
                `translate(${-source[0]} ${-source[1]})`);
        const dots = symbol.ports.map(point => `<circle cx="${point[0]}" cy="${point[1]}" r="4" fill="#202020"/>`).join('');
        return `<g transform="${transform}" fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbol.geometry}${dots}</g>`;
    }).join('');
    const nodes = graph.nodes.map(node => `<circle cx="${node.at[0]}" cy="${node.at[1]}" r="4" fill="#202020"/>` +
        `<circle cx="${node.numberAt[0]}" cy="${node.numberAt[1]}" r="12" fill="#ffffff" stroke="#202020" stroke-width="2"/>` +
        `<text x="${node.numberAt[0]}" y="${node.numberAt[1] + 5}" text-anchor="middle">${escapeXml(node.id)}</text>`).join('');
    const labels = graph.labels.map(label => `<text x="${label.at[0]}" y="${label.at[1]}" text-anchor="middle">${escapeXml(label.text)}</text>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" role="img" aria-label="Nodal nPort schematic"><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/><g fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${wires}</g><g fill="#202020" font-family="Arial, Helvetica, sans-serif" font-size="16">${symbols}${junctions}${terminals}${nodes}${labels}</g></svg>`;
}

function renderSchematicSvg(model) {
    if (model.graph.kind === 'rf-nodal') return renderNodalSvg(model);
    const {layout} = model;
    const [minX, minY, width, height] = model.graph.viewBox;
    const wires = layout.wires.map(([start, end]) =>
        `<path d="M${start[0]} ${start[1]} L${end[0]} ${end[1]}"/>`).join('');
    const symbols = layout.placements.map(renderSymbol).join('');
    const labels = layout.labels.concat(layout.externalLabels).map(label =>
        `<text x="${label.x}" y="${label.y}" text-anchor="middle">${escapeXml(label.text)}</text>`).join('');
    const description = model.graph.kind === 'signal-flow' ? 'Signal path schematic' :
        'Cascaded nPort schematic';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" role="img" aria-label="${description}"><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/><g fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${wires}</g><g fill="#202020" font-family="Arial, Helvetica, sans-serif" font-size="16">${symbols}${renderNodes(layout)}${labels}</g></svg>`;
}

export function schematicGraph(circuit, options = {}) {
    return buildSchematicModel(circuit, options).graph;
}

export function schematicTopology(circuit, options = {}) {
    return buildSchematicModel(circuit, options).topology;
}

export function schematicSvg(circuit, options = {}) {
    return renderSchematicSvg(buildSchematicModel(circuit, options));
}

function schematicPngBlob(svg) {
    const source = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([source], {type: 'image/svg+xml;charset=utf-8'}));
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            try {
                const viewBox = svg.viewBox.baseVal;
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewBox.width);
                canvas.height = Math.ceil(viewBox.height);
                const context = canvas.getContext('2d');
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed to create schematic PNG.')), 'image/png');
            } catch (error) {
                reject(error);
            } finally {
                URL.revokeObjectURL(url);
            }
        };
        image.onerror = error => {
            URL.revokeObjectURL(url);
            reject(error);
        };
        image.src = url;
    });
}

function copySchematicPng(svg) {
    if (!navigator.clipboard || !window.ClipboardItem) {
        console.error('Clipboard API for images is not supported in this browser/context.');
        return;
    }
    const pngBlob = schematicPngBlob(svg);
    navigator.clipboard.write([new ClipboardItem({'image/png': pngBlob})])
        .catch(error => console.error('Failed to copy schematic PNG:', error));
}

function copyButtonHover(event) {
    event.currentTarget.style.background = '#ccf2ff';
}

function copyButtonPress(event) {
    event.currentTarget.style.background = '#00ace6';
}

function copyButtonLeave(event) {
    event.currentTarget.style.background = 'none';
}

function styleSchematicButton(button) {
    button.type = 'button';
    button.style.background = 'none';
    button.style.border = 'none';
    button.style.padding = '4px 8px';
    button.style.cursor = 'pointer';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.gap = '4px';
    button.style.borderRadius = '6px';
    button.style.fontFamily = 'Arial, Helvetica, sans-serif';
    button.style.fontSize = '13px';
    button.addEventListener('mouseover', copyButtonHover);
    button.addEventListener('mouseout', copyButtonLeave);
    button.addEventListener('mousedown', copyButtonPress);
    button.addEventListener('mouseup', copyButtonHover);
}

function sizeSchematicSvg(svg, scale) {
    const viewBox = svg.viewBox.baseVal;
    svg.style.width = `${Math.max(1, Math.floor(viewBox.width * scale))}px`;
    svg.style.height = `${Math.max(1, Math.floor(viewBox.height * scale))}px`;
}

function updateFittedSchematic(svg, viewport, button) {
    if (button.dataset.fit !== 'true') return;
    const viewBox = svg.viewBox.baseVal;
    const fullHeight = Math.min(Math.ceil(viewBox.height), 600);
    const scale = Math.min(1, viewport.clientWidth / viewBox.width,
        fullHeight / viewBox.height);
    if (Number.isFinite(scale) && scale > 0) {
        sizeSchematicSvg(svg, scale);
        viewport.style.height = `${Math.min(fullHeight, Math.ceil(viewBox.height * scale))}px`;
    }
}

function toggleSchematicFit(svg, viewport, button) {
    if (button.dataset.fit === 'true') {
        button.dataset.fit = 'false';
        button.textContent = 'Fit drawing';
        button.setAttribute('aria-label', 'Fit drawing');
        sizeSchematicSvg(svg, 1);
        viewport.style.height = `${Math.min(Math.ceil(svg.viewBox.baseVal.height), 600)}px`;
    } else {
        button.dataset.fit = 'true';
        button.textContent = 'Actual size';
        button.setAttribute('aria-label', 'Actual size');
        updateFittedSchematic(svg, viewport, button);
        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;
    }
}

export function schematic(circuit, options = {}) {
    const model = buildSchematicModel(circuit, options);
    const markup = renderSchematicSvg(model);
    const mount = typeof options.mount === 'string' ? document.querySelector(options.mount) : options.mount || document.body;
    if (!mount) throw new TypeError('schematic() mount was not found.');
    const container = document.createElement('div');
    if (options.containerId) container.id = options.containerId;
    container.style.position = 'relative';
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.justifyContent = 'flex-end';
    toolbar.style.gap = '8px';
    const viewport = document.createElement('div');
    viewport.style.width = '100%';
    viewport.style.height = `${Math.min(Math.ceil(model.graph.viewBox[3]), 600)}px`;
    viewport.style.overflow = 'auto';
    viewport.innerHTML = markup;
    const svg = viewport.querySelector('svg');
    svg.style.display = 'block';
    svg.style.maxWidth = 'none';
    sizeSchematicSvg(svg, 1);
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Copy PNG');
    styleSchematicButton(button);
    button.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="5" y="5" width="11" height="12" rx="2" fill="none" stroke="currentColor"/><path d="M3 13 V4 Q3 2 5 2 H13" fill="none" stroke="currentColor"/></svg>Copy as png';
    button.addEventListener('click', copySchematicPng.bind(null, svg));
    const fitButton = document.createElement('button');
    fitButton.setAttribute('aria-label', 'Fit drawing');
    fitButton.textContent = 'Fit drawing';
    fitButton.dataset.fit = 'false';
    styleSchematicButton(fitButton);
    fitButton.addEventListener('click', toggleSchematicFit.bind(null, svg, viewport, fitButton));
    toolbar.appendChild(button);
    toolbar.appendChild(fitButton);
    container.appendChild(toolbar);
    container.appendChild(viewport);
    mount.appendChild(container);
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(updateFittedSchematic.bind(null, svg, viewport, fitButton))
            .observe(viewport);
    }
    return {svg, graph: model.graph, topology: model.topology};
}
