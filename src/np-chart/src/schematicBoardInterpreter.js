// Modified: 2026-11-07
import {layoutAutomaticBoard} from './schematicBoardGraph';
import {composeSchematicBoards} from './schematicBoardComposition';

// Shared board operations. This module never selects a layout by shape name.
const DIRECTIONS = {right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1]};

function boardError(message) {
    throw new TypeError(`Schematic board: ${message}`);
}

function acceptsEntry(entry, predicate) {
    return (!predicate.portCount || entry.nodes.length === predicate.portCount) &&
        (!predicate.portCounts || predicate.portCounts.includes(entry.nodes.length)) &&
        (!predicate.symbols || predicate.symbols.includes(entry.part.symbol));
}

function boardPortPairs(entry, geometry, predicate = {}) {
    if (predicate.portPairs) {
        if (!Array.isArray(predicate.portPairs) || predicate.portPairs.some(pair =>
            !Array.isArray(pair) || pair.length !== 2 || pair[0] === pair[1] ||
            pair.some(port => !Number.isInteger(port) || port < 1 || port > entry.nodes.length))) {
            boardError('path port pairs must name two distinct component terminals.');
        }
        return predicate.portPairs;
    }
    if (entry.nodes.length === 2) return [[1, 2], [2, 1]];
    const symbol = geometry.symbol(entry), through = symbol.flow?.throughPorts;
    if (through) return [through, through.slice().reverse()];
    const bounds = symbol.bodyBounds;
    const center = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
    // A junction without declared through ports may offer several straight
    // pairs. Derive opposite pairs from canonical geometry, never an RF name.
    return symbol.ports.flatMap((a, input) => symbol.ports.flatMap((b, output) => {
        if (input === output) return [];
        const va = a.map((value, axis) => value - center[axis]);
        const vb = b.map((value, axis) => value - center[axis]);
        return va[0] * vb[1] === va[1] * vb[0] && va[0] * vb[0] + va[1] * vb[1] < 0 ?
            [[input + 1, output + 1]] : [];
    }));
}

function traceBoardPath(root, rule, adjacency, geometry, excluded = new Set()) {
    const start = rule.from.node ?? root.externalNodes[rule.from.externalPort - 1];
    const finish = rule.to?.externalPort ? root.externalNodes[rule.to.externalPort - 1] : undefined;
    if (start === undefined || start === finish) return null;
    // Iterative search avoids overflowing the JS stack on long repeated sections.
    const pending = [{node: start, path: [], used: new Set(excluded), visited: new Set()}];
    while (pending.length) {
        const state = pending.pop();
        if (state.node === finish) {
            if (state.path.length >= (rule.minimum ?? 1)) return state.path;
            continue;
        }
        if (state.visited.has(state.node)) continue;
        const visited = new Set([...state.visited, state.node]);
        for (const terminal of adjacency.get(state.node) || []) {
            const {index, inputPort} = terminal;
            const entry = root.components[index];
            if (state.used.has(index)) continue;
            if (rule.until && acceptsEntry(entry, rule.until) &&
                state.path.length >= (rule.minimum ?? 1)) {
                return state.path.concat({index, inputPort, outputPort: null});
            }
            if (!acceptsEntry(entry, rule.through)) continue;
            for (const [input, outputPort] of boardPortPairs(entry, geometry, rule.through)) {
                if (input !== inputPort) continue;
                pending.push({node: entry.nodes[outputPort - 1],
                    path: state.path.concat({index, inputPort, outputPort}), visited,
                    used: new Set([...state.used, index])});
            }
        }
    }
    return null;
}

function unusedBoardPorts(root, path) {
    return path.flatMap((part, order) => root.components[part.index].nodes.flatMap((node, index) =>
        index + 1 === part.inputPort || index + 1 === part.outputPort ? [] :
            [{index: part.index, port: index + 1, node, order}]));
}

function traceBoardLink(root, anchor, ports, rule, adjacency, used) {
    let current = {index: anchor.index, inputPort: anchor.port};
    const parts = [], visited = new Set([anchor.index]);
    while (true) {
        const node = root.components[current.index].nodes[current.inputPort - 1];
        const other = adjacency.get(node)?.find(end =>
            end.index !== current.index || end.inputPort !== current.inputPort);
        if (!other) return null;
        const end = ports.find(port => port.index === other.index && port.port === other.inputPort);
        if (end) return end.order > anchor.order && parts.length >= (rule.minimum ?? 1) ?
            {anchor, end, parts} : null;
        const entry = root.components[other.index];
        if (used.has(other.index) || visited.has(other.index) || entry.nodes.length !== 2 ||
            !acceptsEntry(entry, rule.through)) return null;
        visited.add(other.index);
        parts.push({...other, outputPort: 3 - other.inputPort});
        current = {index: other.index, inputPort: 3 - other.inputPort};
    }
}

function bindBoardLinks(root, match, bindings, adjacency, used) {
    const occupied = new Set();
    for (const rule of match.connections || []) {
        if (rule.from !== 'unusedPorts' || !bindings[rule.on] || !rule.through) {
            boardError('connections need a bound path, unused ports and a through predicate.');
        }
        const ports = unusedBoardPorts(root, bindings[rule.on]), links = [];
        for (const anchor of ports) {
            if (occupied.has(`${anchor.index}:${anchor.port}`)) continue;
            const link = traceBoardLink(root, anchor, ports, rule, adjacency, used);
            if (!link || occupied.has(`${link.end.index}:${link.end.port}`)) continue;
            link.parts.forEach(part => used.add(part.index));
            occupied.add(`${anchor.index}:${anchor.port}`);
            occupied.add(`${link.end.index}:${link.end.port}`);
            links.push(link);
        }
        if (links.length < (rule.minimumConnections ?? 0)) return null;
        bindings[rule.bind] = links;
    }
    return occupied;
}

function bindBoardPaths(root, match, adjacency, geometry) {
    const bindings = {}, used = new Set();
    for (const rule of match.paths) {
        if (!rule.bind || !rule.from?.externalPort || !rule.to?.externalPort || !rule.through) {
            boardError('a path needs a binding, endpoints and a through predicate.');
        }
        const path = traceBoardPath(root, rule, adjacency, geometry, used);
        if (!path) return null;
        bindings[rule.bind] = path;
        path.forEach(part => used.add(part.index));
        if (rule.coverAllComponents && used.size !== root.components.length) return null;
    }
    const occupied = bindBoardLinks(root, match, bindings, adjacency, used);
    if (!occupied) return null;
    for (const rule of match.attachments || []) {
        if (rule.from !== 'unusedPorts' || !bindings[rule.on] || !rule.until) {
            boardError('attachments need a bound path, unused ports and an end predicate.');
        }
        const branches = [];
        for (const part of bindings[rule.on]) {
            const entry = root.components[part.index];
            for (let port = 1; port <= entry.nodes.length; port++) {
                if (port === part.inputPort || port === part.outputPort) continue;
                if (occupied.has(`${part.index}:${port}`)) continue;
                const path = traceBoardPath(root, {...rule,
                    from: {node: entry.nodes[port - 1]}}, adjacency, geometry, used);
                if (!path) return null;
                path.forEach(step => used.add(step.index));
                branches.push({anchor: {index: part.index, port},
                    parts: path.slice(0, -1), termination: [path.at(-1)]});
            }
        }
        if (branches.length < (rule.minimumBranches ?? 0)) return null;
        bindings[rule.bind] = branches;
    }
    if (match.coverAllComponents && used.size !== root.components.length) return null;
    return bindings;
}

function expandBoardTiles(template, bindings) {
    const tiles = [];
    for (const tile of template) {
        if (tile.kind === 'wire') {
            tiles.push({...tile});
        } else if (tile.kind === 'component') {
            if (tile.between && tile.between.kind !== 'wire') {
                boardError('repeated components need a wire between them.');
            }
            const parts = bindings[tile.source];
            if (!Array.isArray(parts) || !parts.length) return null;
            if (!['one', 'oneOrMore'].includes(tile.repeat) ||
                tile.repeat === 'one' && parts.length !== 1) {
                boardError('component repeat must be one or oneOrMore and fit its binding.');
            }
            parts.forEach((part, index) => {
                if (index && tile.between) tiles.push({...tile.between});
                tiles.push({...tile, part});
            });
        } else boardError(`unknown tile kind "${tile.kind}".`);
    }
    return tiles.map((tile, index) => ({...tile, id: `tile:${index}`}));
}

function onGrid(point, grid) {
    return Array.isArray(point) && point.length === 2 &&
        point.every(value => Number.isFinite(value) && value % grid === 0);
}

function rotateBoardVector(vector, angle, mirrorX, mirrorY) {
    const x = vector[0] * (mirrorX ? -1 : 1), y = vector[1] * (mirrorY ? -1 : 1);
    return angle === 0 ? [x, y] : angle === 90 ? [-y, x] :
        angle === 180 ? [-x, -y] : [y, -x];
}

function pointsAlong(vector, direction) {
    return vector[0] * direction[0] + vector[1] * direction[1] > 0 &&
        vector[0] * direction[1] === vector[1] * direction[0];
}

function orientBoardPart(entry, part, at, direction, targets, geometry, orientation = {}) {
    const symbol = geometry.symbol(entry);
    const input = symbol.ports[part.inputPort - 1];
    const output = part.outputPort ? symbol.ports[part.outputPort - 1] : null;
    const center = output ? [(input[0] + output[0]) / 2, (input[1] + output[1]) / 2] :
        [(symbol.bodyBounds[0] + symbol.bodyBounds[2]) / 2,
            (symbol.bodyBounds[1] + symbol.bodyBounds[3]) / 2];
    let inputVector = entry.nodes.length === 2 ?
        (part.inputPort === 1 ? symbol.entry || [1, 0] :
            (symbol.exit || [1, 0]).map(value => -value)) :
        [center[0] - input[0], center[1] - input[1]];
    let outputVector = entry.nodes.length === 2 ?
        (part.inputPort === 1 ? symbol.exit || [1, 0] :
            (symbol.entry || [1, 0]).map(value => -value)) : inputVector;
    if (orientation.terminals !== undefined) {
        if (orientation.terminals !== 'leads') boardError('unknown terminal orientation rule.');
        const lead = symbolTerminalDirection(symbol, part.inputPort);
        outputVector = output && symbolTerminalDirection(symbol, part.outputPort);
        if (!lead || !outputVector) return null;
        inputVector = lead.map(value => -value);
    }
    const advance = orientation.advance && DIRECTIONS[orientation.advance];
    if (orientation.advance && (!advance || advance[0] * direction[0] + advance[1] * direction[1] !== 0)) {
        boardError('an advance direction must be perpendicular to path flow.');
    }
    for (const mirrorX of [false, true]) {
        for (const mirrorY of [false, true]) {
            for (const angle of [0, 90, 180, 270]) {
                const step = output && rotateBoardVector(output.map((value, axis) => value - input[axis]),
                    angle, mirrorX, mirrorY);
                if (advance && (!step || step[0] * advance[0] + step[1] * advance[1] <= 0)) continue;
                if (!pointsAlong(rotateBoardVector(inputVector, angle, mirrorX, mirrorY), direction) ||
                    targets.some(target => {
                        const port = symbol.ports[target.port - 1];
                        return !pointsAlong(rotateBoardVector([port[0] - center[0],
                            port[1] - center[1]], angle, mirrorX, mirrorY), target.direction);
                    })) continue;
                return {placement: geometry.placement(entry, part.inputPort, at,
                    angle, mirrorY, mirrorX),
                direction: rotateBoardVector(outputVector, angle, mirrorX, mirrorY).map(Math.sign)};
            }
        }
    }
    return null;
}

function boardWireDot(start, end, grid) {
    return start.map((value, axis) => Math.round((value + end[axis]) / (2 * grid)) * grid);
}

function appendBoardWire(result, previous, input, tile) {
    if (previous.node !== input.node) return false;
    const points = [previous.at.slice(), input.at.slice()];
    if (points[0][0] === points[1][0] && points[0][1] === points[1][1] ||
        points[0][0] !== points[1][0] && points[0][1] !== points[1][1]) return false;
    result.wires.push({node: input.node, points, boardTile: tile});
    result.nodePoints.set(input.node, boardWireDot(previous.at, input.at, result.grid));
    return true;
}

function placeBoardTiles(root, board, bindings, geometry, result, start, end, targets, pathId) {
    const {grid} = board;
    if (!(grid > 0) || !onGrid(start.at, grid) || !DIRECTIONS[board.direction]) {
        boardError('grid, origin and direction must describe an orthogonal board.');
    }
    let tiles = expandBoardTiles(board.tiles, bindings);
    if (!tiles) return null;
    if (end?.at) {
        tiles = fitBoardTiles(root, tiles, board, start, end, geometry);
        if (!tiles) return null;
    }
    let previous = start;
    let cursor = start.at.slice();
    let direction = DIRECTIONS[board.direction].slice();
    let pendingWire = null;
    let terminated = false;
    for (const tile of tiles) {
        if (terminated) boardError('a termination must end its board path.');
        if (tile.kind === 'wire') {
            const length = tile.length ?? board.wireBoxLength;
            if (pendingWire || !(length > 0) || length % grid !== 0) {
                boardError('each wire needs a positive grid length between components or ports.');
            }
            pendingWire = {...tile, id: `${pathId}:${tile.id}`, length};
            cursor = [cursor[0] + direction[0] * length, cursor[1] + direction[1] * length];
            continue;
        }
        if (!pendingWire) boardError('a component needs a wire before it.');
        const {part} = tile;
        const entry = root.components[part.index];
        const oriented = orientBoardPart(entry, part, cursor, direction,
            targets.get(part.index) || [], geometry, tile.orientation);
        if (!oriented) return null;
        const placement = oriented.placement;
        if (!placement.ports.every(port => onGrid(port.at, grid))) return null;
        placement.boardTile = {kind: tile.kind, role: tile.role, id: `${pathId}:${tile.id}`,
            ...(board.componentLabelOffset ? {labelOffset: board.componentLabelOffset} : {})};
        if (!appendBoardWire(result, previous, placement.ports[part.inputPort - 1], pendingWire)) return null;
        if (result.byIndex.has(part.index)) return null;
        result.placements.push(placement);
        result.byIndex.set(part.index, placement);
        if (part.outputPort) {
            previous = placement.ports[part.outputPort - 1];
            cursor = previous.at.slice();
            direction = oriented.direction;
        } else terminated = true;
        pendingWire = null;
    }
    if (end) {
        if (!pendingWire) boardError('the output port needs a wire.');
        if (!appendBoardWire(result, previous, {...end, at: cursor}, pendingWire)) return null;
        if (end.at && (cursor[0] !== end.at[0] || cursor[1] !== end.at[1])) return null;
        if (end.port && !end.at) result.externalPorts.push({...end, at: cursor.slice()});
    } else if (!terminated || pendingWire) return null;
    return result;
}

function placeBoardPaths(root, definition, bindings, geometry) {
    const board = boardPathSpacing(root, definition, bindings, geometry);
    if (!board) return null;
    if (board.spacing !== 'attachments') return placeBoundBoardPaths(root, board, bindings, geometry);
    if (!geometry.preview || !(board.clearance >= board.grid) || board.clearance % board.grid !== 0) {
        boardError('attachment spacing needs preview geometry and grid clearance.');
    }
    const preview = placeBoundBoardPaths(root, board, bindings, {...geometry, placement: geometry.preview});
    if (!preview) return null;
    const ranks = new Map();
    let rank = 0;
    for (const tile of expandBoardTiles(board.tiles, bindings)) {
        if (tile.kind === 'wire' && tile.length === undefined) rank++;
        if (tile.kind === 'component') ranks.set(tile.part.index, rank);
    }
    for (const attachment of board.attachments || []) for (const branch of bindings[attachment.source]) {
        for (const part of branch.parts.concat(branch.termination)) ranks.set(part.index, ranks.get(branch.anchor.index));
    }
    const direction = DIRECTIONS[board.direction], axis = direction[0] ? 0 : 1, across = 1 - axis;
    const entries = [...preview.byIndex].map(([index, placement]) =>
        ({rank: ranks.get(index), bounds: geometry.bounds(placement)}));
    let growth = 0;
    for (const a of entries) for (const b of entries) {
        if (!(b.rank > a.rank) || a.bounds[across + 2] + board.clearance <= b.bounds[across] ||
            b.bounds[across + 2] + board.clearance <= a.bounds[across]) continue;
        const end = direction[axis] > 0 ? a.bounds[axis + 2] : -a.bounds[axis];
        const start = direction[axis] > 0 ? b.bounds[axis] : -b.bounds[axis + 2];
        growth = Math.max(growth, Math.ceil((end + board.clearance - start) /
            (b.rank - a.rank) / board.grid) * board.grid);
    }
    return placeBoundBoardPaths(root, {...board, wireBoxLength: board.wireBoxLength + growth,
        attachments: (board.attachments || []).map(attachment =>
            ({wireBoxLength: board.wireBoxLength, ...attachment}))}, bindings, geometry);
}

function placeBoundBoardPaths(root, board, bindings, geometry) {
    const result = {grid: board.grid, placements: [], wires: [], nodePoints: new Map(),
        byIndex: new Map(), externalPorts: [], bindings};
    const start = {port: board.from.externalPort,
        node: root.externalNodes[board.from.externalPort - 1], at: board.origin.slice()};
    const end = {port: board.to.externalPort, node: root.externalNodes[board.to.externalPort - 1]};
    result.externalPorts.push(start);
    const targets = new Map();
    for (const connection of board.connections || []) {
        if (!DIRECTIONS[connection.direction]) boardError('unknown connection direction.');
        for (const link of bindings[connection.source] || []) {
            for (const {index, port} of [link.anchor, link.end]) {
                if (!targets.has(index)) targets.set(index, []);
                targets.get(index).push({port, direction: DIRECTIONS[connection.direction]});
            }
        }
    }
    for (const attachment of board.attachments || []) {
        if (attachment.direction === 'terminal') continue;
        if (!DIRECTIONS[attachment.direction]) boardError('unknown attachment direction.');
        for (const branch of bindings[attachment.source] || []) {
            const {index, port} = branch.anchor;
            if (!targets.has(index)) targets.set(index, []);
            targets.get(index).push({port, direction: DIRECTIONS[attachment.direction]});
        }
    }
    if (!placeBoardTiles(root, board, bindings, geometry, result, start, end, targets, 'main')) return null;
    for (const attachment of board.attachments || []) {
        const branches = bindings[attachment.source];
        if (!branches) boardError(`unknown attachment binding "${attachment.source}".`);
        for (let index = 0; index < branches.length; index++) {
            const branch = branches[index];
            const placement = result.byIndex.get(branch.anchor.index);
            const anchor = placement?.ports[branch.anchor.port - 1];
            const direction = attachment.direction === 'terminal' ?
                placedBoardTerminalDirection(root.components[branch.anchor.index], placement,
                    branch.anchor.port, geometry) : attachment.direction;
            if (!anchor || !placeBoardTiles(root, {...board, ...attachment, direction, attachments: []},
                branch, geometry, result, anchor, null, new Map(), `${attachment.source}:${index}`)) return null;
        }
    }
    return placeBoardLinks(root, board, bindings, geometry, result) ? result : null;
}

function boardPathSpacing(root, definition, bindings, geometry) {
    const board = definition.board;
    if (!board.connections?.length) return board;
    const tiles = expandBoardTiles(board.tiles, bindings), positions = new Map();
    if (!tiles) return null;
    let cursor = 0, flexible = 0, growth = 0;
    for (const tile of tiles) {
        if (tile.kind === 'wire') {
            cursor += tile.length ?? board.wireBoxLength;
            if (tile.length === undefined) flexible++;
        } else {
            const symbol = geometry.symbol(root.components[tile.part.index]);
            const a = symbol.ports[tile.part.inputPort - 1], b = symbol.ports[tile.part.outputPort - 1];
            if (!b || a[0] !== b[0] && a[1] !== b[1]) return null;
            const span = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
            positions.set(tile.part.index, {at: cursor, flexible, a, b, symbol, span});
            cursor += span;
        }
    }
    for (const connection of board.connections) {
        for (const link of bindings[connection.source] || []) {
            const [start, end] = [link.anchor, link.end].map(anchor => {
                const position = positions.get(anchor.index), point = position.symbol.ports[anchor.port - 1];
                const projection = point.reduce((sum, value, axis) =>
                    sum + (value - position.a[axis]) * (position.b[axis] - position.a[axis]), 0) / position.span;
                return {...position, at: position.at + projection};
            });
            const path = expandBoardTiles(connection.tiles, link);
            const span = path && boardTileSpan(root, path, {...board, ...connection}, geometry);
            if (span === null || span === undefined) return null;
            const required = span - (end.at - start.at), count = end.flexible - start.flexible;
            if (required > 0 && count <= 0) return null;
            if (required > 0) growth = Math.max(growth, Math.ceil(required / count / board.grid) * board.grid);
        }
    }
    return {...board, wireBoxLength: board.wireBoxLength + growth,
        attachments: (board.attachments || []).map(attachment =>
            ({wireBoxLength: board.wireBoxLength, ...attachment}))};
}

function placeBoardLinks(root, board, bindings, geometry, result) {
    for (const connection of board.connections || []) {
        const outward = DIRECTIONS[connection.direction], flow = DIRECTIONS[board.direction];
        if (!outward || !flow || outward[0] * flow[0] + outward[1] * flow[1] !== 0 ||
            !(connection.clearance >= 2 * board.grid) || connection.clearance % board.grid !== 0) {
            boardError('connections need a perpendicular direction and positive grid clearance.');
        }
        const axis = flow[0] ? 0 : 1, perpendicular = 1 - axis;
        const bounds = result.placements.map(geometry.bounds);
        const edge = outward[perpendicular] < 0 ? Math.min(...bounds.map(box => box[perpendicular])) :
            Math.max(...bounds.map(box => box[perpendicular + 2]));
        const links = bindings[connection.source], tracks = [];
        if (!links) boardError('unknown connection binding.');
        let bodySize = 0;
        for (const link of links) for (const part of link.parts) {
            const body = geometry.symbol(root.components[part.index]).bodyBounds;
            bodySize = Math.max(bodySize, body[2] - body[0], body[3] - body[1]);
        }
        const pitch = Math.ceil((bodySize + connection.clearance) / board.grid) * board.grid;
        const ordered = links.map((link, index) => ({link, index, span: Math.abs(
            result.byIndex.get(link.end.index).ports[link.end.port - 1].at[axis] -
            result.byIndex.get(link.anchor.index).ports[link.anchor.port - 1].at[axis])}))
            .sort((a, b) => a.span - b.span);
        // Short intervals take the inner tracks first. An enclosing connection
        // then clears them instead of forcing its vertical legs through them.
        for (const {link, index} of ordered) {
            const start = result.byIndex.get(link.anchor.index).ports[link.anchor.port - 1];
            const end = result.byIndex.get(link.end.index).ports[link.end.port - 1];
            const interval = [Math.min(start.at[axis], end.at[axis]), Math.max(start.at[axis], end.at[axis])];
            let track = tracks.findIndex(row => row.every(other =>
                interval[1] + connection.clearance <= other[0] || other[1] + connection.clearance <= interval[0]));
            if (track < 0) { track = tracks.length; tracks.push([]); }
            tracks[track].push(interval);
            const height = Math.round(edge / board.grid) * board.grid + outward[perpendicular] * pitch * (track + 1);
            const from = {...start, at: start.at.slice()}, to = {...end, at: end.at.slice()};
            from.at[perpendicular] = to.at[perpendicular] = height;
            const wireStart = result.wires.length;
            const laneBoard = {...board, ...connection, direction: board.direction};
            if (!placeBoardTiles(root, laneBoard, link, geometry, result, from, to, new Map(),
                `${connection.source}:${index}`)) return false;
            const last = result.wires.pop(), [first] = result.wires.splice(wireStart, 1);
            if (!appendCornerBoardWire(result, start, {node: start.node, at: first.points[1]},
                axis === 0 ? 'verticalFirst' : 'horizontalFirst', board.grid, first.boardTile.id) ||
                !appendCornerBoardWire(result, {node: end.node, at: last.points[0]}, end,
                    axis === 0 ? 'horizontalFirst' : 'verticalFirst', board.grid, last.boardTile.id)) return false;
        }
    }
    return true;
}

// Expand repeated rows or named junction cells into slots and connections.
// Lanes, port locations and allowed component types come from the description.
function expandBoardSlots(board, anchorCount) {
    if (board.anchors) {
        if (board.anchors.length !== anchorCount) return null;
        const slots = board.anchors;
        if (new Set(slots.map(slot => slot.id)).size !== slots.length ||
            slots.some(slot => !onGrid(slot.cell, 1))) boardError('invalid named anchor cells.');
        const links = board.lanes.map(lane => {
            const from = slots.find(slot => slot.id === lane.from);
            const to = slots.find(slot => slot.id === lane.to);
            if (!from || !to || from === to || !DIRECTIONS[lane.direction]) {
                boardError('invalid named lane endpoints or direction.');
            }
            const delta = to.cell.map((value, axis) => value - from.cell[axis]);
            if (lane.route) {
                const firstAxis = lane.route === 'verticalFirst' ? 1 :
                    lane.route === 'horizontalFirst' ? 0 : -1;
                const lastAxis = 1 - firstAxis;
                if (firstAxis < 0 || !delta[0] || !delta[1] ||
                    DIRECTIONS[lane.direction][lastAxis] !== Math.sign(delta[lastAxis]) ||
                    DIRECTIONS[lane.fromSide]?.[firstAxis] !== Math.sign(delta[firstAxis])) {
                    boardError('turning lane directions conflict with its cells.');
                }
            } else if (!pointsAlong(delta, DIRECTIONS[lane.direction])) {
                boardError('lane direction conflicts with its cells.');
            }
            return {...lane, id: lane.name};
        });
        const ports = board.externalPorts;
        if (ports.some(port => !slots.some(slot => slot.id === port.slot) || !DIRECTIONS[port.side])) {
            boardError('invalid external port slot or side.');
        }
        return {slots, links, ports};
    }
    const columns = anchorCount / board.rows.length;
    if (!Number.isInteger(columns) || columns < board.minimumColumns) return null;
    const slots = board.rows.flatMap((row, y) => Array.from({length: columns}, (_, x) =>
        ({id: `${row.name}:${x}`, cell: [x, y], row: row.name, column: x, tile: row.tile})));
    const links = [];
    for (const lane of board.lanes) {
        if (!['adjacent', 'each'].includes(lane.columns) || !DIRECTIONS[lane.direction]) {
            boardError('a lane needs a column repetition and an orthogonal direction.');
        }
        for (let column = 0; column < columns - (lane.columns === 'adjacent' ? 1 : 0); column++) {
            const from = slots.find(slot => slot.row === lane.from && slot.column === column);
            const to = slots.find(slot => slot.row === lane.to &&
                slot.column === column + (lane.columns === 'adjacent' ? 1 : 0));
            if (!from || !to || from === to) boardError('invalid board lane endpoints.');
            const delta = [to.cell[0] - from.cell[0], to.cell[1] - from.cell[1]];
            if (!pointsAlong(delta, DIRECTIONS[lane.direction])) boardError('lane direction conflicts with its cells.');
            links.push({...lane, from: from.id, to: to.id, id: `${lane.name}:${column}`});
        }
    }
    const ports = board.externalPorts.map(port => {
        const column = port.column === 'first' ? 0 : port.column === 'last' ? columns - 1 : port.column;
        const slot = slots.find(item => item.row === port.row && item.column === column);
        if (!slot || !DIRECTIONS[port.side]) boardError('invalid external port cell or side.');
        return {...port, slot: slot.id};
    });
    return {slots, links, ports, columns};
}

function collectBoardConnections(root, match, adjacency) {
    const anchors = new Set(root.components.flatMap((entry, index) =>
        acceptsEntry(entry, match.anchors) ? [index] : []));
    const edges = [], seen = new Set(), used = new Set(anchors);
    for (const index of anchors) {
        const entry = root.components[index];
        for (let port = 1; port <= entry.nodes.length; port++) {
            if (root.externalNodes.includes(entry.nodes[port - 1])) continue;
            let current = {index, inputPort: port};
            const parts = [], visited = new Set([index]);
            while (true) {
                const node = root.components[current.index].nodes[current.inputPort - 1];
                const other = adjacency.get(node)?.find(end =>
                    end.index !== current.index || end.inputPort !== current.inputPort);
                if (!other) return null;
                if (anchors.has(other.index)) {
                    if (other.index === index || parts.length < match.minimumLaneParts) return null;
                    const key = [index, other.index].sort((a, b) => a - b).join(':');
                    if (!seen.has(key)) {
                        if (parts.some(part => used.has(part.index))) return null;
                        edges.push({a: index, aPort: port, b: other.index, bPort: other.inputPort, parts});
                        parts.forEach(part => used.add(part.index));
                        seen.add(key);
                    } else {
                        const prior = edges.find(edge => [edge.a, edge.b].sort((a, b) => a - b).join(':') === key);
                        if (prior.parts.length !== parts.length ||
                            !parts.every(part => prior.parts.some(item => item.index === part.index))) return null;
                    }
                    break;
                }
                const next = root.components[other.index];
                if (visited.has(other.index) || next.nodes.length !== 2 ||
                    !acceptsEntry(next, match.through)) return null;
                visited.add(other.index);
                parts.push({...other, outputPort: 3 - other.inputPort});
                current = {index: other.index, inputPort: 3 - other.inputPort};
            }
        }
    }
    if (!anchors.size || used.size !== root.components.length) return null;
    return {anchors: [...anchors], edges};
}

function assignBoardSlots(template, network, root, assigned = new Map(), used = new Set()) {
    if (assigned.size === template.slots.length) return assigned;
    let choice = null;
    for (const slot of template.slots) {
        if (assigned.has(slot.id)) continue;
        const links = template.links.filter(link => link.from === slot.id || link.to === slot.id);
        const ports = template.ports.filter(port => port.slot === slot.id);
        const candidates = network.anchors.filter(index => !used.has(index) &&
            root.components[index].nodes.length === links.length + ports.length &&
            ports.every(port => root.components[index].nodes.includes(root.externalNodes[port.port - 1])) &&
            links.every(link => {
                const neighbor = assigned.get(link.from === slot.id ? link.to : link.from);
                return neighbor === undefined || network.edges.some(edge =>
                    (edge.a === index && edge.b === neighbor || edge.b === index && edge.a === neighbor) &&
                    (!link.through || edge.parts.every(part => acceptsEntry(root.components[part.index], link.through))));
            }));
        if (!candidates.length) return null;
        if (!choice || candidates.length < choice.candidates.length) choice = {slot, candidates};
    }
    for (const index of choice.candidates) {
        const result = assignBoardSlots(template, network, root,
            new Map([...assigned, [choice.slot.id, index]]), new Set([...used, index]));
        if (result) return result;
    }
    return null;
}

function symbolBoardCenter(symbol) {
    if (symbol.flow?.throughPorts) {
        const [a, b] = symbol.flow.throughPorts.map(port => symbol.ports[port - 1]);
        return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    }
    return [(symbol.bodyBounds[0] + symbol.bodyBounds[2]) / 2,
        (symbol.bodyBounds[1] + symbol.bodyBounds[3]) / 2];
}

function boardPortReach(entry, port, geometry) {
    const symbol = geometry.symbol(entry), center = symbolBoardCenter(symbol);
    const point = symbol.ports[port - 1];
    return point[0] !== center[0] && point[1] !== center[1] ? null :
        Math.abs(point[0] - center[0]) + Math.abs(point[1] - center[1]);
}

function boardTileSpan(root, tiles, board, geometry) {
    let span = 0;
    for (const tile of tiles) {
        if (tile.kind === 'wire') span += tile.length ?? board.wireBoxLength;
        else {
            const symbol = geometry.symbol(root.components[tile.part.index]);
            const a = symbol.ports[tile.part.inputPort - 1], b = symbol.ports[tile.part.outputPort - 1];
            if (a[0] !== b[0] && a[1] !== b[1]) return null;
            span += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
        }
    }
    return span;
}

function fitBoardTiles(root, tiles, board, start, end, geometry) {
    const direction = DIRECTIONS[board.direction];
    const delta = [end.at[0] - start.at[0], end.at[1] - start.at[1]];
    if (!pointsAlong(delta, direction)) return null;
    const span = boardTileSpan(root, tiles, board, geometry);
    if (span === null) return null;
    const slack = Math.abs(delta[0]) + Math.abs(delta[1]) - span;
    if (slack < 0 || slack % board.grid !== 0 || tiles[0]?.kind !== 'wire' ||
        tiles.at(-1)?.kind !== 'wire') return null;
    const first = Math.floor(slack / (2 * board.grid)) * board.grid;
    return tiles.map((tile, index) => tile.kind === 'wire' ? {...tile,
        length: (tile.length ?? board.wireBoxLength) +
            (index === 0 ? first : index === tiles.length - 1 ? slack - first : 0)} : tile);
}

function orientBoardAnchor(entry, at, targets, geometry) {
    const symbol = geometry.symbol(entry), center = symbolBoardCenter(symbol);
    for (const mirrorX of [false, true]) {
        for (const mirrorY of [false, true]) {
            for (const angle of [0, 90, 180, 270]) {
                if (!targets.every(target => {
                    const point = symbol.ports[target.port - 1];
                    return pointsAlong(rotateBoardVector([point[0] - center[0], point[1] - center[1]],
                        angle, mirrorX, mirrorY), target.direction);
                })) continue;
                const offset = rotateBoardVector([symbol.ports[0][0] - center[0],
                    symbol.ports[0][1] - center[1]], angle, mirrorX, mirrorY);
                return geometry.placement(entry, 1, [at[0] + offset[0], at[1] + offset[1]],
                    angle, mirrorY, mirrorX);
            }
        }
    }
    return null;
}

// Each axis grows from measured lane spans. Turning lanes reserve a straight
// escape on their first axis and place their repeated tiles on the final axis.
function boardLanePitch(root, template, lanes, board, geometry) {
    if (board.spacing === 'largestArm') {
        const spans = lanes.map(lane => {
            const a = boardPortReach(root.components[lane.from], lane.startPort, geometry);
            const b = boardPortReach(root.components[lane.to], lane.endPort, geometry);
            const chain = lane.tiles && boardTileSpan(root, lane.tiles, board, geometry);
            return a === null || b === null || chain === null ? null : a + b + chain;
        });
        if (spans.includes(null)) return null;
        const pitch = Math.ceil(Math.max(...spans) / board.grid) * board.grid;
        return [pitch, pitch];
    }
    if (board.spacing !== 'byAxis') boardError('unknown connected-board spacing rule.');
    const pitch = [board.grid, board.grid];
    for (const lane of lanes) {
        const from = template.slots.find(slot => slot.id === lane.fromSlot);
        const to = template.slots.find(slot => slot.id === lane.toSlot);
        const delta = to.cell.map((value, axis) => Math.abs(value - from.cell[axis]));
        const a = boardPortReach(root.components[lane.from], lane.startPort, geometry);
        const b = boardPortReach(root.components[lane.to], lane.endPort, geometry);
        const chain = lane.tiles && boardTileSpan(root, lane.tiles, board, geometry);
        if (a === null || b === null || chain === null) return null;
        const axis = DIRECTIONS[lane.direction][0] ? 0 : 1;
        pitch[axis] = Math.max(pitch[axis], (b + chain + (lane.route ? 0 : a)) / delta[axis]);
        if (lane.route) pitch[1 - axis] = Math.max(pitch[1 - axis],
            (a + 2 * board.grid) / delta[1 - axis]);
    }
    return pitch.map(value => Math.ceil(value / board.grid) * board.grid);
}

function placeBoardLane(root, board, lane, geometry, result, start, end) {
    const laneBoard = {...board, direction: lane.direction, tiles: board.paths[lane.path]};
    if (!lane.route) return placeBoardTiles(root, laneBoard,
        {parts: lane.parts}, geometry, result, start, end, new Map(), lane.id);
    const corner = lane.route === 'verticalFirst' ? [start.at[0], end.at[1]] : [end.at[0], start.at[1]];
    const firstWireIndex = result.wires.length;
    if (!placeBoardTiles(root, laneBoard, {parts: lane.parts}, geometry, result,
        {...start, at: corner}, end, new Map(), lane.id)) return null;
    // Replace the first straight lead with the same shared corner-wire operation
    // used by named-slot boards; never add a fictitious component at the turn.
    const [firstWire] = result.wires.splice(firstWireIndex, 1);
    return appendCornerBoardWire(result, start, {node: start.node, at: firstWire.points[1]},
        lane.route, board.grid, firstWire.boardTile.id) ? result : null;
}

function placeBoardConnections(root, definition, adjacency, geometry) {
    const {board, match} = definition;
    const network = collectBoardConnections(root, match, adjacency);
    if (!network) return null;
    const template = expandBoardSlots(board, network.anchors.length);
    if (!template || template.links.length !== network.edges.length ||
        template.ports.length !== root.externalNodes.length ||
        new Set(template.ports.map(port => port.port)).size !== root.externalNodes.length) return null;
    const assigned = assignBoardSlots(template, network, root);
    if (!assigned) return null;
    const lanes = template.links.map(link => {
        const from = assigned.get(link.from), to = assigned.get(link.to);
        const edge = network.edges.find(item => item.a === from && item.b === to || item.b === from && item.a === to);
        const forward = edge.a === from;
        const parts = forward ? edge.parts : edge.parts.slice().reverse().map(part =>
            ({index: part.index, inputPort: part.outputPort, outputPort: part.inputPort}));
        return {...link, fromSlot: link.from, toSlot: link.to, from, to, startPort: forward ? edge.aPort : edge.bPort,
            endPort: forward ? edge.bPort : edge.aPort, parts,
            tiles: expandBoardTiles(board.paths[link.path], {parts})};
    });
    const pitch = boardLanePitch(root, template, lanes, board, geometry);
    if (!pitch || !onGrid(board.origin, board.grid)) return null;
    const result = {grid: board.grid, placements: [], wires: [], nodePoints: new Map(), byIndex: new Map(), externalPorts: [],
        ...(board.rows ? {cells: (board.rows.length - 1) * (template.columns - 1)} : {})};
    for (const slot of template.slots) {
        const index = assigned.get(slot.id), entry = root.components[index];
        const targets = lanes.flatMap(lane => lane.from === index ?
            [{port: lane.startPort, direction: DIRECTIONS[lane.fromSide || lane.direction]}] : lane.to === index ?
                [{port: lane.endPort, direction: DIRECTIONS[lane.direction].map(value => -value)}] : []);
        const ports = template.ports.filter(port => port.slot === slot.id);
        targets.push(...ports.map(port => ({port: entry.nodes.indexOf(root.externalNodes[port.port - 1]) + 1,
            direction: DIRECTIONS[port.side]})));
        const at = [board.origin[0] + slot.cell[0] * pitch[0], board.origin[1] + slot.cell[1] * pitch[1]];
        const placement = orientBoardAnchor(entry, at, targets, geometry);
        if (!placement || !placement.ports.every(port => onGrid(port.at, board.grid))) return null;
        placement.boardTile = {...slot.tile, id: slot.id, cell: slot.cell};
        result.placements.push(placement);
        result.byIndex.set(index, placement);
    }
    for (const lane of lanes) {
        const start = result.byIndex.get(lane.from).ports[lane.startPort - 1];
        const end = result.byIndex.get(lane.to).ports[lane.endPort - 1];
        if (!placeBoardLane(root, board, lane, geometry, result, start, end)) return null;
    }
    for (const port of template.ports) {
        const node = root.externalNodes[port.port - 1];
        const terminal = result.byIndex.get(assigned.get(port.slot)).ports.find(item => item.node === node);
        const direction = DIRECTIONS[port.side], length = board.externalPortLead.length;
        if (!(length > 0) || length % board.grid !== 0) boardError('invalid external lead length.');
        const end = {port: port.port, node, at: [terminal.at[0] + direction[0] * length,
            terminal.at[1] + direction[1] * length]};
        if (!appendBoardWire(result, terminal, end, {...board.externalPortLead, length,
            id: `port:${port.port}:lead`})) return null;
        result.externalPorts.push(end);
    }
    result.placements = root.components.map((_, index) => result.byIndex.get(index));
    return result.placements.includes(undefined) ? null : result;
}

// Named slots describe connection roles, not particular component instances.
function slotPortBindings(roles, count, selected = {}, used = new Set()) {
    const role = Object.keys(roles).find(key => selected[key] === undefined);
    if (!role) return Object.keys(selected).length === count ? [selected] : [];
    return roles[role].flatMap(port => Number.isInteger(port) && port >= 1 && port <= count && !used.has(port) ?
        slotPortBindings(roles, count, {...selected, [role]: port}, new Set([...used, port])) : []);
}

function slotEndpoint(root, endpoint, bindings) {
    if (endpoint.externalPort) return {node: root.externalNodes[endpoint.externalPort - 1]};
    const binding = bindings.get(endpoint.slot);
    return binding ? {node: root.components[binding.index].nodes[binding.ports[endpoint.port] - 1]} : null;
}

function bindBoardSlots(root, slots, wires, bindings = new Map(), used = new Set()) {
    if (bindings.size === slots.length) return used.size === root.components.length ? bindings : null;
    let choice = null;
    for (const slot of slots) {
        if (bindings.has(slot.name)) continue;
        const candidates = root.components.flatMap((entry, index) => {
            if (used.has(index) || !acceptsEntry(entry, slot)) return [];
            return slotPortBindings(slot.ports, entry.nodes.length).flatMap(ports => {
                const candidate = {index, ports};
                const tentative = new Map([...bindings, [slot.name, candidate]]);
                return wires.every(wire => {
                    const a = slotEndpoint(root, wire.from, tentative), b = slotEndpoint(root, wire.to, tentative);
                    return !a || !b || a.node === b.node;
                }) ? [candidate] : [];
            });
        });
        if (!candidates.length) return null;
        if (!choice || candidates.length < choice.candidates.length) choice = {slot, candidates};
    }
    for (const candidate of choice.candidates) {
        const result = bindBoardSlots(root, slots, wires,
            new Map([...bindings, [choice.slot.name, candidate]]), new Set([...used, candidate.index]));
        if (result) return result;
    }
    return null;
}

function symbolTerminalDirection(symbol, port) {
    const at = symbol.ports[port - 1];
    const lead = symbol.leads?.[port - 1];
    if (!lead) return null;
    const inside = lead.find(point => point[0] !== at[0] || point[1] !== at[1]);
    return inside ? [at[0] - inside[0], at[1] - inside[1]] : null;
}

function placedBoardTerminalDirection(entry, placement, port, geometry) {
    const lead = symbolTerminalDirection(geometry.symbol(entry), port);
    if (!lead || !placement) boardError('a terminal-directed attachment needs canonical lead geometry.');
    const direction = rotateBoardVector(lead, placement.rotation, placement.mirrorX, placement.mirrorY);
    const name = Object.keys(DIRECTIONS).find(key => pointsAlong(direction, DIRECTIONS[key]));
    if (!name) boardError('terminal lead must have an orthogonal direction.');
    return name;
}

function orientBoardSlot(entry, ports, tile, at, geometry) {
    const symbol = geometry.symbol(entry);
    for (const mirrorX of [false, true]) {
        for (const mirrorY of [false, true]) {
            for (const angle of [0, 90, 180, 270]) {
                const fits = Object.entries(tile.directions).every(([role, direction]) => {
                    const vector = symbolTerminalDirection(symbol, ports[role]);
                    if (!DIRECTIONS[direction]) boardError('unknown terminal direction.');
                    return vector && pointsAlong(rotateBoardVector(vector, angle, mirrorX, mirrorY), DIRECTIONS[direction]);
                });
                if (fits) return geometry.placement(entry, ports[tile.anchor], at, angle, mirrorY, mirrorX);
            }
        }
    }
    return null;
}

function placedSlotTerminal(reference, bindings, result) {
    const binding = bindings.get(reference.slot);
    return binding && result.byIndex.get(binding.index)?.ports[binding.ports[reference.port] - 1];
}

function appendCornerBoardWire(result, start, end, route, grid, id) {
    if (start.node !== end.node) return false;
    if (start.at[0] === end.at[0] || start.at[1] === end.at[1]) {
        const length = Math.abs(end.at[0] - start.at[0]) + Math.abs(end.at[1] - start.at[1]);
        return appendBoardWire(result, start, end, {kind: 'wire', id, length});
    }
    if (!['verticalFirst', 'horizontalFirst'].includes(route)) boardError('a bent wire needs its turn order.');
    const corner = route === 'verticalFirst' ? [start.at[0], end.at[1]] : [end.at[0], start.at[1]];
    const incoming = [Math.sign(corner[0] - start.at[0]), Math.sign(corner[1] - start.at[1])];
    const outgoing = [Math.sign(end.at[0] - corner[0]), Math.sign(end.at[1] - corner[1])];
    const lengths = [Math.abs(corner[0] - start.at[0]) + Math.abs(corner[1] - start.at[1]),
        Math.abs(end.at[0] - corner[0]) + Math.abs(end.at[1] - corner[1])];
    if (lengths.some(length => length < 2 * grid)) return false;
    const before = [corner[0] - incoming[0] * grid, corner[1] - incoming[1] * grid];
    const after = [corner[0] + outgoing[0] * grid, corner[1] + outgoing[1] * grid];
    if (!appendBoardWire(result, start, {node: start.node, at: before},
        {kind: 'wire', id: `${id}:entry`, length: lengths[0] - grid}) ||
        !appendBoardWire(result, {node: start.node, at: after}, end,
            {kind: 'wire', id: `${id}:exit`, length: lengths[1] - grid})) return false;
    // Render each corner segment as a plain stroke. The board records them as
    // one corner box, which carries no node dot and never touches a symbol.
    const tile = {kind: 'cornerWire', id: `${id}:corner`, length: 2 * grid};
    result.wires.push({node: start.node, points: [before, corner], boardTile: tile},
        {node: start.node, points: [corner, after], boardTile: tile});
    const longest = lengths[0] >= lengths[1] ? [start.at, before] : [after, end.at];
    result.nodePoints.set(start.node, boardWireDot(longest[0], longest[1], grid));
    return true;
}

function boardAlignmentPoint(reference, bindings, result) {
    if (reference.between) {
        if (!Array.isArray(reference.between) || reference.between.length !== 2) {
            boardError('a centerline midpoint needs two terminal roles.');
        }
        const points = reference.between.map(port => placedSlotTerminal({slot: reference.slot, port}, bindings, result)?.at);
        if (points.some(point => !point)) boardError('unknown centerline terminal.');
        return points[0].map((value, axis) => (value + points[1][axis]) / 2);
    }
    const terminal = placedSlotTerminal(reference, bindings, result);
    if (!terminal) boardError('unknown centerline terminal.');
    return terminal.at;
}

function alignBoardCenterlines(board, bindings, result) {
    const rules = board.centerlines || [];
    for (const rule of rules) {
        if (!['x', 'y'].includes(rule.axis) || !Array.isArray(rule.align) || !rule.align.length) {
            boardError('a centerline needs an x or y axis and alignment members.');
        }
    }
    // Centerline relations take precedence over initial board-cell offsets.
    // Iterate so a relation can refer to a component moved by another relation.
    for (let pass = 0; pass <= rules.length; pass++) {
        let moved = false;
        for (const rule of rules) {
            const axis = rule.axis === 'x' ? 0 : 1;
            const target = boardAlignmentPoint(rule.reference, bindings, result)[axis];
            for (const member of rule.align) {
                const delta = target - boardAlignmentPoint(member, bindings, result)[axis];
                if (!Number.isFinite(delta) || delta % board.grid !== 0) {
                    boardError('centerline alignment conflicts with the placement grid.');
                }
                if (!delta) continue;
                const placement = result.byIndex.get(bindings.get(member.slot).index);
                placement.at[axis] += delta;
                placement.ports.forEach(port => { port.at[axis] += delta; });
                moved = true;
            }
        }
        if (!moved) return;
    }
    // Reject incompatible relations rather than accepting the last one applied.
    if (rules.some(rule => {
        const axis = rule.axis === 'x' ? 0 : 1;
        const target = boardAlignmentPoint(rule.reference, bindings, result)[axis];
        return rule.align.some(member => boardAlignmentPoint(member, bindings, result)[axis] !== target);
    })) boardError('centerline relations conflict.');
}

function placeNamedBoardSlots(root, definition, geometry) {
    const {board, match} = definition;
    if (!onGrid(board.origin, board.grid)) boardError('invalid board origin or grid.');
    const bindings = bindBoardSlots(root, match.slots, board.wires);
    if (!bindings) return null;
    const result = {grid: board.grid, placements: [], wires: [], nodePoints: new Map(), byIndex: new Map(), externalPorts: []};
    const pending = board.components.slice();
    while (pending.length) {
        const index = pending.findIndex(tile => !tile.from || placedSlotTerminal(tile.from, bindings, result));
        if (index < 0) boardError('component positions contain an unresolved dependency.');
        const [tile] = pending.splice(index, 1);
        const binding = bindings.get(tile.slot);
        if (!binding || result.byIndex.has(binding.index)) boardError('invalid or repeated component slot.');
        const origin = tile.from ? placedSlotTerminal(tile.from, bindings, result).at : board.origin;
        const offset = tile.offset || tile.at;
        if (!Array.isArray(offset) || offset.length !== 2 || !offset.every(Number.isInteger)) {
            boardError('a component position needs two whole board-cell offsets.');
        }
        const at = origin.map((value, axis) => value + offset[axis] * board.grid);
        const placement = orientBoardSlot(root.components[binding.index], binding.ports, tile, at, geometry);
        if (!placement || !placement.ports.every(port => onGrid(port.at, board.grid))) return null;
        placement.boardTile = {kind: 'component', id: tile.slot, role: tile.role};
        result.placements.push(placement);
        result.byIndex.set(binding.index, placement);
    }
    alignBoardCenterlines(board, bindings, result);
    for (const port of board.externalPorts) {
        const terminal = placedSlotTerminal(port.from, bindings, result);
        if (!terminal || terminal.node !== root.externalNodes[port.port - 1] ||
            !DIRECTIONS[port.side] || !Number.isInteger(port.cells) || port.cells < 1) return null;
        const direction = DIRECTIONS[port.side];
        result.externalPorts.push({port: port.port, node: terminal.node,
            at: terminal.at.map((value, axis) => value + direction[axis] * port.cells * board.grid)});
    }
    if (result.externalPorts.length !== root.externalNodes.length ||
        new Set(result.externalPorts.map(port => port.port)).size !== root.externalNodes.length) return null;
    const endpoints = new Set();
    for (let index = 0; index < board.wires.length; index++) {
        const wire = board.wires[index];
        const ends = [wire.from, wire.to].map(endpoint => {
            const key = endpoint.externalPort ? `external:${endpoint.externalPort}` : `${endpoint.slot}:${endpoint.port}`;
            if (endpoints.has(key)) boardError('a terminal occurs in multiple wire boxes.');
            endpoints.add(key);
            return endpoint.externalPort ? result.externalPorts.find(port => port.port === endpoint.externalPort) :
                placedSlotTerminal(endpoint, bindings, result);
        });
        if (ends.includes(undefined) || !appendCornerBoardWire(result, ends[0], ends[1],
            wire.route, board.grid, `wire:${index}`)) return null;
    }
    if (endpoints.size !== root.components.reduce((sum, entry) => sum + entry.nodes.length, 0) +
        root.externalNodes.length || result.byIndex.size !== root.components.length) return null;
    result.placements = root.components.map((_, index) => result.byIndex.get(index));
    return result;
}

function reflectBoardPoint(point, mirrorX, mirrorY) {
    return [mirrorX ? -point[0] || 0 : point[0], mirrorY ? -point[1] || 0 : point[1]];
}

// Reflection acts on the complete bound geometry, before annotation placement.
// Reversing the rotation and toggling a local mirror composes a world reflection
// with the canonical symbol transform; numbered terminals never change roles.
function reflectBoardResult(result, definition, source) {
    const transform = definition.transform ?? {};
    if (typeof transform !== 'object' || Array.isArray(transform) || Object.entries(transform).some(([key, value]) =>
        !['mirrorX', 'mirrorY'].includes(key) || typeof value !== 'boolean')) {
        boardError('a board transform accepts boolean mirrorX and mirrorY only.');
    }
    const {mirrorX = false, mirrorY = false} = transform;
    const selected = result.definition || source;
    const board = {...selected.board};
    for (const key of ['componentLabelOffset', 'portLabelOffset']) {
        if (board[key]) board[key] = reflectBoardPoint(board[key], mirrorX, mirrorY);
    }
    for (const placement of result.placements) {
        placement.at = reflectBoardPoint(placement.at, mirrorX, mirrorY);
        placement.ports = placement.ports.map(port => ({...port,
            at: reflectBoardPoint(port.at, mirrorX, mirrorY)}));
        placement.rotation = mirrorX !== mirrorY ? (360 - placement.rotation) % 360 : placement.rotation;
        placement.mirrorX = !!placement.mirrorX !== mirrorX;
        placement.mirrorY = !!placement.mirrorY !== mirrorY;
        if (placement.boardTile.labelOffset) placement.boardTile = {...placement.boardTile,
            labelOffset: reflectBoardPoint(placement.boardTile.labelOffset, mirrorX, mirrorY)};
    }
    result.wires = result.wires.map(wire => ({...wire,
        points: wire.points.map(point => reflectBoardPoint(point, mirrorX, mirrorY))}));
    result.nodePoints = new Map([...result.nodePoints].map(([node, point]) =>
        [node, reflectBoardPoint(point, mirrorX, mirrorY)]));
    result.externalPorts = result.externalPorts.map(port => ({...port,
        at: reflectBoardPoint(port.at, mirrorX, mirrorY)}));
    if (result.junctions) result.junctions = result.junctions.map(junction => ({...junction,
        at: reflectBoardPoint(junction.at, mirrorX, mirrorY)}));
    if (result.crossings) result.crossings = result.crossings.map(point => reflectBoardPoint(point, mirrorX, mirrorY));
    return {...result, definition: {...selected, name: definition.name,
        layout: definition.layout || definition.name, board}};
}

export function interpretSchematicBoard(root, definition, geometry, references = []) {
    if (definition.version !== 1) boardError('unsupported language version.');
    if (references.includes(definition)) boardError('circular board reference.');
    if (definition.transform !== undefined && definition.use === undefined) {
        const {transform, ...source} = definition;
        const result = interpretSchematicBoard(root, source, geometry, references);
        return result ? reflectBoardResult(result, {name: definition.name, transform,
            layout: result.definition?.layout || source.layout || source.name}, source) : null;
    }
    if (definition.sections) return composeSchematicBoards(root, definition, geometry, interpretSchematicBoard);
    if (definition.use !== undefined) {
        if (typeof definition.use !== 'string' ||
            !Object.prototype.hasOwnProperty.call(geometry.boards || {}, definition.use)) {
            boardError('unknown referenced board.');
        }
        const source = geometry.boards[definition.use];
        const result = interpretSchematicBoard(root, source, geometry, [...references, definition]);
        return result ? reflectBoardResult(result, definition, source) : null;
    }
    if (definition.alternatives) {
        const {alternatives, ...primary} = definition;
        for (const choice of [primary, ...alternatives]) {
            const selected = {...choice, name: definition.name};
            const result = interpretSchematicBoard(root, selected, geometry, references);
            if (result) return {...result, definition: selected};
        }
        return null;
    }
    const {match} = definition;
    if (definition.board.automatic) {
        root.components.forEach(entry => {
            const symbol = geometry.symbol(entry);
            if (!symbol || symbol.ports.length !== entry.nodes.length) boardError('component symbol/port mismatch.');
        });
        // A complete unbranched chain can use the existing repeated tile
        // operation, including direction changes supplied by bend symbols.
        const adjacency = new Map();
        root.components.forEach((entry, index) => entry.nodes.forEach((node, port) => {
            if (!adjacency.has(node)) adjacency.set(node, []);
            adjacency.get(node).push({index, inputPort: port + 1});
        }));
        if (root.externalNodes.length === match.externalPortCount &&
            [...adjacency].every(([node, ends]) => ends.length +
                root.externalNodes.filter(value => value === node).length === match.terminalDegree)) {
            const bindings = bindBoardPaths(root, match, adjacency, geometry);
            if (bindings) {
                const path = placeBoardPaths(root, {...definition,
                    board: {...definition.board, direction: definition.board.flow}}, bindings, geometry);
                if (path) {
                    path.placements = root.components.map((_, index) => path.byIndex.get(index));
                    path.regions = [];
                    return path;
                }
            }
        }
        return layoutAutomaticBoard(root, definition, geometry);
    }
    if (root.externalNodes.length !== match.externalPortCount ||
        new Set(root.externalNodes).size !== root.externalNodes.length) return null;
    // A wire box joins two terminals. Junctions belong to component symbols.
    const adjacency = new Map();
    for (let index = 0; index < root.components.length; index++) {
        const entry = root.components[index];
        if (geometry.symbol(entry).ports.length !== entry.nodes.length) return null;
        entry.nodes.forEach((node, port) => {
            if (!adjacency.has(node)) adjacency.set(node, []);
            adjacency.get(node).push({index, inputPort: port + 1});
        });
    }
    for (const [node, terminals] of adjacency) {
        if (terminals.length + root.externalNodes.filter(value => value === node).length !== 2) return null;
    }
    if (root.externalNodes.some(node => !adjacency.has(node))) return null;
    if (match.slots) return placeNamedBoardSlots(root, definition, geometry);
    if (definition.board.rows || definition.board.anchors) return placeBoardConnections(root, definition, adjacency, geometry);
    const bindings = bindBoardPaths(root, match, adjacency, geometry);
    return bindings ? placeBoardPaths(root, definition, bindings, geometry) : null;
}
