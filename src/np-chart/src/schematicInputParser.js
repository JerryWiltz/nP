// Modified: 2026-11-14
import {schematicDrawingSymbols} from './schematicDrawingSymbols';
import {schematicSymbols} from './schematicSymbols';

export const drawingDirections = {right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1]};

export function drawingError(line, message) {
    throw new TypeError(`${line ? `Path line ${line}` : 'Schematic input'}: ${message}`);
}

function tokensForLine(text, line) {
    const tokens = []; let start = 0, depth = 0;
    for (let index = 0; index <= text.length; index++) {
        const character = text[index];
        if (character === '(' || character === '[') depth++;
        if (character === ')' || character === ']') depth--;
        if (depth < 0) drawingError(line, 'unmatched closing delimiter.');
        if (index === text.length || !depth && /\s/.test(character)) {
            if (index > start) tokens.push(text.slice(start, index));
            start = index + 1;
        }
    }
    if (depth) drawingError(line, 'unclosed value or terminal list.');
    return tokens;
}

function nodeToken(token, line) {
    if (!/^-?\d+$/.test(token || '') || !Number.isSafeInteger(Number(token))) drawingError(line, `expected a node number; received "${token ?? ''}".`);
    return Number(token);
}

function declaration(token, line) {
    const match = /^([A-Za-z_][\w-]*)=([A-Za-z_]\w*)(?:\(([\s\S]*)\))?(?:\[([\d,\s]+)\])?$/.exec(token);
    if (!match) drawingError(line, `invalid component declaration "${token}".`);
    const [, id, name, caption, list] = match;
    if (!Object.prototype.hasOwnProperty.call(schematicDrawingSymbols, name)) drawingError(line, `unknown symbol "${name}".`);
    const symbol = schematicDrawingSymbols[name], count = schematicSymbols[symbol].ports.length;
    const terminals = list === undefined ? null : list.split(',').map(value => Number(value.trim()));
    if (terminals && (terminals.length !== count || new Set(terminals).size !== count ||
        terminals.some(port => !Number.isInteger(port) || port < 1 || port > count))) {
        drawingError(line, `${name} requires ${count} distinct terminal assignments numbered 1 through ${count}.`);
    }
    if (!terminals && count > 2) drawingError(line, `${name} requires an explicit terminal list.`);
    return {id, name, symbol, caption, terminals, count, line};
}

function parseComponentLine(tokens, line, parts, declarations) {
    let node = nodeToken(tokens.shift(), line), previous = null;
    while (tokens.length) {
        const directions = [];
        while (Object.hasOwn(drawingDirections, tokens[0])) directions.push(tokens.shift());
        if (!directions.length && !previous) drawingError(line, 'a component needs an approach direction.');
        const part = declaration(tokens.shift() || '', line);
        if (declarations.has(part.id)) drawingError(line, `duplicate component "${part.id}".`);
        if (part.terminals) {
            const supplied = tokens.findIndex(token => !/^-?\d+$/.test(token));
            const available = supplied < 0 ? tokens.length : supplied;
            if (available < part.count) drawingError(line, `${part.name} requires ${part.count} terminal node assignments; received ${available}.`);
        }
        const assignments = part.terminals ? part.terminals.map(() => nodeToken(tokens.shift(), line)) :
            part.count === 1 ? [node] : [node, nodeToken(tokens.shift(), line)];
        part.nodes = new Array(part.count);
        (part.terminals || Array.from({length: part.count}, (_, index) => index + 1))
            .forEach((terminal, index) => { part.nodes[terminal - 1] = assignments[index]; });
        const approaches = part.nodes.flatMap((value, index) => value === node ? [index + 1] : []);
        if (approaches.length !== 1) drawingError(line, 'the approach node must identify exactly one component terminal.');
        part.inputPort = approaches[0];
        part.outputPort = part.count === 2 ? 3 - part.inputPort : null;
        part.directions = directions;
        part.previous = previous;
        part.mirror = tokens[0] === 'mirror';
        if (part.mirror) tokens.shift();
        parts.push(part); declarations.set(part.id, part);
        node = part.outputPort ? part.nodes[part.outputPort - 1] : null;
        previous = part.id;
        if (tokens.length && node === null) drawingError(line, 'end a multi-terminal or termination declaration on its own line.');
    }
}

export function drawingTerminal(reference, declarations, line = 0) {
    const match = /^([A-Za-z_][\w-]*)\.([1-9]\d*)$/.exec(reference || '');
    const part = match && declarations.get(match[1]), port = match && Number(match[2]);
    if (!part || port > part.count) drawingError(line, `unknown component terminal "${reference}".`);
    return {part, port};
}

function validateAnnotations(annotations, declarations, nodes) {
    const ports = new Set(), types = {
        label: ['type', 'node', 'label', 'position'],
        arrow: ['type', 'node', 'toward', 'label', 'position'],
        rectangle: ['type', 'around', 'extendTo', 'style', 'padding'],
        port: ['type', 'number', 'node', 'reference', 'side']
    };
    return annotations.map((annotation, index) => {
        const fail = message => drawingError(0, `annotation ${index + 1}: ${message}`);
        if (!annotation || !Object.hasOwn(types, annotation.type)) fail('unknown annotation type.');
        if (Object.keys(annotation).some(key => !types[annotation.type].includes(key))) fail('unknown annotation property.');
        if (annotation.type !== 'rectangle' && !nodes.has(annotation.node)) fail(`unknown node ${annotation.node}.`);
        if (['label', 'arrow'].includes(annotation.type) && typeof annotation.label !== 'string') fail('label must be text.');
        if (annotation.position !== undefined && !['above', 'below', 'left', 'right'].includes(annotation.position)) fail('invalid label position.');
        if (annotation.type === 'arrow') {
            const target = typeof annotation.toward === 'string' && annotation.toward.includes('.') ?
                drawingTerminal(annotation.toward, declarations) : null;
            const part = target?.part || declarations.get(annotation.toward);
            if (!part || (target ? part.nodes[target.port - 1] !== annotation.node : !part.nodes.includes(annotation.node))) {
                fail('arrow target must be a component or terminal on its node.');
            }
        }
        if (annotation.type === 'rectangle') {
            if (!declarations.has(annotation.around)) fail('unknown enclosing component.');
            if (annotation.extendTo && (Object.keys(annotation.extendTo).some(key => !['node', 'segment'].includes(key)) ||
                !nodes.has(annotation.extendTo.node) || annotation.extendTo.segment !== 'bottom')) fail('extendTo needs a known node and bottom segment.');
            if (annotation.padding !== undefined && (!Number.isFinite(annotation.padding) || annotation.padding < 10 || annotation.padding % 10)) fail('padding must be a positive multiple of 10.');
            if (annotation.style !== undefined && !['solid', 'dotted', 'dashed'].includes(annotation.style)) fail('unknown rectangle style.');
        }
        if (annotation.type === 'port') {
            if (!Number.isInteger(annotation.number) || annotation.number < 1 || ports.has(annotation.number)) fail('port number must be a unique positive integer.');
            ports.add(annotation.number);
            if (annotation.reference !== undefined && (!nodes.has(annotation.reference) || annotation.reference === annotation.node)) fail('reference must name a different known node.');
            if (annotation.side !== undefined && !['left', 'right', 'top', 'bottom'].includes(annotation.side)) fail('invalid port side.');
        }
        return {...annotation, ...(annotation.extendTo ? {extendTo: {...annotation.extendTo}} : {})};
    });
}

export function parseSchematicInput(input) {
    if (!input || !Array.isArray(input.paths) || !input.paths.length) drawingError(0, 'paths must be a nonempty array.');
    if (Object.keys(input).some(key => !['paths', 'annotations'].includes(key))) drawingError(0, 'unknown drawing-input property.');
    if (input.annotations !== undefined && !Array.isArray(input.annotations)) drawingError(0, 'annotations must be an array.');
    const parts = [], alignments = [], declarations = new Map();
    input.paths.forEach((text, index) => {
        const line = index + 1;
        if (typeof text !== 'string' || !text.trim()) drawingError(line, 'expected a nonempty path string.');
        const tokens = tokensForLine(text.trim(), line);
        if (['alignX', 'alignY'].includes(tokens[0])) {
            if (tokens.length < 3) drawingError(line, 'alignment needs at least two component terminals.');
            alignments.push({axis: tokens.shift() === 'alignX' ? 0 : 1, references: tokens, line});
        } else parseComponentLine(tokens, line, parts, declarations);
    });
    if (!parts.length) drawingError(0, 'at least one component is required.');
    alignments.forEach(rule => rule.references.forEach(reference => drawingTerminal(reference, declarations, rule.line)));
    const nodes = new Set(parts.flatMap(part => part.nodes));
    return {parts, declarations, alignments, nodes, annotations: validateAnnotations(input.annotations || [], declarations, nodes)};
}
