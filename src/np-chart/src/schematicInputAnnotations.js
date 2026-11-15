// Modified: 2026-11-14
import {drawingError} from './schematicInputParser';

function union(boxes) {
    return [Math.min(...boxes.map(box => box[0])), Math.min(...boxes.map(box => box[1])),
        Math.max(...boxes.map(box => box[2])), Math.max(...boxes.map(box => box[3]))];
}

function sides(position, vertical = false) {
    return position ? [position] : vertical ? ['right', 'left', 'above', 'below'] : ['above', 'below', 'right', 'left'];
}

function arrowLabelAt(at, side, text) {
    const [x, y] = at, halfWidth = Math.ceil(text.length * 9 / 2);
    return side === 'below' ? [x, y + 30] : side === 'above' ? [x, y - 20] :
        side === 'left' ? [x - halfWidth - 20, y + 6] : [x + halfWidth + 20, y + 6];
}

function intersects(a, b, gap = 8) {
    return a[0] < b[2] + gap && a[2] > b[0] - gap && a[1] < b[3] + gap && a[3] > b[1] - gap;
}

function rectangleEdges(rectangles) {
    return rectangles.flatMap(item => {
        const [x, y, right, bottom] = item.bounds;
        return [[x, y, right, y], [right, y, right, bottom], [x, bottom, right, bottom], [x, y, x, bottom]];
    });
}

// Group by geometric row/column and annotation role, never by label spelling
// or component identity. A candidate contains all members, so the shared beam
// search must accept or move the entire aligned group.
function clearBoxes(boxes, occupied) {
    return boxes.every((box, index) => !occupied.some(other => intersects(box, other)) &&
        !boxes.slice(index + 1).some(other => intersects(box, other)));
}

function alignedCandidates(tasks, axis, occupied) {
    const available = tasks.map(task => task.candidates.filter(candidate => clearBoxes([candidate.bounds], occupied)));
    const coordinates = [...new Set(available[0].map(candidate => axis === 0 ? candidate.x : candidate.y))];
    const options = [];
    for (const coordinate of coordinates) {
        let states = [{members: [], cost: 0}];
        for (let index = 0; index < tasks.length && states.length; index++) {
            const candidates = available[index].filter(candidate => (axis === 0 ? candidate.x : candidate.y) === coordinate)
                .sort((a, b) => a.cost - b.cost).slice(0, 16);
            const next = [];
            for (const state of states) for (const candidate of candidates) {
                if (clearBoxes([candidate.bounds], state.members.map(member => member.bounds))) {
                    next.push({members: state.members.concat({...candidate, task: tasks[index]}), cost: state.cost + candidate.cost});
                }
            }
            states = next.sort((a, b) => a.cost - b.cost).slice(0, 32);
        }
        options.push(...states.filter(state => state.members.length === tasks.length));
    }
    return options;
}

function chooseAligned(tasks, occupied, geometry) {
    const groups = new Map();
    for (const task of tasks) {
        const key = `${task.role}:${task.axis}:${task.anchor[task.axis]}:${task.family}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(task);
    }
    const grouped = [...groups.values()].map(members => ({candidates: alignedCandidates(members, members[0].axis, occupied)}));
    const choices = geometry.choose(grouped, occupied), result = new Map();
    for (const choice of choices) for (const member of choice.members) result.set(member.task, member);
    return result;
}

function wireAxis(graph, node) {
    const [x, y] = node.at;
    const horizontal = graph.wires.some(wire => wire.node === node.id && wire.points.slice(1).some((end, index) => {
        const start = wire.points[index];
        return start[1] === y && end[1] === y && x >= Math.min(start[0], end[0]) && x <= Math.max(start[0], end[0]);
    }));
    return horizontal ? 1 : 0;
}

function nodeCandidates(at, axis) {
    const choices = [];
    for (let distance = 40; distance <= 1200; distance += 20) {
        const offsets = axis === 1 ? [[0, -distance], [0, distance], [distance, 0], [-distance, 0]] :
            [[distance, 0], [-distance, 0], [0, -distance], [0, distance]];
        offsets.forEach(([dx, dy], rank) => {
            const x = at[0] + dx, y = at[1] + dy;
            choices.push({x, y, bounds: [x - 12, y - 12, x + 12, y + 12], cost: distance + rank * 20});
        });
    }
    return choices;
}

function portCandidates(text, at, side, geometry) {
    if (side !== 'left' && side !== 'right') return annotationCandidates(text, at,
        side === 'top' ? 'above' : side === 'bottom' ? 'below' : undefined, geometry);
    const halfWidth = Math.ceil(text.length * 9 / 2), choices = [];
    for (let distance = 20; distance <= 1200; distance += 20) {
        for (const shift of [40, 60, 20, 80, 0, 100, -20, 120, -40, 140, -60, 160, -80, 180, -100, 200]) {
            const x = at[0] + (side === 'left' ? -1 : 1) * (distance + halfWidth), y = at[1] + shift;
            choices.push({x, y, bounds: geometry.textBounds(text, x, y), cost: distance + Math.abs(shift - 40)});
        }
    }
    return choices;
}

function annotationCandidates(text, at, position, geometry, arrow) {
    const choices = [];
    const width = Math.ceil(text.length * 9 / 40) * 20, normals = {above: [0, -1], below: [0, 1], left: [-1, 0], right: [1, 0]};
    for (const [rank, side] of sides(position, arrow?.vertical).entries()) {
        for (let distance = 40; distance <= 1200; distance += 20) {
            for (const shift of [0, -10, 10, -20, 20]) {
                const normal = normals[side];
                const x = at[0] + normal[0] * (distance + (arrow ? 0 : width)) + (normal[1] ? shift : 0);
                const y = at[1] + normal[1] * distance + (normal[0] ? shift : 0);
                const labelAt = arrow ? arrowLabelAt([x, y], side, text) : [x, y];
                const lineBox = arrow ? [x - (arrow.vertical ? 6 : arrow.length / 2),
                    y - (arrow.vertical ? arrow.length / 2 : 6), x + (arrow.vertical ? 6 : arrow.length / 2),
                    y + (arrow.vertical ? arrow.length / 2 : 6)] : null;
                const bounds = lineBox ? union([lineBox, geometry.textBounds(text, ...labelAt)]) : geometry.textBounds(text, ...labelAt);
                choices.push({x, y, side, bounds, cost: distance + rank * 20 + Math.abs(shift)});
            }
        }
    }
    return choices;
}

function rectangle(annotation, graph, geometry) {
    const part = graph.components.find(part => part.id === annotation.around), index = graph.components.indexOf(part);
    const body = geometry.bounds(part), caption = graph.labels[index];
    const bounds = union([body, geometry.textBounds(caption.text, ...caption.at)]);
    if (annotation.extendTo) {
        const horizontal = graph.wires.filter(wire => wire.node === annotation.extendTo.node &&
            wire.points[0][1] === wire.points.at(-1)[1]);
        if (!horizontal.length) drawingError(0, `node ${annotation.extendTo.node} has no bottom horizontal segment.`);
        bounds[3] = Math.max(bounds[3], ...horizontal.map(wire => wire.points[0][1]));
    }
    const padding = annotation.padding ?? 20;
    return {...annotation, bounds: bounds.map((value, axis) =>
        axis < 2 ? Math.floor((value - padding) / 10) * 10 : Math.ceil((value + padding) / 10) * 10)};
}

function arrowWire(annotation, graph) {
    const [id, number] = annotation.toward.split('.');
    const part = graph.components.find(part => part.id === id);
    const terminal = part.ports.find(port => number ? port.port === Number(number) : port.node === annotation.node);
    const wires = graph.wires.filter(wire => wire.node === annotation.node && wire.boardTile.kind === 'wire');
    wires.sort((a, b) => Math.min(...a.points.map(point => Math.abs(point[0] - terminal.at[0]) + Math.abs(point[1] - terminal.at[1]))) -
        Math.min(...b.points.map(point => Math.abs(point[0] - terminal.at[0]) + Math.abs(point[1] - terminal.at[1]))));
    const wire = wires[0], [start, finish] = wire.points;
    const vertical = start[0] === finish[0], axis = vertical ? 1 : 0;
    const center = start.map((value, index) => Math.round((value + finish[index]) / 20) * 10);
    const direction = Math.sign(terminal.at[axis] - center[axis]) || 1;
    return {center, vertical, direction, length: 20};
}

export function annotateSchematicInput(model, parsed, geometry) {
    const {graph} = model, rectangles = parsed.annotations.filter(item => item.type === 'rectangle')
        .map(item => rectangle(item, graph, geometry));
    const captions = graph.labels.slice(0, graph.components.length);
    const nodeTasks = graph.nodes.map(node => {
        const axis = wireAxis(graph, node);
        return {role: 'node', family: '', axis, anchor: node.at, node,
            candidates: nodeCandidates(node.at, axis)};
    });
    const portTasks = graph.externalPorts.map((port, index) => {
        const side = port.side, axis = side === 'top' || side === 'bottom' ? 0 : 1;
        const label = graph.labels[graph.components.length + index];
        return {role: 'port', family: side === 'top' || side === 'bottom' ? 'vertical' : 'horizontal', axis,
            anchor: port.at, label, candidates: portCandidates(label.text, port.at, side, geometry)};
    });
    const tasks = parsed.annotations.filter(item => ['label', 'arrow'].includes(item.type)).map(annotation => {
        const arrow = annotation.type === 'arrow' ? arrowWire(annotation, graph) : null;
        const at = arrow?.center || graph.nodes.find(node => node.id === annotation.node).at;
        const position = annotation.position;
        const axis = position === 'left' || position === 'right' || (!position && arrow?.vertical) ? 0 : 1;
        return {annotation, arrow, role: annotation.type, axis, anchor: at,
            family: `${position || 'auto'}:${arrow?.vertical || false}`,
            candidates: annotationCandidates(annotation.label, at, position, geometry, arrow)};
    });
    const occupied = graph.components.map(geometry.bounds)
        .concat(captions.map(label => geometry.textBounds(label.text, ...label.at)),
            graph.wires.map(wire => geometry.wireBounds(wire.points)), rectangleEdges(rectangles));
    const choices = chooseAligned(nodeTasks.concat(portTasks, tasks), occupied, geometry);
    for (const task of nodeTasks) {
        const choice = choices.get(task);
        task.node.numberAt = [choice.x, choice.y];
    }
    for (const task of portTasks) {
        const choice = choices.get(task);
        task.label.at = [choice.x, choice.y];
    }
    const annotations = rectangles.concat(tasks.map(task => {
        const choice = choices.get(task), at = [choice.x, choice.y];
        if (!task.arrow) return {...task.annotation, at, bounds: choice.bounds};
        const {vertical, direction, length} = task.arrow, vector = vertical ? [0, direction] : [direction, 0];
        return {...task.annotation, bounds: choice.bounds, labelAt: arrowLabelAt(at, choice.side, task.annotation.label),
            start: at.map((value, axis) => value - vector[axis] * length / 2),
            end: at.map((value, axis) => value + vector[axis] * length / 2)};
    }));
    graph.annotations = annotations;
    const extra = annotations.map(item => item.bounds)
        .concat(graph.labels.map(label => geometry.textBounds(label.text, ...label.at)),
            graph.nodes.map(node => [node.numberAt[0] - 12, node.numberAt[1] - 12, node.numberAt[0] + 12, node.numberAt[1] + 12]))
        .map(box => [box[0] - 40, box[1] - 40, box[2] + 40, box[3] + 40]);
    const [x, y, width, height] = graph.viewBox;
    const extent = union([[x, y, x + width, y + height], ...extra]);
    const left = Math.floor(extent[0] / 10) * 10, top = Math.floor(extent[1] / 10) * 10;
    graph.viewBox = [left, top, Math.ceil(extent[2] / 10) * 10 - left, Math.ceil(extent[3] / 10) * 10 - top];
    return model;
}

export function renderSchematicInputAnnotations(annotations, escapeXml) {
    return (annotations || []).map((item, index) => {
        let content;
        if (item.type === 'rectangle') {
            const [x, y, right, bottom] = item.bounds;
            const dash = item.style === 'dotted' ? ' stroke-dasharray="1 7" stroke-linecap="round"' :
                item.style === 'dashed' ? ' stroke-dasharray="8 6"' : '';
            content = `<rect x="${x}" y="${y}" width="${right - x}" height="${bottom - y}" fill="none" stroke="#202020" stroke-width="2"${dash}/>`;
        } else if (item.type === 'arrow') {
            const [x, y] = item.end, dx = Math.sign(x - item.start[0]), dy = Math.sign(y - item.start[1]);
            content = `<path d="M${item.start[0]} ${item.start[1]} L${x} ${y} M${x - dx * 8 - dy * 5} ${y - dy * 8 + dx * 5} L${x} ${y} L${x - dx * 8 + dy * 5} ${y - dy * 8 - dx * 5}" fill="none" stroke="#202020" stroke-width="2"/>` +
                `<text x="${item.labelAt[0]}" y="${item.labelAt[1]}" text-anchor="middle">${escapeXml(item.label)}</text>`;
        } else content = `<text x="${item.at[0]}" y="${item.at[1]}" text-anchor="middle">${escapeXml(item.label)}</text>`;
        return `<g id="annotation-${index + 1}" data-annotation="${item.type}">${content}</g>`;
    }).join('');
}
