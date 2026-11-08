// Modified: 2026-11-08
import {schematicSymbols} from './schematicSymbols';
import {nodalBlockSymbol, symbolForSchematicEntry} from './nodalBlockSymbol';
import {schematicShapeBoards} from './schematicShapeBoards';
import {interpretSchematicBoard} from './schematicBoardInterpreter';
import {detectSchematicShapes} from './schematicShapeDetector';
import {groupedSchematicShapes} from './schematicGroups';

const GRID = 10;
// Keep annotation search coverage tied to text size, independently of placement resolution.
const ANNOTATION_STEP = 20;
const DEFAULT_SIGNIFICANT_DIGITS = 3;

function schematicDots(value) {
    const defaults = {ports: true, nodes: true, terminals: false};
    if (value === undefined) return defaults;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError('schematic() dots must be an object with boolean ports, nodes and terminals options.');
    }
    for (const [key, enabled] of Object.entries(value)) {
        if (!Object.prototype.hasOwnProperty.call(defaults, key) || typeof enabled !== 'boolean') {
            throw new TypeError('schematic() dots accepts only boolean ports, nodes and terminals options.');
        }
    }
    return {...defaults, ...value};
}

function schematicDot(point, kind) {
    return `<circle data-schematic-dot="${kind}" cx="${point[0]}" cy="${point[1]}" r="4" fill="#202020"/>`;
}

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

function transformedBounds(bounds, source, input, angle, mirrorY = false, mirrorX = false) {
    const corners = [[bounds[0], bounds[1]], [bounds[2], bounds[1]],
        [bounds[2], bounds[3]], [bounds[0], bounds[3]]];
    const points = corners.map(point => {
        const rotated = rotateVector([(mirrorX ? -1 : 1) * (point[0] - source[0]),
            (mirrorY ? -1 : 1) * (point[1] - source[1])], angle);
        return [input[0] + rotated[0], input[1] + rotated[1]];
    });
    return [Math.min(...points.map(point => point[0])), Math.min(...points.map(point => point[1])),
        Math.max(...points.map(point => point[0])), Math.max(...points.map(point => point[1]))];
}

function transformedPoint(point, source, input, angle, mirrorX = false, mirrorY = false) {
    const rotated = rotateVector([(mirrorX ? -1 : 1) * (point[0] - source[0]),
        (mirrorY ? -1 : 1) * (point[1] - source[1])], angle);
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
    for (let distance = 40; distance <= 400; distance += ANNOTATION_STEP) {
        const members = group.nodes.map(node => {
            const x = group.axis === 'horizontal' ? node.point[0] : group.baseline + distance;
            const y = group.axis === 'horizontal' ? group.baseline - distance : node.point[1];
            return {id: node.id, x, y, bounds: circleBounds(x, y)};
        });
        candidates.push({members, cost: distance * members.length});
    }
    return candidates;
}

function labelCandidates(text, bounds, preferredAt = null) {
    const centerX = Math.round((bounds[0] + bounds[2]) / (2 * GRID)) * GRID;
    const centerY = Math.round((bounds[1] + bounds[3]) / (2 * GRID)) * GRID;
    const halfWidth = Math.ceil(text.length * 9 / 2);
    const tall = bounds[3] - bounds[1] > bounds[2] - bounds[0];
    const candidates = [];
    if (preferredAt) {
        candidates.push({x: preferredAt[0], y: preferredAt[1],
            bounds: labelBounds(text, preferredAt[0], preferredAt[1]), cost: 0});
    }
    for (let distance = ANNOTATION_STEP; distance <= 400; distance += ANNOTATION_STEP) {
        for (const offset of [0, -ANNOTATION_STEP, ANNOTATION_STEP, -2 * ANNOTATION_STEP, 2 * ANNOTATION_STEP]) {
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

function chooseSpacedAnnotations(tasks, fixedBounds) {
    const occupied = fixedBounds.slice(), choices = [];
    for (const task of tasks) {
        let choice = task.candidates.find(candidate => boxesClear(candidateBounds(candidate), occupied));
        if (!choice) {
            const base = task.candidates[0];
            const extent = Math.max(...occupied.flatMap(box => [Math.abs(box[0] - base.x),
                Math.abs(box[2] - base.x), Math.abs(box[1] - base.y), Math.abs(box[3] - base.y)]), 400) + 400;
            for (let distance = 40; distance <= extent && !choice; distance += 40) {
                for (const [dx, dy] of [[0, -distance], [distance, 0], [0, distance], [-distance, 0]]) {
                    const candidate = {...base, x: base.x + dx, y: base.y + dy,
                        bounds: [base.bounds[0] + dx, base.bounds[1] + dy,
                            base.bounds[2] + dx, base.bounds[3] + dy]};
                    if (boxesClear([candidate.bounds], occupied)) { choice = candidate; break; }
                }
            }
        }
        if (!choice) throw new RangeError('ORI could not place a readable annotation.');
        choices.push(choice);
        occupied.push(...candidateBounds(choice));
    }
    return choices;
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

function renderSymbol(placement, dots) {
    const {symbol, input, angle} = placement;
    const source = symbol.ports[placement.inputPort - 1];
    const transform = `translate(${input[0]} ${input[1]}) rotate(${angle}) translate(${-source[0]} ${-source[1]})`;
    const terminals = dots.terminals ? symbol.ports.map(point => schematicDot(point, 'terminal')).join('') : '';
    return `<g transform="${transform}" fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbol.geometry}${terminals}</g>`;
}

function renderNodes(layout, dots) {
    return layout.nodes.map((node, index) => {
        const number = layout.nodeNumbers[index];
        const external = index === 0 || index === layout.nodes.length - 1;
        const dot = (external ? dots.ports : dots.nodes) ? schematicDot(node, external ? 'port' : 'node') : '';
        return `${dot}<circle cx="${number.x}" cy="${number.y}" r="12" fill="#ffffff" stroke="#202020" stroke-width="2"/><text x="${number.x}" y="${number.y + 5}" text-anchor="middle">${number.id}</text>`;
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

function nodalPlacement(id, entry, sourcePort, at, angle = 0, mirrorY = false, mirrorX = false) {
    const symbol = symbolForSchematicEntry(entry);
    const source = symbol.ports[sourcePort - 1];
    const transformed = point => transformedPoint(point, source, at, angle, mirrorX, mirrorY);
    return {
        id, symbol: entry.part.symbol || entry.part.kind, part: entry.part,
        ...(entry.part.kind === 'nodal' ? {portCount: entry.nodes.length} : {}),
        rotation: angle, ...(mirrorX ? {mirrorX: true} : {}), mirrorY,
        ports: symbol.ports.map((point, index) => ({port: index + 1, node: entry.nodes[index], at: transformed(point)})),
        at: at.slice(), sourcePort
    };
}

function hasShapeBoard(name) {
    return Object.prototype.hasOwnProperty.call(schematicShapeBoards, name);
}

function requestedShape(options) {
    if (options.shapes === undefined) return null;
    const shapes = options.shapes;
    if (Array.isArray(shapes) && shapes.length === 1 &&
        (['series', 'ladder', 'powerDivider'].includes(shapes[0]) ||
            hasShapeBoard(shapes[0]))) return shapes[0];
    if (Array.isArray(shapes) && shapes.length && shapes.every(shape => shape &&
        hasShapeBoard(shape.name) && [shape.from, shape.to].every(boundary =>
            Number.isInteger(boundary) || Array.isArray(boundary) && boundary.length &&
            boundary.every(Number.isInteger) && new Set(boundary).size === boundary.length))) {
        return shapes.map(shape => ({name: shape.name, from: shape.from, to: shape.to}));
    }
    const boardShapes = Object.keys(schematicShapeBoards).map(name => `"${name}"`);
    const acceptedShapes = [...new Set(['"series"', '"ladder"', '"powerDivider"',
        ...boardShapes])];
    throw new TypeError(`schematic() shapes accepts ${acceptedShapes.join(', ')}, or ` +
        'node-bounded shape sections with scalar or array from/to nodes.');
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
    const portsByNode = new Map(nodeIds.map(node => [node, []]));
    const externalByNode = new Map(nodeIds.map(node => [node, []]));
    for (const placement of placements) for (const port of placement.ports) {
        portsByNode.get(port.node)?.push(`${placement.id}.${port.port}`);
    }
    for (const port of externalPorts) externalByNode.get(port.node)?.push(port.port);
    return {
        parts: placements.map(placement => ({id: placement.id, type: placement.symbol,
            nodes: placement.ports.map(port => port.node), value: placement.part.value ?? null,
            impedance: placement.part.impedance ?? null, length: placement.part.length ?? null})),
        connections: nodeIds.map(node => ({node, ports: portsByNode.get(node),
            externalPorts: externalByNode.get(node)})),
        loopAnalysis: nodalLoopAnalysis(root)
    };
}

function treeLayoutBounds(placement) {
    const symbol = placement.symbol === 'nodal' ? nodalBlockSymbol(placement.portCount) :
        schematicSymbols[placement.symbol];
    return transformedBounds(symbol.bodyBounds, symbol.ports[placement.sourcePort - 1],
        placement.at, placement.rotation, placement.mirrorY, placement.mirrorX);
}

function treeNodeCandidates(point, reach = 60) {
    const offsets = [[0, -40], [0, 40], [40, 0], [-40, 0],
        [0, -60], [0, 60], [60, 0], [-60, 0]];
    for (let distance = 80; distance <= reach; distance += 20) {
        offsets.push([0, -distance], [0, distance], [distance, 0], [-distance, 0]);
    }
    return offsets.map(([dx, dy], index) => ({x: point[0] + dx, y: point[1] + dy,
        bounds: circleBounds(point[0] + dx, point[1] + dy), cost: 40 + index * 4}));
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

function buildInterpretedBoardModel(root, shapeDefinition, digits, flipVertical = false) {
    if (flipVertical) shapeDefinition = {...shapeDefinition,
        transform: {...shapeDefinition.transform, mirrorY: !shapeDefinition.transform?.mirrorY}};
    const counters = {};
    const result = interpretSchematicBoard(root, shapeDefinition, {
        boards: schematicShapeBoards,
        bounds: treeLayoutBounds,
        preview: nodalPlacement.bind(null, ''),
        symbol: symbolForSchematicEntry,
        placement(entry, inputPort, at, angle, mirrorY, mirrorX) {
            return nodalPlacement(flowPartId(entry.part, counters), entry,
                inputPort, at, angle, mirrorY, mirrorX);
        }
    });
    if (!result) return null;
    shapeDefinition = result.definition || shapeDefinition;
    const {placements, wires, nodePoints, externalPorts} = result;
    const {board} = shapeDefinition;
    const labelTasks = placements.map(placement => {
        const label = componentLabel(placement.part, placement.id, digits);
        const bounds = treeLayoutBounds(placement);
        const center = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
        const offset = placement.boardTile.labelOffset || board.componentLabelOffset;
        return {text: label, candidates: labelCandidates(label, bounds,
            offset ? [center[0] + offset[0], center[1] + offset[1]] : undefined)};
    });
    const nodeIds = [...new Set(root.components.flatMap(entry => entry.nodes)
        .concat(root.externalNodes))];
    if (nodeIds.some(node => !nodePoints.has(node))) return null;
    const nodeTasks = nodeIds.map(node => ({candidates: treeNodeCandidates(nodePoints.get(node), shapeDefinition.automatic ? 240 : 60)}));
    const portTasks = externalPorts.map(port => ({text: `Port ${port.port}`, candidates:
        labelCandidates(`Port ${port.port}`, circleBounds(...port.at, 4),
            board.portLabelOffset ? [port.at[0] + board.portLabelOffset[0],
                port.at[1] + board.portLabelOffset[1]] : undefined)}));
    const placementsBounds = placements.map(treeLayoutBounds);
    if (placementsBounds.some((bounds, index) => placementsBounds.slice(index + 1)
        .some(other => intersects(bounds, other, GRID)))) return null;
    const fixedBounds = placementsBounds.concat(wires.flatMap(wire => wire.points.slice(1)
        .map((point, index) => segmentBounds([wire.points[index], point], 4))));
    let choices;
    try {
        choices = chooseAnnotations(nodeTasks.concat(labelTasks, portTasks), fixedBounds);
    } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        // Dense terminal groups can exhaust the bounded beam for a valid
        // guided board too. Reuse the shared spacing fallback rather than
        // reporting an electrical/shape mismatch for an annotation failure.
        choices = chooseSpacedAnnotations(nodeTasks.concat(labelTasks, portTasks), fixedBounds);
    }
    const nodes = nodeIds.map((node, index) => ({id: node, at: nodePoints.get(node),
        numberAt: [choices[index].x, choices[index].y]}));
    const annotationOffset = nodeIds.length;
    const annotations = labelTasks.concat(portTasks).map((task, index) => ({text: task.text,
        at: [choices[annotationOffset + index].x, choices[annotationOffset + index].y]}));
    const boxes = boardBoxes(placements, wires, externalPorts, board);
    if (!boxes) return null;
    const allPoints = placements.flatMap(placement => placement.ports.map(port => port.at))
        .concat(wires.flatMap(wire => wire.points), nodes.flatMap(node => [node.at, node.numberAt]),
            annotations.map(label => label.at), placementsBounds.flatMap(bounds =>
                [[bounds[0], bounds[1]], [bounds[2], bounds[3]]]));
    const minX = Math.floor((Math.min(...allPoints.map(point => point[0])) - 100) / GRID) * GRID;
    const minY = Math.floor((Math.min(...allPoints.map(point => point[1])) - 100) / GRID) * GRID;
    const maxX = Math.ceil((Math.max(...allPoints.map(point => point[0])) + 100) / GRID) * GRID;
    const maxY = Math.ceil((Math.max(...allPoints.map(point => point[1])) + 100) / GRID) * GRID;
    const graph = {kind: 'rf-nodal', layout: shapeDefinition.layout || shapeDefinition.name,
        ...(!shapeDefinition.automatic ? {shape: shapeDefinition.name} : {}),
        ...(shapeDefinition.variant ? {pattern: shapeDefinition.variant} : {}),
        ...(result.sections ? {shapes: result.sections.map(({name, from, to}) => ({name, from, to}))} : {}),
        cells: result.cells ?? placements.length, viewBox: [minX, minY, maxX - minX, maxY - minY],
        components: placements, nodes, wires, ...(result.junctions ? {junctions: result.junctions} : {}), crossings: result.crossings || wireCrossings(wires), labels: annotations, externalPorts,
        board: {grid: GRID, interpreter: 'ORI', version: shapeDefinition.version,
            ...(result.sections ? {sections: result.sections} : {}),
            ...(result.regions ? {regions: result.regions} : {}), boxes}};
    return {graph, topology: flowTopology(root, placements, externalPorts)};
}

function boardWireCenter(points) {
    const segments = points.slice(1).map((point, index) => [points[index], point]);
    segments.sort((left, right) =>
        (Math.abs(right[1][0] - right[0][0]) + Math.abs(right[1][1] - right[0][1])) -
        (Math.abs(left[1][0] - left[0][0]) + Math.abs(left[1][1] - left[0][1])));
    const [start, finish] = segments[0];
    return [0, 1].map(axis => Math.round((start[axis] + finish[axis]) / (2 * GRID)) * GRID);
}

function boardWireBounds(points) {
    const halfWidth = GRID / 2;
    const x = points.map(point => point[0]);
    const y = points.map(point => point[1]);
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const minY = Math.min(...y);
    const maxY = Math.max(...y);
    if (minY === maxY) return [minX, minY - halfWidth, maxX, maxY + halfWidth];
    if (minX === maxX) return [minX - halfWidth, minY, maxX + halfWidth, maxY];
    return [minX - halfWidth, minY - halfWidth, maxX + halfWidth, maxY + halfWidth];
}

function boardBoxes(placements, wires, externalPorts, board) {
    const terminals = placements.flatMap(placement => placement.ports.map(port => ({
        component: placement.id,
        port: port.port,
        node: port.node
    }))).concat(externalPorts.map(port => ({
        externalPort: port.port,
        node: port.node
    })));
    const terminalsByComponent = new Map();
    const terminalsByNode = new Map();
    for (const terminal of terminals) {
        if (terminal.component !== undefined) {
            if (!terminalsByComponent.has(terminal.component)) terminalsByComponent.set(terminal.component, []);
            terminalsByComponent.get(terminal.component).push(terminal);
        }
        if (!terminalsByNode.has(terminal.node)) terminalsByNode.set(terminal.node, []);
        terminalsByNode.get(terminal.node).push(terminal);
    }
    const wiresByTile = new Map();
    for (const wire of wires) {
        const id = wire.boardTile?.id;
        if (id === undefined) continue;
        if (!wiresByTile.has(id)) wiresByTile.set(id, []);
        wiresByTile.get(id).push(wire);
    }
    const componentBoxes = placements.map(placement => ({
        kind: 'component',
        tile: placement.boardTile,
        id: placement.id,
        symbol: placement.symbol,
        bounds: treeLayoutBounds(placement),
        terminals: terminalsByComponent.get(placement.id) || []
    }));
    const cornerIds = new Set();
    const wireBoxes = wires.flatMap(wire => {
        const corner = wire.boardTile?.kind === 'cornerWire';
        if (corner && cornerIds.has(wire.boardTile.id)) return [];
        if (corner) cornerIds.add(wire.boardTile.id);
        const segments = corner ? wiresByTile.get(wire.boardTile.id) || [] : [wire];
        if (corner && (segments.length !== 2 || segments.some(segment => segment.node !== wire.node))) return [];
        const points = corner ? [segments[0].points[0], segments[0].points[1], segments[1].points[1]] : wire.points;
        return [{kind: corner ? 'cornerWire' : 'wire', tile: wire.boardTile, node: wire.node,
            points, bounds: boardWireBounds(points),
            ...(corner ? {} : {nodeDot: boardWireCenter(points)}),
            terminals: terminalsByNode.get(wire.node) || []}];
    });
    if (componentBoxes.some(box => box.tile?.kind !== 'component') ||
        wireBoxes.some(box => !['wire', 'cornerWire'].includes(box.tile?.kind) ||
        box.terminals.length < 2 ||
        box.points.slice(1).reduce((length, point, index) => length +
            Math.abs(point[0] - box.points[index][0]) +
            Math.abs(point[1] - box.points[index][1]), 0) !== box.tile.length)) return null;
    const wiredNodes = new Set(wireBoxes.map(box => box.node));
    if (terminals.some(terminal => !wiredNodes.has(terminal.node))) return null;
    return componentBoxes.concat(wireBoxes);
}

function buildNodalModel(root, options, digits) {
    if (options.view && options.view !== 'detail') {
        throw new TypeError('schematic() nodal circuits currently support only the detail view.');
    }
    const shape = requestedShape(options);
    if (shape) {
        if (Array.isArray(shape)) {
            const definition = {name: 'composite', layout: 'board-composition', version: 1,
                sections: shape, board: {grid: GRID}};
            const model = buildInterpretedBoardModel(root, definition, digits, options.flipVertical);
            if (!model) throw new RangeError('schematic() network does not fit the requested board sections.');
            return model;
        }
        if (hasShapeBoard(shape)) {
            const definition = schematicShapeBoards[shape];
            const model = buildInterpretedBoardModel(root, definition, digits, options.flipVertical);
            if (!model) throw new RangeError(`schematic() network does not match the "${shape}" pattern.`);
            return model;
        }
        throw new RangeError(`schematic() has no board definition for "${shape}".`);
    }
    const generic = buildInterpretedBoardModel(root, schematicShapeBoards.generic, digits, options.flipVertical);
    if (!generic) throw new RangeError('ORI could not finish the generic board drawing.');
    return generic;
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

function detectedShapes(circuit) {
    return detectSchematicShapes(circuit, schematicShapeBoards, {symbol: symbolForSchematicEntry});
}

function buildSchematicModel(circuit, options = {}, detected = detectedShapes(circuit)) {
    if (options.shapes === undefined) {
        const grouped = groupedSchematicShapes(circuit?._schematic, schematicShapeBoards,
            {symbol: symbolForSchematicEntry}, true);
        if (grouped || detected) options = {...options, ...(grouped || detected)};
    }
    if (options.flipVertical !== undefined && typeof options.flipVertical !== 'boolean') {
        throw new TypeError('schematic() flipVertical must be boolean.');
    }
    const digits = schematicSignificantDigits(options);
    const dots = schematicDots(options.dots);
    const shape = requestedShape(options);
    if (circuit?.transmitter && circuit.circuit) {
        if (options.flipVertical) throw new TypeError('schematic() flipVertical requires an ORI board layout.');
        if (shape && shape !== 'series') {
            throw new RangeError(`schematic() signal path does not match the "${shape}" shape.`);
        }
        const model = buildSignalFlowModel(circuit, options, digits);
        if (shape) model.graph.shape = shape;
        return {...model, detected, dots};
    }
    const root = circuit && circuit._schematic;
    if (!root) throw new TypeError('schematic() needs components with schematic metadata.');
    if (root.kind === 'nodal') return {...buildNodalModel(root, options, digits), detected, dots};
    if (root.kind === 'component' && schematicSymbols[root.symbol]?.ports.length !== 2) {
        const portCount = schematicSymbols[root.symbol].ports.length;
        const nodes = Array.from({length: portCount}, (_, index) => index + 1);
        return {...buildNodalModel({kind: 'nodal', components: [{part: root, nodes}],
            externalNodes: nodes}, options, digits), detected, dots};
    }
    const shownRoot = drawingRoot(root, options.view || 'detail');
    if (options.flipVertical) throw new TypeError('schematic() flipVertical requires an ORI board layout.');
    if (shape && shape !== 'series') {
        throw new RangeError(`schematic() network does not match the "${shape}" shape.`);
    }
    const parts = flattenCascade(shownRoot, []);
    const layout = annotateLayout(placeComponents(parts, digits));
    const graph = buildSchematicGraph(shownRoot, layout, layoutViewBox(layout));
    if (shape) graph.shape = shape;
    return {layout, graph, topology: buildSchematicTopology(graph), detected, dots};
}

function renderNodalSvg(model) {
    const {graph, dots} = model;
    const [minX, minY, width, height] = graph.viewBox;
    const wires = graph.wires.map(wire => `<path d="${wire.points.map((point, index) =>
        `${index ? 'L' : 'M'}${point[0]} ${point[1]}`).join(' ')}"/>`).join('');
    const crossovers = (graph.crossings || []).map(([x, y]) =>
        `<rect x="${x - 8}" y="${y - 7}" width="16" height="14" fill="#ffffff" stroke="none"/>` +
        `<path d="M${x - 10} ${y} L${x + 10} ${y}"/>`).join('');
    const junctions = graph.wires.filter(wire => wire.points.length > 2).map(wire => {
        const point = wire.points[wire.points.length - 1];
        return schematicDot(point, 'junction');
    }).join('');
    const branchDots = (graph.junctions || []).map(junction =>
        schematicDot(junction.at, 'junction')).join('');
    const ports = dots.ports ? graph.externalPorts.map(port => schematicDot(port.at, 'port')).join('') : '';
    const symbols = graph.components.map(placement => {
        const symbol = placement.symbol === 'nodal' ? nodalBlockSymbol(placement.portCount) :
            schematicSymbols[placement.symbol];
        const source = symbol.ports[placement.sourcePort - 1];
        const scaleX = placement.mirrorX ? -1 : 1;
        const scaleY = placement.mirrorY ? -1 : 1;
        const transform = `translate(${placement.at[0]} ${placement.at[1]}) rotate(${placement.rotation}) ` +
            `scale(${scaleX} ${scaleY}) translate(${-source[0]} ${-source[1]})`;
        const terminals = dots.terminals ? symbol.ports.map(point => schematicDot(point, 'terminal')).join('') : '';
        return `<g transform="${transform}" fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbol.geometry}${terminals}</g>`;
    }).join('');
    const nodes = graph.nodes.map(node => (!dots.nodes || graph.showNodeDots === false ? '' :
        schematicDot(node.at, 'node')) +
        `<circle cx="${node.numberAt[0]}" cy="${node.numberAt[1]}" r="12" fill="#ffffff" stroke="#202020" stroke-width="2"/>` +
        `<text x="${node.numberAt[0]}" y="${node.numberAt[1] + 5}" text-anchor="middle"` +
        `${String(node.id).length > 2 ? ' font-size="10"' : ''}>${escapeXml(node.id)}</text>`).join('');
    const labels = graph.labels.map(label => `<text x="${label.at[0]}" y="${label.at[1]}" text-anchor="middle">${escapeXml(label.text)}</text>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" role="img" aria-label="Nodal nPort schematic"><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/><g fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${wires}${crossovers}</g><g fill="#202020" font-family="Arial, Helvetica, sans-serif" font-size="16">${symbols}${junctions}${branchDots}${ports}${nodes}${labels}</g></svg>`;
}

function renderSchematicSvg(model) {
    if (model.graph.kind === 'rf-nodal') return renderNodalSvg(model);
    const {layout} = model;
    const [minX, minY, width, height] = model.graph.viewBox;
    const wires = layout.wires.map(([start, end]) =>
        `<path d="M${start[0]} ${start[1]} L${end[0]} ${end[1]}"/>`).join('');
    const symbols = layout.placements.map(placement => renderSymbol(placement, model.dots)).join('');
    const labels = layout.labels.concat(layout.externalLabels).map(label =>
        `<text x="${label.x}" y="${label.y}" text-anchor="middle">${escapeXml(label.text)}</text>`).join('');
    const description = model.graph.kind === 'signal-flow' ? 'Signal path schematic' :
        model.graph.kind === 'rf-series' ? 'Series of two-port networks' :
            'Cascaded nPort schematic';
    const metadata = model.graph.kind === 'rf-series' ?
        `<title>Series of two-port networks</title><desc>${description}</desc>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" role="img" aria-label="${description}">${metadata}<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/><g fill="none" stroke="#202020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${wires}</g><g fill="#202020" font-family="Arial, Helvetica, sans-serif" font-size="16">${symbols}${renderNodes(layout, model.dots)}${labels}</g></svg>`;
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

function mountSchematic(circuit, options = {}, detected) {
    const model = buildSchematicModel(circuit, options, detected);
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
    return {svg, graph: model.graph, topology: model.topology, detected: model.detected, error: null};
}

function schematicErrorMount(options) {
    if (typeof options.mount !== 'string') return options.mount || document.body;
    try { return document.querySelector(options.mount) || document.body; }
    catch (error) { return document.body; }
}

function reportSchematicFailure(error, options, detected) {
    const failure = error instanceof Error ? error : new Error(String(error));
    console.error('Schematic could not be drawn:', failure);
    try {
        if (typeof document !== 'undefined') {
            const mount = schematicErrorMount(options);
            const message = document.createElement('div');
            message.setAttribute('role', 'alert');
            message.style.fontFamily = 'Arial, Helvetica, sans-serif';
            message.style.padding = '12px';
            message.style.border = '1px solid currentColor';
            message.textContent = `Schematic could not be drawn: ${failure.message}`;
            (mount || document.body)?.appendChild(message);
        }
    } catch (displayError) {
        console.error('Schematic error message could not be mounted:', displayError);
    }
    return {svg: null, graph: null, topology: null, detected, error: failure};
}

export function schematic(circuit, options = {}) {
    let detected = null;
    try {
        detected = detectedShapes(circuit);
        return mountSchematic(circuit, options, detected);
    } catch (error) {
        return reportSchematicFailure(error, options || {}, detected);
    }
}
