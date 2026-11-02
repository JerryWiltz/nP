// Modified: 2026-11-01
import {schematicSymbols} from './schematicSymbols';
import {nodalBlockSymbol, symbolForSchematicEntry} from './nodalBlockSymbol';

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
    const unit = ['resistor', 'parallel-resistor'].includes(part.symbol) ? ' Ω' :
        ['capacitor', 'parallel-capacitor'].includes(part.symbol) ? ' F' :
        ['inductor', 'parallel-inductor'].includes(part.symbol) ? ' H' : part.symbol === 'attenuator' ||
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
    if (node.kind === 'nodal' && node.externalNodes.length === 2) {
        parts.push({kind: 'component', symbol: 'nodal'});
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

function transformedBounds(bounds, source, input, angle, mirrorY = false) {
    const corners = [[bounds[0], bounds[1]], [bounds[2], bounds[1]],
        [bounds[2], bounds[3]], [bounds[0], bounds[3]]];
    const points = corners.map(point => {
        const rotated = rotateVector([point[0] - source[0],
            (mirrorY ? -1 : 1) * (point[1] - source[1])], angle);
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

function placeComponents(parts, digits, initialDirection = [1, 0], minimumGap = 0) {
    const placements = [];
    const wires = [];
    const wireNodes = [];
    const nodes = [[0, 0]];
    const counters = {};
    let direction = initialDirection.slice();
    let previous = [0, 0];

    for (const item of parts) {
        const part = item.part || item;
        const inputPort = item.part ? item.inputPort : 1;
        const outputPort = 3 - inputPort;
        const symbol = schematicSymbols[part.symbol];
        if (!symbol) throw new TypeError(`schematic() has no bundled symbol for ${part.symbol}.`);
        if (symbol.ports.length !== 2) {
            throw new RangeError('schematic() series layout accepts only two-port symbols.');
        }
        const source = symbol.ports[inputPort - 1];
        const entry = inputPort === 1 ? symbol.entry || [1, 0] :
            symbol.exit.map(value => -value);
        const angle = (chooseSymbolOrientation(direction) -
            chooseSymbolOrientation(entry) + 360) % 360;
        let input;
        let bounds;
        let bodyBounds;
        let placedGap;
        for (let gap = placements.length ? minimumGap : 60;
            gap <= 1000; gap += minimumGap ? 2 * GRID : GRID) {
            const candidate = [previous[0] + direction[0] * gap,
                previous[1] + direction[1] * gap];
            const candidateBody = transformedBounds(symbol.bodyBounds, source, candidate, angle);
            const collidesWithBody = placements.some(placed => intersects(candidateBody, placed.bodyBounds, 8));
            const collidesWithWire = wires.some(wire => intersects(candidateBody, segmentBounds(wire), 4));
            const connector = [previous, candidate];
            const blocksConnector = gap > 0 && placements.slice(0, -1).some(placed =>
                intersects(segmentBounds(connector), placed.bodyBounds, 4));
            if (!collidesWithBody && !collidesWithWire && !blocksConnector) {
                input = candidate;
                bodyBounds = candidateBody;
                bounds = transformedBounds(symbol.bounds, source, candidate, angle);
                placedGap = gap;
                break;
            }
        }
        if (!input) throw new RangeError('schematic() could not place a component without a collision.');
        if (placedGap > 0) {
            wires.push([previous, input]);
            wireNodes.push(placements.length + 1);
        }
        if (placements.length) nodes.push(minimumGap ?
            [(previous[0] + input[0]) / 2, (previous[1] + input[1]) / 2] : input);
        const delta = rotateVector([
            symbol.ports[outputPort - 1][0] - source[0],
            symbol.ports[outputPort - 1][1] - source[1]
        ], angle);
        const output = [input[0] + delta[0], input[1] + delta[1]];
        const prefix = part.labelPrefix || ({resistor: 'R', capacitor: 'C', inductor: 'L', cascade: 'CAS',
            'microstrip-right-bend': 'MB', 'microstrip-left-bend': 'MB',
            'transmission-line': 'TLIN', 'microstrip-line': 'MLIN', attenuator: 'ATT',
            amplifier: 'AMP', thru: 'THRU', 'microstrip-step': 'MSTEP',
            'microstrip-via-transition': 'MVIA', 'microstrip-thin-film-resistor': 'MTFR',
            'diode-1n4148': 'D', nodal: 'NODAL', mod: 'MOD', demod: 'DEMOD'}[part.symbol] ||
            part.symbol.toUpperCase().replace(/[^A-Z]/g, ''));
        const id = `${prefix}${counters[prefix] = (counters[prefix] || 0) + 1}`;
        const label = componentLabel(part, id, digits);
        const inkBounds = [bodyBounds].concat(symbol.leads.map(lead => segmentBounds(
            lead.map(point => transformedPoint(point, source, input, angle)), 4)));
        placements.push({part, symbol, inputPort, outputPort, input, output, angle,
            id, label, bounds, bodyBounds, inkBounds});
        previous = output;
        const exit = inputPort === 1 ? symbol.exit :
            (symbol.entry || [1, 0]).map(value => -value);
        direction = rotateVector(exit, angle);
    }

    const end = [previous[0] + direction[0] * 60, previous[1] + direction[1] * 60];
    wires.push([previous, end]);
    wireNodes.push(placements.length + 1);
    nodes.push(end);
    return {placements, wires, wireNodes, nodes, end};
}

function renderSymbol(placement) {
    const {symbol, input, angle} = placement;
    const source = symbol.ports[placement.inputPort - 1];
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
    if (node.kind !== 'cascade') return {kind: 'component', id: placements[cursor.index++].id};
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
        ports: [1, 2].map(port => ({port,
            node: port === placement.inputPort ? index + 1 : index + 2,
            at: port === placement.inputPort ? placement.input.slice() :
                placement.output.slice()}))
    }));
    const connections = components.slice(1).map((component, index) => ({
        node: index + 2,
        from: {component: components[index].id,
            port: layout.placements[index].outputPort},
        to: {component: component.id,
            port: layout.placements[index + 1].inputPort}
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
            node: layout.wireNodes[index],
            from: wire[0].slice(),
            to: wire[1].slice()
        })),
        construction: constructionTree(root, layout.placements, {index: 0})
    };
}

function buildSchematicTopology(graph) {
    const parts = graph.components.map(component => ({id: component.id,
        type: component.symbol, value: component.value}));
    const firstPort = graph.components[0].ports.find(port =>
        port.node === graph.externalPorts[0].node).port;
    const lastPort = graph.components.at(-1).ports.find(port =>
        port.node === graph.externalPorts[1].node).port;
    const connections = [[`Port ${graph.externalPorts[0].port}`, `${parts[0].id}.${firstPort}`]];
    for (const connection of graph.connections) {
        connections.push([
            `${connection.from.component}.${connection.from.port}`,
            `${connection.to.component}.${connection.to.port}`
        ]);
    }
    connections.push([`${parts[parts.length - 1].id}.${lastPort}`, `Port ${graph.externalPorts[1].port}`]);
    return {parts, connections};
}

function nodalPlacement(id, entry, sourcePort, at, angle = 0, mirrorY = false) {
    const symbol = symbolForSchematicEntry(entry);
    const source = symbol.ports[sourcePort - 1];
    const reflect = point => mirrorY ? [point[0], 200 - point[1]] : point;
    const transformed = point => transformedPoint(reflect(point), reflect(source), at, angle);
    return {
        id, symbol: entry.part.symbol || entry.part.kind, part: entry.part,
        ...(entry.part.kind === 'nodal' ? {portCount: entry.nodes.length} : {}),
        rotation: angle, mirrorY,
        ports: symbol.ports.map((point, index) => ({port: index + 1, node: entry.nodes[index], at: transformed(point)})),
        at: at.slice(), sourcePort
    };
}

function nodalPath(node, points) {
    return {node, points};
}

function flowPairs(symbol) {
    const geometry = schematicSymbols[symbol];
    if (geometry?.flow) {
        const [left, right] = geometry.flow.throughPorts;
        return [[left, right], [right, left]];
    }
    return geometry?.ports.length === 2 ? [[1, 2], [2, 1]] : [];
}

function orientedFlowPlacement(id, entry, inputPort, at, outputPort, direction,
    branchPort = null) {
    for (const mirrorY of [false, true]) {
        for (const angle of [0, 90, 180, 270]) {
            const placement = nodalPlacement(id, entry, inputPort, at, angle, mirrorY);
            const output = placement.ports[outputPort - 1].at;
            const advance = direction === 'right' ? output[0] > at[0] && output[1] === at[1] :
                output[1] > at[1] && output[0] === at[0];
            if (!advance || branchPort && placement.ports[branchPort - 1].at[1] <= at[1]) continue;
            return placement;
        }
    }
    return null;
}

function orientedTerminationPlacement(id, entry, inputPort, at) {
    const symbol = symbolForSchematicEntry(entry);
    const source = symbol.ports[inputPort - 1];
    const center = [(symbol.bodyBounds[0] + symbol.bodyBounds[2]) / 2,
        (symbol.bodyBounds[1] + symbol.bodyBounds[3]) / 2];
    for (const angle of [0, 90, 180, 270]) {
        const body = transformedPoint(center, source, at, angle);
        if (body[0] === at[0] && body[1] > at[1]) {
            return nodalPlacement(id, entry, inputPort, at, angle);
        }
    }
    return null;
}

function findFlowPath(root) {
    const start = root.externalNodes[0];
    const finish = root.externalNodes[1];
    function visit(node, used, path) {
        if (node === finish && path.length) return path;
        for (let index = 0; index < root.components.length; index++) {
            if (used.has(index)) continue;
            const entry = root.components[index];
            for (const [inputPort, outputPort] of flowPairs(entry.part.symbol || entry.part.kind)) {
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

function requestedShape(options) {
    if (options.shapes === undefined) return null;
    const shapes = options.shapes;
    if (Array.isArray(shapes) && shapes.length === 1 &&
        ['series', 'ladder', 'branchline'].includes(shapes[0])) return shapes[0];
    if (Array.isArray(shapes) && shapes.length === 2 &&
        shapes[0]?.name === 'series' && shapes[1]?.name === 'ladder' &&
        shapes.every(shape => Number.isInteger(shape.from) && Number.isInteger(shape.to))) {
        return shapes.map(shape => ({name: shape.name, from: shape.from, to: shape.to}));
    }
    throw new TypeError('schematic() shapes accepts ["series"], ["ladder"], ["branchline"], or a ' +
        'node-bounded series then ladder pair.');
}

function shapePath(root) {
    if (root.externalNodes.length !== 2 || nodalLoopAnalysis(root).hasLoops) return null;
    return findFlowPath(root);
}

function isSeriesPath(root, path) {
    return path?.length > 0 && path.every(step =>
        symbolForSchematicEntry(root.components[step.index]).ports.length === 2);
}

function isSeriesShape(root, path) {
    return path && path.length === root.components.length && isSeriesPath(root, path);
}

function isLadderShape(root, path, earlierPath = []) {
    if (!path) return false;
    const used = new Set(earlierPath.concat(path).map(step => step.index));
    const entries = root.components;
    let branches = 0;
    for (const step of path) {
        const entry = entries[step.index];
        const flow = symbolForSchematicEntry(entry).flow;
        if (!flow) continue;
        const node = entry.nodes[flow.shuntPort - 1];
        let currentNode = node;
        let branchLength = 0;
        while (true) {
            const matches = entries.map((part, index) => ({part, index}))
                .filter(item => !used.has(item.index) && item.part.nodes.includes(currentNode));
            if (matches.length !== 1) return false;
            const {part, index} = matches[0];
            const ports = symbolForSchematicEntry(part).ports.length;
            if (ports !== part.nodes.length || ports > 2) return false;
            used.add(index);
            if (ports === 1) {
                if (!branchLength) return false;
                branches++;
                break;
            }
            branchLength++;
            currentNode = part.nodes[part.nodes[0] === currentNode ? 1 : 0];
        }
    }
    return branches > 0 && used.size === entries.length;
}

function buildSeriesLadderModel(root, segments, digits) {
    const [series, ladder] = segments;
    const path = shapePath(root);
    if (!path) throw new RangeError('schematic() series then ladder needs one loop-free two-port path.');
    if (series.from !== root.externalNodes[0] || series.to !== ladder.from ||
        ladder.to !== root.externalNodes[1]) {
        throw new RangeError('schematic() series and ladder endpoints must span the external ports ' +
            'and share one boundary node.');
    }
    const pathNodes = [root.externalNodes[0]].concat(path.map(step =>
        root.components[step.index].nodes[step.outputPort - 1]));
    const boundary = pathNodes.indexOf(series.to);
    if (boundary < 1 || boundary >= path.length ||
        !isSeriesPath(root, path.slice(0, boundary)) ||
        !isLadderShape(root, path.slice(boundary), path.slice(0, boundary))) {
        throw new RangeError('schematic() node boundary does not divide this network into ' +
            'series then ladder sections.');
    }
    const model = buildFlowNodalModel(root, digits);
    if (!model) throw new RangeError('schematic() could not lay out the series then ladder sections.');
    model.graph.shapes = segments;
    return model;
}

function flowPartId(part, counters) {
    const symbol = part.symbol || part.kind;
    const prefix = part.labelPrefix || ({resistor: 'R', capacitor: 'C', inductor: 'L', tee: 'TEE',
        'series-tee': 'STEE', short: 'SHORT', open: 'OPEN',
        'transmission-line': 'TLIN', amplifier: 'AMP', attenuator: 'ATT',
        'microstrip-tee': 'MTEE'}[symbol] || symbol.toUpperCase().replace(/[^A-Z]/g, ''));
    counters[prefix] = (counters[prefix] || 0) + 1;
    return `${prefix}${counters[prefix]}`;
}

function treeEdgePath(start, finish, tree) {
    const queue = [start];
    const previous = new Map([[start, null]]);
    for (let position = 0; position < queue.length; position++) {
        const vertex = queue[position];
        if (vertex === finish) break;
        for (const {neighbor, edge} of tree[vertex]) {
            if (previous.has(neighbor)) continue;
            previous.set(neighbor, {vertex, edge});
            queue.push(neighbor);
        }
    }
    const path = [];
    for (let vertex = finish; vertex !== start; vertex = previous.get(vertex).vertex) {
        path.unshift(previous.get(vertex).edge);
    }
    return path;
}

function nodalLoopAnalysis(root) {
    const nodeIds = [...new Set(root.components.flatMap(entry => entry.nodes))];
    const nodeVertices = new Map(nodeIds.map((node, index) =>
        [node, root.components.length + index]));
    const vertexCount = root.components.length + nodeIds.length;
    const parent = Array.from({length: vertexCount}, (_, index) => index);
    const tree = Array.from({length: vertexCount}, () => []);
    const spanningTree = [];
    const closingEdges = [];

    function representative(vertex) {
        while (parent[vertex] !== vertex) {
            parent[vertex] = parent[parent[vertex]];
            vertex = parent[vertex];
        }
        return vertex;
    }

    root.components.forEach((entry, index) => entry.nodes.forEach((node, port) => {
        const componentVertex = index;
        const nodeVertex = nodeVertices.get(node);
        const edge = {component: index + 1, port: port + 1, node};
        const componentRoot = representative(componentVertex);
        const nodeRoot = representative(nodeVertex);
        if (componentRoot === nodeRoot) {
            closingEdges.push({edge, componentVertex, nodeVertex});
            return;
        }
        parent[componentRoot] = nodeRoot;
        spanningTree.push(edge);
        tree[componentVertex].push({neighbor: nodeVertex, edge});
        tree[nodeVertex].push({neighbor: componentVertex, edge});
    }));

    return {
        hasLoops: closingEdges.length > 0,
        spanningTree,
        closingEdges: closingEdges.map(item => item.edge),
        cycles: closingEdges.map(item =>
            treeEdgePath(item.componentVertex, item.nodeVertex, tree).concat(item.edge))
    };
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
            externalPorts: externalPorts.filter(port => port.node === node).map(port => port.port)})),
        loopAnalysis: nodalLoopAnalysis(root)
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
        const branchPort = symbolForSchematicEntry(entry).flow?.shuntPort;
        const placement = orientedFlowPlacement(flowPartId(entry.part, counters), entry,
            step.inputPort, [cursorX, 100], step.outputPort, 'right', branchPort);
        if (!placement) return null;
        const output = placement.ports[step.outputPort - 1].at;
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
                const outputPort = entry.nodes.length === 2 ? 3 - sourcePort : null;
                const child = outputPort ? orientedFlowPlacement(flowPartId(entry.part, counters),
                    entry, sourcePort, [branchX, branchY], outputPort, 'down') :
                    orientedTerminationPlacement(flowPartId(entry.part, counters), entry,
                        sourcePort, [branchX, branchY]);
                if (!child) return null;
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
    const symbol = placement.symbol === 'nodal' ? nodalBlockSymbol(placement.portCount) :
        schematicSymbols[placement.symbol];
    return transformedBounds(symbol.bodyBounds, symbol.ports[placement.sourcePort - 1],
        placement.at, placement.rotation, placement.mirrorY);
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
        const symbol = symbolForSchematicEntry(entry);
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

function wireCrossings(wires) {
    const horizontal = [];
    const vertical = [];
    for (const wire of wires) {
        wire.points.slice(1).forEach((point, index) => {
            const previous = wire.points[index];
            if (previous[1] === point[1] && previous[0] !== point[0]) {
                horizontal.push({node: wire.node, y: point[1],
                    start: Math.min(previous[0], point[0]), end: Math.max(previous[0], point[0])});
            } else if (previous[0] === point[0] && previous[1] !== point[1]) {
                vertical.push({node: wire.node, x: point[0],
                    start: Math.min(previous[1], point[1]), end: Math.max(previous[1], point[1])});
            }
        });
    }
    const seen = new Set();
    const crossings = [];
    for (const across of horizontal) {
        for (const down of vertical) {
            if (across.node === down.node || down.x <= across.start || down.x >= across.end ||
                across.y <= down.start || across.y >= down.end) continue;
            const key = `${down.x},${across.y}`;
            if (!seen.has(key)) {
                seen.add(key);
                crossings.push([down.x, across.y]);
            }
        }
    }
    return crossings;
}

function loopComponentOrder(cycle, root) {
    const order = [];
    for (const edge of cycle) {
        if (order.at(-1) !== edge.component) order.push(edge.component);
    }
    if (order.at(-1) === order[0]) order.pop();
    if (order.length < 3 || order.length !== root.components.length ||
        new Set(order).size !== order.length) return null;
    const firstNode = root.externalNodes[0];
    const first = order.findIndex(component =>
        root.components[component - 1].nodes.includes(firstNode));
    if (first > 0) return order.slice(first).concat(order.slice(0, first));
    return order;
}

function loopSharedNode(left, right, cycle) {
    const leftNodes = cycle.filter(edge => edge.component === left).map(edge => edge.node);
    return cycle.find(edge => edge.component === right &&
        leftNodes.includes(edge.node))?.node;
}

function loopCenter(position, count) {
    const radiusX = Math.max(320, Math.ceil(count / 4) * 160);
    const radiusY = Math.max(240, Math.ceil(count / 4) * 120);
    const angle = Math.PI + position * 2 * Math.PI / count;
    return [Math.round((radiusX + 280 + radiusX * Math.cos(angle)) / GRID) * GRID,
        Math.round((radiusY + 280 + radiusY * Math.sin(angle)) / GRID) * GRID];
}

function loopPlacement(entry, id, center, previous, next, previousNode, nextNode,
    externalNodes, overallCenter) {
    const symbol = symbolForSchematicEntry(entry);
    const bodyCenter = [(symbol.bodyBounds[0] + symbol.bodyBounds[2]) / 2,
        (symbol.bodyBounds[1] + symbol.bodyBounds[3]) / 2];
    const targets = [
        {node: previousNode, direction: [previous[0] - center[0], previous[1] - center[1]]},
        {node: nextNode, direction: [next[0] - center[0], next[1] - center[1]]}
    ];
    entry.nodes.forEach(node => {
        if (externalNodes.includes(node) && node !== previousNode && node !== nextNode) {
            targets.push({node, direction: [center[0] - overallCenter[0],
                center[1] - overallCenter[1]]});
        }
    });
    const angles = [0, 90, 180, 270];
    const mirrors = entry.nodes.length > 2 ? [false, true] : [false];
    const scored = mirrors.flatMap(mirrorY => angles.map(angle => ({angle, mirrorY,
        score: targets.reduce((score, target) => {
        const port = entry.nodes.findIndex(node => node === target.node);
        const offset = rotateVector([symbol.ports[port][0] - bodyCenter[0],
            (mirrorY ? -1 : 1) * (symbol.ports[port][1] - bodyCenter[1])], angle);
        const length = Math.hypot(...offset) * Math.hypot(...target.direction);
        return score + (length ? (offset[0] * target.direction[0] +
            offset[1] * target.direction[1]) / length : 0);
    }, 0)})));
    scored.sort((left, right) => right.score - left.score);
    const {angle, mirrorY} = scored[0];
    const source = symbol.ports[0];
    const offset = rotateVector([source[0] - bodyCenter[0],
        (mirrorY ? -1 : 1) * (source[1] - bodyCenter[1])], angle);
    return nodalPlacement(id, entry, 1, [center[0] + offset[0], center[1] + offset[1]],
        angle, mirrorY);
}

function positionedLoop(root, order, cycle) {
    const centers = order.map((_, position) => loopCenter(position, order.length));
    const overallCenter = [centers.reduce((sum, point) => sum + point[0], 0) / centers.length,
        centers.reduce((sum, point) => sum + point[1], 0) / centers.length];
    const counters = {};
    const placed = new Map();
    for (let position = 0; position < order.length; position++) {
        const component = order[position];
        const previousIndex = (position + order.length - 1) % order.length;
        const nextIndex = (position + 1) % order.length;
        const previousNode = loopSharedNode(component, order[previousIndex], cycle);
        const nextNode = loopSharedNode(component, order[nextIndex], cycle);
        if (previousNode === undefined || nextNode === undefined || previousNode === nextNode) {
            return null;
        }
        const entry = root.components[component - 1];
        const placement = loopPlacement(entry, flowPartId(entry.part, counters),
            centers[position], centers[previousIndex], centers[nextIndex],
            previousNode, nextNode, root.externalNodes, overallCenter);
        placed.set(component, placement);
    }
    const placements = root.components.map((_, index) => placed.get(index + 1));
    const score = root.externalNodes.reduce((sum, node) => {
        const placement = placements.find(part => part.ports.some(port => port.node === node));
        const port = placement?.ports.find(item => item.node === node);
        if (!port) return sum;
        const body = treeLayoutBounds(placement);
        const center = [(body[0] + body[2]) / 2, (body[1] + body[3]) / 2];
        const outward = [center[0] - overallCenter[0], center[1] - overallCenter[1]];
        const terminal = [port.at[0] - center[0], port.at[1] - center[1]];
        return sum + outward[0] * terminal[0] + outward[1] * terminal[1];
    }, 0);
    return {order, placed, placements, score};
}

function branchlineArm(root, byNode, junctions, startIndex, startPort) {
    const parts = [];
    let index = startIndex;
    let port = startPort;
    const visited = new Set();
    while (true) {
        const node = root.components[index].nodes[port - 1];
        const ends = byNode.get(node);
        if (ends?.length !== 2) return null;
        const other = ends.find(end => end.index !== index || end.port !== port);
        if (!other) return null;
        if (junctions.has(other.index)) {
            return parts.length && other.index !== startIndex ?
                {a: startIndex, aPort: startPort, b: other.index, bPort: other.port, parts} : null;
        }
        if (visited.has(other.index) || root.components[other.index].nodes.length !== 2) return null;
        visited.add(other.index);
        parts.push({index: other.index, inputPort: other.port, outputPort: 3 - other.port});
        index = other.index;
        port = 3 - other.port;
    }
}

function branchlineShortest(adjacency, start, finish, excluded) {
    const queue = [[start]];
    const seen = new Set([start, ...excluded]);
    for (const path of queue) {
        const last = path.at(-1);
        if (last === finish) return path;
        for (const edge of adjacency.get(last) || []) {
            const next = edge.a === last ? edge.b : edge.a;
            if (seen.has(next)) continue;
            seen.add(next);
            queue.push(path.concat(next));
        }
    }
    return null;
}

function branchlineBinding(root) {
    if (root.externalNodes.length !== 4 || new Set(root.externalNodes).size !== 4) return null;
    const byNode = new Map();
    const junctions = new Set();
    const twoPorts = new Set();
    root.components.forEach((entry, index) => {
        const symbol = symbolForSchematicEntry(entry);
        if (symbol.ports.length !== entry.nodes.length) return;
        if (symbol.flow && entry.nodes.length === 3) junctions.add(index);
        else if (entry.nodes.length === 2) twoPorts.add(index);
        entry.nodes.forEach((node, port) => {
            if (!byNode.has(node)) byNode.set(node, []);
            byNode.get(node).push({index, port: port + 1});
        });
    });
    if (junctions.size + twoPorts.size !== root.components.length) return null;
    const corners = root.externalNodes.map(node => {
        const ends = byNode.get(node);
        return ends?.length === 1 && junctions.has(ends[0].index) ? ends[0].index : null;
    });
    if (corners.includes(null) || new Set(corners).size !== 4) return null;
    const edges = [];
    const edgeByPair = new Map();
    const adjacency = new Map([...junctions].map(index => [index, []]));
    const usedParts = new Set();
    for (const index of junctions) {
        const entry = root.components[index];
        for (let port = 1; port <= entry.nodes.length; port++) {
            if (root.externalNodes.includes(entry.nodes[port - 1])) continue;
            const edge = branchlineArm(root, byNode, junctions, index, port);
            if (!edge) return null;
            if (index > edge.b) continue;
            const key = `${index}:${edge.b}`;
            if (edgeByPair.has(key) || edge.parts.some(part => usedParts.has(part.index))) return null;
            edge.parts.forEach(part => usedParts.add(part.index));
            edgeByPair.set(key, edge);
            edges.push(edge);
            adjacency.get(index).push(edge);
            adjacency.get(edge.b).push(edge);
        }
    }
    if (usedParts.size !== twoPorts.size || [...junctions].some(index =>
        adjacency.get(index).length !== (corners.includes(index) ? 2 : 3))) return null;
    const [topLeft, topRight, bottomRight, bottomLeft] = corners;
    const top = branchlineShortest(adjacency, topLeft, topRight,
        new Set([bottomLeft, bottomRight]));
    const bottom = branchlineShortest(adjacency, bottomLeft, bottomRight,
        new Set([topLeft, topRight]));
    if (!top || !bottom || top.length < 2 || top.length !== bottom.length ||
        new Set(top.concat(bottom)).size !== junctions.size) return null;
    const expected = new Set();
    for (let column = 0; column < top.length; column++) {
        const pairs = [[top[column], bottom[column]]];
        if (column + 1 < top.length) {
            pairs.push([top[column], top[column + 1]],
                [bottom[column], bottom[column + 1]]);
        }
        for (const [left, right] of pairs) {
            const key = `${Math.min(left, right)}:${Math.max(left, right)}`;
            if (!edgeByPair.has(key)) return null;
            expected.add(key);
        }
    }
    if (expected.size !== edges.length) return null;
    return {top, bottom, corners, edges, adjacency, edgeByPair};
}

function branchlineJunctionPlacement(entry, id, anchor, targets) {
    const symbol = symbolForSchematicEntry(entry);
    const [first, second] = symbol.flow.throughPorts.map(port => symbol.ports[port - 1]);
    const center = [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
    const source = symbol.ports[0];
    for (const mirrorY of [false, true]) {
        for (const angle of [0, 90, 180, 270]) {
            const aligned = targets.every(target => {
                const point = symbol.ports[target.port - 1];
                const offset = rotateVector([point[0] - center[0],
                    (mirrorY ? -1 : 1) * (point[1] - center[1])], angle);
                return offset[0] * target.direction[0] +
                    offset[1] * target.direction[1] > 0 &&
                    offset[0] * target.direction[1] === offset[1] * target.direction[0];
            });
            if (!aligned) continue;
            const offset = rotateVector([source[0] - center[0],
                (mirrorY ? -1 : 1) * (source[1] - center[1])], angle);
            return nodalPlacement(id, entry, 1,
                [anchor[0] + offset[0], anchor[1] + offset[1]], angle, mirrorY);
        }
    }
    return null;
}

function branchlinePartPlacement(entry, id, inputPort, outputPort, at, direction) {
    const symbol = symbolForSchematicEntry(entry);
    const input = symbol.ports[inputPort - 1];
    const output = symbol.ports[outputPort - 1];
    for (const angle of [0, 90, 180, 270]) {
        const delta = rotateVector([output[0] - input[0], output[1] - input[1]], angle);
        if (delta[0] * direction[0] + delta[1] * direction[1] > 0 &&
            delta[0] * direction[1] === delta[1] * direction[0]) {
            return nodalPlacement(id, entry, inputPort, at, angle);
        }
    }
    return null;
}

function branchlinePositions(binding) {
    const positions = new Map();
    const topY = 240;
    const rungParts = binding.top.map((index, column) => {
        const other = binding.bottom[column];
        return binding.edgeByPair.get(`${Math.min(index, other)}:${Math.max(index, other)}`)
            .parts.length;
    });
    const height = 200 * (Math.max(...rungParts) + 1);
    let x = 240;
    for (let column = 0; column < binding.top.length; column++) {
        positions.set(binding.top[column], [x, topY]);
        positions.set(binding.bottom[column], [x, topY + height]);
        if (column + 1 < binding.top.length) {
            const upper = binding.edgeByPair.get(`${Math.min(binding.top[column], binding.top[column + 1])}:` +
                `${Math.max(binding.top[column], binding.top[column + 1])}`);
            const lower = binding.edgeByPair.get(`${Math.min(binding.bottom[column], binding.bottom[column + 1])}:` +
                `${Math.max(binding.bottom[column], binding.bottom[column + 1])}`);
            x += 200 * (Math.max(upper.parts.length, lower.parts.length) + 1);
        }
    }
    return positions;
}

function buildBranchlineModel(root, digits) {
    const binding = branchlineBinding(root);
    if (!binding) return null;
    const positions = branchlinePositions(binding);
    const counters = {};
    const placed = new Map();
    const externalDirections = [[-1, 0], [1, 0], [1, 0], [-1, 0]];
    for (const index of positions.keys()) {
        const entry = root.components[index];
        const anchor = positions.get(index);
        const targets = binding.adjacency.get(index).map(edge => {
            const neighbor = edge.a === index ? edge.b : edge.a;
            const other = positions.get(neighbor);
            return {port: edge.a === index ? edge.aPort : edge.bPort,
                direction: [Math.sign(other[0] - anchor[0]), Math.sign(other[1] - anchor[1])]};
        });
        const corner = binding.corners.indexOf(index);
        if (corner >= 0) {
            targets.push({port: entry.nodes.indexOf(root.externalNodes[corner]) + 1,
                direction: externalDirections[corner]});
        }
        const placement = branchlineJunctionPlacement(entry, flowPartId(entry.part, counters),
            anchor, targets);
        if (!placement) return null;
        placed.set(index, placement);
    }
    const wires = [];
    const nodePoints = new Map();
    for (const edge of binding.edges) {
        const a = positions.get(edge.a);
        const b = positions.get(edge.b);
        const forward = a[0] < b[0] || a[1] < b[1];
        const startIndex = forward ? edge.a : edge.b;
        const endIndex = forward ? edge.b : edge.a;
        const start = positions.get(startIndex);
        const end = positions.get(endIndex);
        const direction = [Math.sign(end[0] - start[0]), Math.sign(end[1] - start[1])];
        const parts = forward ? edge.parts : edge.parts.slice().reverse().map(part =>
            ({index: part.index, inputPort: part.outputPort, outputPort: part.inputPort}));
        const startPort = forward ? edge.aPort : edge.bPort;
        const endPort = forward ? edge.bPort : edge.aPort;
        let previous = placed.get(startIndex).ports[startPort - 1];
        const stride = (Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1])) /
            (parts.length + 1);
        for (let position = 0; position < parts.length; position++) {
            const part = parts[position];
            const entry = root.components[part.index];
            const at = [start[0] + direction[0] * stride * (position + 1),
                start[1] + direction[1] * stride * (position + 1)];
            const placement = branchlinePartPlacement(entry, flowPartId(entry.part, counters),
                part.inputPort, part.outputPort, at, direction);
            if (!placement) return null;
            placed.set(part.index, placement);
            const input = placement.ports[part.inputPort - 1];
            if (previous.node !== input.node) return null;
            const points = routeBetween(previous.at, input.at);
            wires.push(nodalPath(input.node, points));
            nodePoints.set(input.node, wireNodePoint(points));
            previous = placement.ports[part.outputPort - 1];
        }
        const finish = placed.get(endIndex).ports[endPort - 1];
        if (previous.node !== finish.node) return null;
        const points = routeBetween(previous.at, finish.at);
        wires.push(nodalPath(finish.node, points));
        nodePoints.set(finish.node, wireNodePoint(points));
    }
    const externalPorts = root.externalNodes.map((node, corner) => {
        const index = binding.corners[corner];
        const port = placed.get(index).ports.find(item => item.node === node);
        const direction = externalDirections[corner];
        const at = [port.at[0] + direction[0] * 100, port.at[1]];
        const points = [port.at, at];
        wires.push(nodalPath(node, points));
        nodePoints.set(node, wireNodePoint(points));
        return {port: corner + 1, node, at};
    });
    const placements = root.components.map((_, index) => placed.get(index));
    if (placements.includes(undefined)) return null;
    const bounds = placements.map(treeLayoutBounds);
    if (bounds.some((box, index) => bounds.slice(index + 1)
        .some(other => intersects(box, other, 20)))) return null;
    const fixedBounds = bounds.concat(wires.flatMap(wire => wire.points.slice(1)
        .map((point, index) => segmentBounds([wire.points[index], point], 4))));
    const nodeIds = [...new Set(root.components.flatMap(entry => entry.nodes))];
    if (nodeIds.some(node => !nodePoints.has(node))) return null;
    const nodeTasks = nodeIds.map(node => ({candidates: treeNodeCandidates(nodePoints.get(node))}));
    const labelTasks = placements.map(placement => {
        const text = componentLabel(placement.part, placement.id, digits);
        return {text, candidates: labelCandidates(text, treeLayoutBounds(placement))};
    });
    const portTasks = externalPorts.map(port => ({text: `Port ${port.port}`,
        candidates: labelCandidates(`Port ${port.port}`, circleBounds(...port.at, 4))}));
    let choices;
    try {
        choices = chooseAnnotations(nodeTasks.concat(labelTasks, portTasks), fixedBounds);
    } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        return null;
    }
    const nodes = nodeIds.map((node, index) => ({id: node, at: nodePoints.get(node),
        numberAt: [choices[index].x, choices[index].y]}));
    const labels = labelTasks.concat(portTasks).map((task, index) => ({text: task.text,
        at: [choices[nodeIds.length + index].x, choices[nodeIds.length + index].y]}));
    const points = placements.flatMap(placement => placement.ports.map(port => port.at))
        .concat(wires.flatMap(wire => wire.points), nodes.flatMap(node =>
            [node.at, node.numberAt]), labels.map(label => label.at));
    const minX = Math.floor((Math.min(...points.map(point => point[0])) - 100) / GRID) * GRID;
    const minY = Math.floor((Math.min(...points.map(point => point[1])) - 100) / GRID) * GRID;
    const maxX = Math.ceil((Math.max(...points.map(point => point[0])) + 100) / GRID) * GRID;
    const maxY = Math.ceil((Math.max(...points.map(point => point[1])) + 100) / GRID) * GRID;
    const graph = {kind: 'rf-nodal', layout: 'branchline', shape: 'branchline',
        cells: binding.top.length - 1, viewBox: [minX, minY, maxX - minX, maxY - minY],
        components: placements, nodes, wires, labels, externalPorts};
    return {graph, topology: flowTopology(root, placements, externalPorts)};
}

function buildSingleLoopNodalModel(root, digits, analysis) {
    if (analysis.cycles.length !== 1) return null;
    const cycle = analysis.cycles[0];
    const order = loopComponentOrder(cycle, root);
    if (!order || order.some(component =>
        cycle.filter(edge => edge.component === component).length !== 2)) return null;
    const cyclePorts = new Set(cycle.map(edge => `${edge.component}:${edge.port}`));
    if (root.components.some((entry, index) => entry.nodes.some((node, port) =>
        !cyclePorts.has(`${index + 1}:${port + 1}`) && !root.externalNodes.includes(node)))) {
        return null;
    }
    const clockwise = positionedLoop(root, order, cycle);
    const reverseOrder = [order[0], ...order.slice(1).reverse()];
    const anticlockwise = positionedLoop(root, reverseOrder, cycle);
    const selected = !clockwise ? anticlockwise : !anticlockwise ? clockwise :
        clockwise.score >= anticlockwise.score ? clockwise : anticlockwise;
    if (!selected) return null;
    const {placed, placements} = selected;
    const loopOrder = selected.order;
    const bounds = placements.map(treeLayoutBounds);
    if (bounds.some((box, index) => bounds.slice(index + 1)
        .some(other => intersects(box, other, 20)))) return null;
    const wires = [];
    const wireOwners = [];
    const nodePoints = new Map();
    for (let position = 0; position < loopOrder.length; position++) {
        const component = loopOrder[position];
        const nextComponent = loopOrder[(position + 1) % loopOrder.length];
        const node = loopSharedNode(component, nextComponent, cycle);
        const start = placed.get(component).ports.find(port => port.node === node).at;
        const end = placed.get(nextComponent).ports.find(port => port.node === node).at;
        const points = routeBetween(start, end, position >= loopOrder.length / 2);
        wires.push(nodalPath(node, points));
        wireOwners.push(new Set([component - 1, nextComponent - 1]));
        nodePoints.set(node, wireNodePoint(points));
    }
    const externalPorts = root.externalNodes.map((node, index) => {
        const placement = placements.find(part => part.ports.some(port => port.node === node));
        if (!placement) return null;
        const port = placement.ports.find(item => item.node === node);
        const direction = outwardPortDirection(placement, port.port);
        const at = [port.at[0] + direction[0] * 100,
            port.at[1] + direction[1] * 100];
        const points = routeBetween(port.at, at);
        wires.push(nodalPath(node, points));
        wireOwners.push(new Set([placements.indexOf(placement)]));
        if (!nodePoints.has(node)) nodePoints.set(node, wireNodePoint(points));
        return {port: index + 1, node, at};
    });
    if (externalPorts.includes(null)) return null;
    const nodeIds = [...new Set(root.components.flatMap(entry => entry.nodes)
        .concat(root.externalNodes))];
    if (nodeIds.some(node => !nodePoints.has(node))) return null;
    if (wires.some((wire, wireIndex) => wire.points.slice(1).some((point, segmentIndex) =>
        bounds.some((box, index) => !wireOwners[wireIndex].has(index) &&
            intersects(box, segmentBounds([wire.points[segmentIndex], point]), 4))))) {
        return null;
    }
    const fixedBounds = bounds.concat(wires.flatMap(wire => wire.points.slice(1)
        .map((point, index) => segmentBounds([wire.points[index], point], 4))));
    const nodeTasks = nodeIds.map(node => ({candidates: treeNodeCandidates(nodePoints.get(node))}));
    const labelTasks = placements.map(placement => {
        const text = componentLabel(placement.part, placement.id, digits);
        return {text, candidates: labelCandidates(text, treeLayoutBounds(placement))};
    });
    const portLabels = externalPorts.map(port => {
        const owner = placements.find(part => part.ports.some(item => item.node === port.node));
        const terminal = owner.ports.find(item => item.node === port.node);
        const direction = [(port.at[0] - terminal.at[0]) / 100,
            (port.at[1] - terminal.at[1]) / 100];
        return {text: `Port ${port.port}`,
            at: [port.at[0] + direction[0] * 60,
                port.at[1] + direction[1] * 60 - 20]};
    });
    let choices;
    try {
        choices = chooseAnnotations(nodeTasks.concat(labelTasks), fixedBounds);
    } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        try {
            choices = chooseAnnotations(nodeTasks.concat(labelTasks), bounds);
        } catch (retryError) {
            if (retryError instanceof RangeError) return null;
            throw retryError;
        }
    }
    const nodes = nodeIds.map((node, index) => ({id: node, at: nodePoints.get(node),
        numberAt: [choices[index].x, choices[index].y]}));
    const labels = labelTasks.map((task, index) => ({text: task.text,
        at: [choices[nodeIds.length + index].x, choices[nodeIds.length + index].y]}))
        .concat(portLabels);
    const points = placements.flatMap(placement => placement.ports.map(port => port.at))
        .concat(wires.flatMap(wire => wire.points), nodes.flatMap(node =>
            [node.at, node.numberAt]), labels.map(label => label.at));
    const minX = Math.floor((Math.min(...points.map(point => point[0])) - 100) / GRID) * GRID;
    const minY = Math.floor((Math.min(...points.map(point => point[1])) - 100) / GRID) * GRID;
    const maxX = Math.ceil((Math.max(...points.map(point => point[0])) + 160) / GRID) * GRID;
    const maxY = Math.ceil((Math.max(...points.map(point => point[1])) + 100) / GRID) * GRID;
    const graph = {kind: 'rf-nodal', layout: 'closed-loop',
        viewBox: [minX, minY, maxX - minX, maxY - minY],
        components: placements, nodes, wires, crossings: wireCrossings(wires),
        labels, externalPorts};
    return {graph, topology: flowTopology(root, placements, externalPorts)};
}

function buildParallelNodalModel(root, digits) {
    if (root.externalNodes.length !== 2 || root.components.length < 2 ||
        root.externalNodes[0] === root.externalNodes[1]) return null;
    const [leftNode, rightNode] = root.externalNodes;
    if (root.components.some(entry => entry.nodes.length !== 2 ||
        !entry.nodes.includes(leftNode) || !entry.nodes.includes(rightNode))) return null;
    const symbols = root.components.map(symbolForSchematicEntry);
    if (symbols.some(symbol => !symbol || symbol.ports.length !== 2 ||
        symbol.ports[0][1] !== symbol.ports[1][1])) return null;
    const counters = {};
    const placements = root.components.map((entry, index) => {
        const inputPort = entry.nodes.indexOf(leftNode) + 1;
        const rotation = inputPort === 1 ? 0 : 180;
        return nodalPlacement(flowPartId(entry.part, counters), entry, inputPort,
            [320, 260 + index * 160], rotation);
    });
    if (placements.some(placement => placement.ports.find(port =>
        port.node === rightNode).at[0] <= 320)) return null;
    const leftSide = 180;
    const rightSide = Math.ceil((Math.max(...placements.map(placement =>
        placement.ports.find(port => port.node === rightNode).at[0])) + 120) / GRID) * GRID;
    const top = 260;
    const bottom = 260 + (placements.length - 1) * 160;
    const middle = Math.round((top + bottom) / (2 * GRID)) * GRID;
    const externalPorts = [
        {port: 1, node: leftNode, at: [80, middle]},
        {port: 2, node: rightNode, at: [rightSide + 100, middle]}
    ];
    const wires = [
        nodalPath(leftNode, [[leftSide, top], [leftSide, bottom]]),
        nodalPath(rightNode, [[rightSide, top], [rightSide, bottom]]),
        nodalPath(leftNode, [externalPorts[0].at, [leftSide, middle]]),
        nodalPath(rightNode, [externalPorts[1].at, [rightSide, middle]])
    ];
    placements.forEach(placement => {
        const left = placement.ports.find(port => port.node === leftNode).at;
        const right = placement.ports.find(port => port.node === rightNode).at;
        wires.push(nodalPath(leftNode, [left, [leftSide, left[1]]]));
        wires.push(nodalPath(rightNode, [right, [rightSide, right[1]]]));
    });
    const nodes = [
        {id: leftNode, at: [leftSide, middle], numberAt: [leftSide - 40, top - 60]},
        {id: rightNode, at: [rightSide, middle], numberAt: [rightSide + 40, top - 60]}
    ];
    const labels = placements.map(placement => ({
        text: componentLabel(placement.part, placement.id, digits),
        at: [Math.round((treeLayoutBounds(placement)[0] +
            treeLayoutBounds(placement)[2]) / (2 * GRID)) * GRID,
        placement.ports[0].at[1] - 40]})).concat([
        {text: 'Port 1', at: [60, middle - 40]},
        {text: 'Port 2', at: [rightSide + 120, middle - 40]}
    ]);
    const graph = {kind: 'rf-nodal', layout: 'parallel-branches',
        viewBox: [0, 80, rightSide + 240, bottom + 160],
        components: placements, nodes, wires, labels, externalPorts};
    return {graph, topology: flowTopology(root, placements, externalPorts)};
}

function buildJunctionPathsNodalModel(root, digits) {
    if (root.externalNodes.length !== 2) return null;
    const junctions = root.components.map((entry, index) => ({entry, index}))
        .filter(item => item.entry.nodes.length > 2);
    if (junctions.length !== 2) return null;
    const left = junctions.find(item => item.entry.nodes.includes(root.externalNodes[0]));
    const right = junctions.find(item => item.entry.nodes.includes(root.externalNodes[1]));
    if (!left || !right || left.index === right.index) return null;
    const branches = root.components.map((entry, index) => ({entry, index}))
        .filter(item => item.index !== left.index && item.index !== right.index);
    if (branches.length < 3 || left.entry.nodes.length !== branches.length + 1 ||
        right.entry.nodes.length !== branches.length + 1) return null;
    const leftSymbol = symbolForSchematicEntry(left.entry);
    const rightSymbol = symbolForSchematicEntry(right.entry);
    if (!leftSymbol || !rightSymbol) return null;
    const leftExternal = left.entry.nodes.indexOf(root.externalNodes[0]) + 1;
    const rightExternal = right.entry.nodes.indexOf(root.externalNodes[1]) + 1;
    const leftCenterY = (leftSymbol.bodyBounds[1] + leftSymbol.bodyBounds[3]) / 2;
    const rightCenterY = (rightSymbol.bodyBounds[1] + rightSymbol.bodyBounds[3]) / 2;
    if (leftSymbol.ports[leftExternal - 1][1] <= leftCenterY ||
        rightSymbol.ports[rightExternal - 1][1] <= rightCenterY) return null;
    const mapped = branches.map(branch => {
        if (branch.entry.nodes.length !== 2) return null;
        const leftNode = branch.entry.nodes.find(node => left.entry.nodes.includes(node));
        const rightNode = branch.entry.nodes.find(node => right.entry.nodes.includes(node));
        if (leftNode === undefined || rightNode === undefined || leftNode === rightNode) return null;
        return {...branch, leftNode, rightNode};
    });
    if (mapped.includes(null) || new Set(mapped.map(item => item.leftNode)).size !== mapped.length ||
        new Set(mapped.map(item => item.rightNode)).size !== mapped.length ||
        root.components.some((entry, index) => index !== left.index && index !== right.index &&
            entry.nodes.some(node => root.externalNodes.includes(node)))) return null;
    const counters = {};
    const middleY = 260 + (mapped.length - 1) * 80;
    const leftPlacement = nodalPlacement(flowPartId(left.entry.part, counters), left.entry,
        leftExternal, [260, middleY], 90);
    const rightPlacement = nodalPlacement(flowPartId(right.entry.part, counters), right.entry,
        rightExternal, [900, middleY], 270);
    mapped.sort((first, second) =>
        leftPlacement.ports.find(port => port.node === first.leftNode).at[1] -
        leftPlacement.ports.find(port => port.node === second.leftNode).at[1]);
    const branchPlacements = new Map();
    const wires = [];
    const nodes = [];
    mapped.forEach((branch, lane) => {
        const symbol = symbolForSchematicEntry(branch.entry);
        if (!symbol || symbol.ports.length !== 2 ||
            symbol.ports[0][1] !== symbol.ports[1][1]) return;
        const inputPort = branch.entry.nodes.indexOf(branch.leftNode) + 1;
        const angle = inputPort === 1 ? 0 : 180;
        const placement = nodalPlacement(flowPartId(branch.entry.part, counters),
            branch.entry, inputPort, [520, 260 + lane * 160], angle);
        branchPlacements.set(branch.index, placement);
        const leftPort = leftPlacement.ports.find(port => port.node === branch.leftNode).at;
        const rightPort = rightPlacement.ports.find(port => port.node === branch.rightNode).at;
        const input = placement.ports.find(port => port.node === branch.leftNode).at;
        const output = placement.ports.find(port => port.node === branch.rightNode).at;
        const leftRoute = [leftPort, [400 + lane * 20, leftPort[1]],
            [400 + lane * 20, input[1]], input];
        const rightRoute = [output, [760 - lane * 20, output[1]],
            [760 - lane * 20, rightPort[1]], rightPort];
        wires.push(nodalPath(branch.leftNode, leftRoute));
        wires.push(nodalPath(branch.rightNode, rightRoute));
        nodes.push({id: branch.leftNode, at: wireNodePoint(leftRoute),
            numberAt: [420 + lane * 20, input[1] - 40]});
        nodes.push({id: branch.rightNode, at: wireNodePoint(rightRoute),
            numberAt: [740 - lane * 20, output[1] - 40]});
    });
    if (branchPlacements.size !== mapped.length) return null;
    const externalPorts = [
        {port: 1, node: root.externalNodes[0], at: [160, middleY]},
        {port: 2, node: root.externalNodes[1], at: [1000, middleY]}
    ];
    wires.push(nodalPath(externalPorts[0].node, [externalPorts[0].at,
        leftPlacement.ports[leftExternal - 1].at]));
    wires.push(nodalPath(externalPorts[1].node, [externalPorts[1].at,
        rightPlacement.ports[rightExternal - 1].at]));
    nodes.push({id: externalPorts[0].node, at: [200, middleY],
        numberAt: [200, middleY - 40]});
    nodes.push({id: externalPorts[1].node, at: [960, middleY],
        numberAt: [960, middleY - 40]});
    const placements = root.components.map((_, index) => index === left.index ? leftPlacement :
        index === right.index ? rightPlacement : branchPlacements.get(index));
    const labels = placements.map(placement => ({
        text: componentLabel(placement.part, placement.id, digits),
        at: [Math.round((treeLayoutBounds(placement)[0] +
            treeLayoutBounds(placement)[2]) / (2 * GRID)) * GRID,
        treeLayoutBounds(placement)[1] - 40]})).concat([
        {text: 'Port 1', at: [120, middleY - 40]},
        {text: 'Port 2', at: [1040, middleY - 40]}
    ]);
    const graph = {kind: 'rf-nodal', layout: 'parallel-paths',
        viewBox: [40, 80, 1080, 260 + mapped.length * 160],
        components: placements, nodes, wires, crossings: wireCrossings(wires),
        labels, externalPorts};
    return {graph, topology: flowTopology(root, placements, externalPorts)};
}

function graphLevels(root) {
    const neighbors = root.components.map(() => new Set());
    const byNode = new Map();
    root.components.forEach((entry, index) => entry.nodes.forEach(node => {
        if (!byNode.has(node)) byNode.set(node, []);
        byNode.get(node).push(index);
    }));
    for (const indices of byNode.values()) {
        for (const left of indices) for (const right of indices) {
            if (left !== right) neighbors[left].add(right);
        }
    }
    const levels = new Array(root.components.length).fill(-1);
    const source = (byNode.get(root.externalNodes[0]) || [0])[0];
    const queue = [source];
    levels[source] = 0;
    for (let position = 0; position < queue.length; position++) {
        const index = queue[position];
        for (const neighbor of neighbors[index]) {
            if (levels[neighbor] !== -1) continue;
            levels[neighbor] = levels[index] + 1;
            queue.push(neighbor);
        }
    }
    let nextLevel = Math.max(0, ...levels) + 1;
    levels.forEach((level, index) => {
        if (level === -1) levels[index] = nextLevel++;
    });
    return levels;
}

function graphRouteBlocked(point, bounds, terminals, start, finish) {
    if (point[0] === start[0] && point[1] === start[1] ||
        point[0] === finish[0] && point[1] === finish[1]) return false;
    if (bounds.some(box => point[0] > box[0] - 12 && point[0] < box[2] + 12 &&
        point[1] > box[1] - 12 && point[1] < box[3] + 12)) return true;
    return terminals.some(terminal => terminal[0] === point[0] && terminal[1] === point[1]);
}

function graphRoute(start, finish, bounds, terminals) {
    if (start[0] === finish[0] && start[1] === finish[1]) return [start, finish];
    const allX = bounds.flatMap(box => [box[0], box[2]]).concat([start[0], finish[0]]);
    const allY = bounds.flatMap(box => [box[1], box[3]]).concat([start[1], finish[1]]);
    const minX = Math.floor((Math.min(...allX) - 160) / GRID) * GRID;
    const maxX = Math.ceil((Math.max(...allX) + 160) / GRID) * GRID;
    const minY = Math.floor((Math.min(...allY) - 160) / GRID) * GRID;
    const maxY = Math.ceil((Math.max(...allY) + 160) / GRID) * GRID;
    const key = point => `${point[0]},${point[1]}`;
    const previous = new Map([[key(start), null]]);
    const points = new Map([[key(start), start]]);
    const queue = [start];
    for (let position = 0; position < queue.length; position++) {
        const current = queue[position];
        if (current[0] === finish[0] && current[1] === finish[1]) break;
        const next = [[current[0] + GRID, current[1]], [current[0] - GRID, current[1]],
            [current[0], current[1] + GRID], [current[0], current[1] - GRID]];
        next.sort((left, right) =>
            Math.abs(left[0] - finish[0]) + Math.abs(left[1] - finish[1]) -
            Math.abs(right[0] - finish[0]) - Math.abs(right[1] - finish[1]));
        for (const point of next) {
            if (point[0] < minX || point[0] > maxX || point[1] < minY ||
                point[1] > maxY || previous.has(key(point)) ||
                graphRouteBlocked(point, bounds, terminals, start, finish)) continue;
            previous.set(key(point), key(current));
            points.set(key(point), point);
            queue.push(point);
        }
    }
    if (!previous.has(key(finish))) {
        throw new RangeError('schematic() cannot route a network connection.');
    }
    const path = [];
    for (let current = key(finish); current !== null; current = previous.get(current)) {
        path.unshift(points.get(current));
    }
    return path.filter((point, index) => index === 0 || index === path.length - 1 ||
        (point[0] - path[index - 1][0]) !== (path[index + 1][0] - point[0]) ||
        (point[1] - path[index - 1][1]) !== (path[index + 1][1] - point[1]));
}

function buildGraphNodalModel(root, digits) {
    const levels = graphLevels(root);
    const symbols = root.components.map(symbolForSchematicEntry);
    if (symbols.some((symbol, index) => !symbol ||
        symbol.ports.length !== root.components[index].nodes.length)) {
        throw new TypeError('schematic() needs a matching bundled symbol for every component.');
    }
    const stepX = Math.ceil((Math.max(...symbols.map(symbol =>
        symbol.bounds[2] - symbol.bounds[0])) + 160) / GRID) * GRID;
    const stepY = Math.ceil((Math.max(...symbols.map(symbol =>
        symbol.bounds[3] - symbol.bounds[1])) + 160) / GRID) * GRID;
    const groups = new Map();
    levels.forEach((level, index) => {
        if (!groups.has(level)) groups.set(level, []);
        groups.get(level).push(index);
    });
    const counters = {};
    const placed = new Map();
    for (const [level, indices] of groups) {
        indices.forEach((index, row) => {
            const entry = root.components[index];
            const symbol = symbols[index];
            const center = [300 + level * stepX,
                400 + (row - (indices.length - 1) / 2) * stepY];
            const source = symbol.ports[0];
            const bodyCenter = [(symbol.bodyBounds[0] + symbol.bodyBounds[2]) / 2,
                (symbol.bodyBounds[1] + symbol.bodyBounds[3]) / 2];
            const at = [Math.round((center[0] + source[0] - bodyCenter[0]) / GRID) * GRID,
                Math.round((center[1] + source[1] - bodyCenter[1]) / GRID) * GRID];
            placed.set(index, nodalPlacement(flowPartId(entry.part, counters), entry, 1, at));
        });
    }
    const placements = root.components.map((_, index) => placed.get(index));
    const bounds = placements.map(treeLayoutBounds);
    const leftEdge = Math.min(...bounds.map(box => box[0]));
    const rightEdge = Math.max(...bounds.map(box => box[2]));
    const externalPorts = root.externalNodes.map((node, index) => {
        const owners = placements.filter(part => part.ports.some(port => port.node === node));
        if (!owners.length) throw new TypeError('schematic() external node has no component terminal.');
        const owner = owners[0];
        const terminal = owner.ports.find(port => port.node === node);
        return {port: index + 1, node,
            at: [index === 0 ? Math.floor((leftEdge - 120) / GRID) * GRID :
                Math.ceil((rightEdge + 120) / GRID) * GRID,
            terminal.at[1] + (index > 1 ? (index - 1) * 40 : 0)]};
    });
    const byNode = new Map();
    for (const terminal of placements.flatMap(part => part.ports).concat(externalPorts)) {
        if (!byNode.has(terminal.node)) byNode.set(terminal.node, []);
        byNode.get(terminal.node).push(terminal.at);
    }
    const allTerminals = [...byNode.values()].flat();
    const wires = [];
    const nodes = [];
    for (const [node, terminals] of byNode) {
        const ordered = terminals.slice().sort((left, right) => left[0] - right[0] || left[1] - right[1]);
        const hub = ordered.length > 2 ? ordered[Math.floor(ordered.length / 2)] : ordered[0];
        const routes = ordered.slice(1).map(point => {
            try {
                return graphRoute(hub, point, bounds,
                    allTerminals.filter(terminal => terminal !== hub && terminal !== point));
            } catch (error) {
                throw new RangeError(`schematic() cannot route node ${node} from ${hub} to ${point}: ${error.message}`);
            }
        });
        if (routes.length) routes.forEach(points => wires.push(nodalPath(node, points)));
        const marker = routes.length === 1 ? wireNodePoint(routes[0]) : hub;
        nodes.push({id: node, at: marker,
            numberAt: [marker[0], marker[1] - 40]});
    }
    const labels = placements.map(placement => ({
        text: componentLabel(placement.part, placement.id, digits),
        at: [Math.round((treeLayoutBounds(placement)[0] +
            treeLayoutBounds(placement)[2]) / (2 * GRID)) * GRID,
        treeLayoutBounds(placement)[1] - 40]})).concat(externalPorts.map(port => ({
        text: `Port ${port.port}`, at: [port.at[0], port.at[1] - 40]})));
    const points = placements.flatMap(part => part.ports.map(port => port.at))
        .concat(externalPorts.map(port => port.at), wires.flatMap(wire => wire.points),
            nodes.flatMap(node => [node.at, node.numberAt]), labels.map(label => label.at));
    const minX = Math.floor((Math.min(...points.map(point => point[0])) - 100) / GRID) * GRID;
    const minY = Math.floor((Math.min(...points.map(point => point[1])) - 100) / GRID) * GRID;
    const maxX = Math.ceil((Math.max(...points.map(point => point[0])) + 100) / GRID) * GRID;
    const maxY = Math.ceil((Math.max(...points.map(point => point[1])) + 100) / GRID) * GRID;
    const graph = {kind: 'rf-nodal', layout: 'node-routes',
        viewBox: [minX, minY, maxX - minX, maxY - minY],
        components: placements, nodes, wires, crossings: wireCrossings(wires),
        labels, externalPorts};
    return {graph, topology: flowTopology(root, placements, externalPorts)};
}

function buildNodalModel(root, options, digits) {
    if (options.view && options.view !== 'detail') {
        throw new TypeError('schematic() nodal circuits currently support only the detail view.');
    }
    const shape = requestedShape(options);
    if (shape) {
        if (Array.isArray(shape)) return buildSeriesLadderModel(root, shape, digits);
        if (shape === 'branchline') {
            const model = buildBranchlineModel(root, digits);
            if (!model) throw new RangeError('schematic() network does not match a drawable branchline.');
            return model;
        }
        const path = shapePath(root);
        const matches = shape === 'series' ? isSeriesShape(root, path) : isLadderShape(root, path);
        if (!matches) throw new RangeError(`schematic() network does not match the "${shape}" shape.`);
        const shaped = buildFlowNodalModel(root, digits) ||
            (shape === 'series' ? buildTreeNodalModel(root, digits) : null);
        if (!shaped) throw new RangeError(`schematic() could not lay out the "${shape}" shape.`);
        shaped.graph.shape = shape;
        return shaped;
    }
    const analysis = nodalLoopAnalysis(root);
    const model = analysis.hasLoops ? buildParallelNodalModel(root, digits) ||
        buildJunctionPathsNodalModel(root, digits) ||
        buildSingleLoopNodalModel(root, digits, analysis) :
        buildFlowNodalModel(root, digits) || buildTreeNodalModel(root, digits);
    if (model) return model;
    return buildGraphNodalModel(root, digits);
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
    const shape = requestedShape(options);
    if (circuit?.transmitter && circuit.circuit) {
        if (shape && shape !== 'series') {
            throw new RangeError(`schematic() signal path does not match the "${shape}" shape.`);
        }
        const model = buildSignalFlowModel(circuit, options, digits);
        if (shape) model.graph.shape = shape;
        return model;
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
    if (shape && shape !== 'series') {
        throw new RangeError(`schematic() network does not match the "${shape}" shape.`);
    }
    const parts = flattenCascade(shownRoot, []);
    const layout = annotateLayout(placeComponents(parts, digits));
    const graph = buildSchematicGraph(shownRoot, layout, layoutViewBox(layout));
    if (shape) graph.shape = shape;
    return {layout, graph, topology: buildSchematicTopology(graph)};
}

function renderNodalSvg(model) {
    const graph = model.graph;
    const [minX, minY, width, height] = graph.viewBox;
    const wires = graph.wires.map(wire => `<path d="${wire.points.map((point, index) =>
        `${index ? 'L' : 'M'}${point[0]} ${point[1]}`).join(' ')}"/>`).join('');
    const crossovers = (graph.crossings || []).map(([x, y]) =>
        `<rect x="${x - 8}" y="${y - 7}" width="16" height="14" fill="#ffffff" stroke="none"/>` +
        `<path d="M${x - 10} ${y} L${x + 10} ${y}"/>`).join('');
    const junctions = graph.wires.filter(wire => wire.points.length > 2).map(wire => {
        const point = wire.points[wire.points.length - 1];
        return `<circle cx="${point[0]}" cy="${point[1]}" r="4" fill="#202020"/>`;
    }).join('');
    const terminals = graph.externalPorts.map(port =>
        `<circle cx="${port.at[0]}" cy="${port.at[1]}" r="4" fill="#202020"/>`).join('');
    const symbols = graph.components.map(placement => {
        const symbol = placement.symbol === 'nodal' ? nodalBlockSymbol(placement.portCount) :
            schematicSymbols[placement.symbol];
        const source = symbol.ports[placement.sourcePort - 1];
        const transform = `translate(${placement.at[0]} ${placement.at[1]}) rotate(${placement.rotation}) ` +
            (placement.mirrorY ? `translate(${-source[0]} ${source[1] - 200}) translate(0 200) scale(1 -1)` :
                `translate(${-source[0]} ${-source[1]})`);
        const dots = symbol.ports.map(point => `<circle cx="${point[0]}" cy="${point[1]}" r="4" fill="#202020"/>`).join('');
        return `<g transform="${transform}" fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbol.geometry}${dots}</g>`;
    }).join('');
    const nodes = graph.nodes.map(node => `<circle cx="${node.at[0]}" cy="${node.at[1]}" r="4" fill="#202020"/>` +
        `<circle cx="${node.numberAt[0]}" cy="${node.numberAt[1]}" r="12" fill="#ffffff" stroke="#202020" stroke-width="2"/>` +
        `<text x="${node.numberAt[0]}" y="${node.numberAt[1] + 5}" text-anchor="middle"` +
        `${String(node.id).length > 2 ? ' font-size="10"' : ''}>${escapeXml(node.id)}</text>`).join('');
    const labels = graph.labels.map(label => `<text x="${label.at[0]}" y="${label.at[1]}" text-anchor="middle">${escapeXml(label.text)}</text>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" role="img" aria-label="Nodal nPort schematic"><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/><g fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${wires}${crossovers}</g><g fill="#202020" font-family="Arial, Helvetica, sans-serif" font-size="16">${symbols}${junctions}${terminals}${nodes}${labels}</g></svg>`;
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
        model.graph.kind === 'rf-series' ? 'Series of two-port networks' :
            'Cascaded nPort schematic';
    const metadata = model.graph.kind === 'rf-series' ?
        `<title>Series of two-port networks</title><desc>${description}</desc>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" role="img" aria-label="${description}">${metadata}<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/><g fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${wires}</g><g fill="#202020" font-family="Arial, Helvetica, sans-serif" font-size="16">${symbols}${renderNodes(layout)}${labels}</g></svg>`;
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
    const scale = Math.min(1, viewport.clientWidth / viewBox.width);
    if (Number.isFinite(scale) && scale > 0) {
        sizeSchematicSvg(svg, scale);
    }
}

function toggleSchematicFit(svg, viewport, button) {
    if (button.dataset.fit === 'true') {
        button.dataset.fit = 'false';
        button.textContent = 'Fit drawing';
        button.setAttribute('aria-label', 'Fit drawing');
        sizeSchematicSvg(svg, 1);
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
