// Modified: 2026-11-06
import {schematicSymbols} from './schematicSymbols.js';

const PORT_SPACING = 80;
const PIN_LENGTH = 20;
const SIDES = ['left', 'right', 'top', 'bottom'];

function centeredPositions(start, length, count) {
    return Array.from({length: count}, (_, index) =>
        start + (length - (count - 1) * PORT_SPACING) / 2 + index * PORT_SPACING);
}

export function nodalBlockSymbol(portCount, portSides) {
    if (!Number.isInteger(portCount) || portCount < 1) {
        throw new RangeError('A nodal block needs at least one electrical port.');
    }
    const sides = portSides || Array.from({length: portCount}, (_, index) =>
        index === 0 ? 'left' : 'right');
    if (sides.length !== portCount || sides.some(side => !SIDES.includes(side))) {
        throw new TypeError('A nodal block needs one valid side for each electrical port.');
    }
    if (portCount === 2 && sides[0] === 'left' && sides[1] === 'right') {
        return schematicSymbols.nodal;
    }
    const grouped = Object.fromEntries(SIDES.map(side =>
        [side, sides.flatMap((value, index) => value === side ? [index] : [])]));
    const width = Math.max(80, PORT_SPACING * Math.max(grouped.top.length, grouped.bottom.length));
    const height = Math.max(40, PORT_SPACING * Math.max(grouped.left.length, grouped.right.length));
    const bodyBounds = [100, 60, 100 + width, 60 + height];
    const ports = new Array(portCount);
    const leads = new Array(portCount);
    for (const side of SIDES) {
        const indices = grouped[side];
        const positions = centeredPositions(side === 'left' || side === 'right' ?
            bodyBounds[1] : bodyBounds[0], side === 'left' || side === 'right' ?
            height : width, indices.length);
        indices.forEach((port, index) => {
            const coordinate = positions[index];
            const body = side === 'left' ? [bodyBounds[0], coordinate] :
                side === 'right' ? [bodyBounds[2], coordinate] :
                    side === 'top' ? [coordinate, bodyBounds[1]] :
                        [coordinate, bodyBounds[3]];
            const end = side === 'left' ? [body[0] - PIN_LENGTH, body[1]] :
                side === 'right' ? [body[0] + PIN_LENGTH, body[1]] :
                    side === 'top' ? [body[0], body[1] - PIN_LENGTH] :
                        [body[0], body[1] + PIN_LENGTH];
            ports[port] = end;
            leads[port] = [end, body];
        });
    }
    const paths = leads.map(([end, body]) =>
        `M${end[0]} ${end[1]} L${body[0]} ${body[1]}`).join(' ');
    const centerX = bodyBounds[0] + width / 2;
    const centerY = bodyBounds[1] + height / 2;
    return {ports, bounds: [76, 36, bodyBounds[2] + 24, bodyBounds[3] + 24],
        bodyBounds, leads, entry: [-1, 0], exit: [1, 0],
        geometry: `<g fill="none" stroke="#202020" stroke-width="2" ` +
            `stroke-linecap="round" stroke-linejoin="round"><path d="${paths}"/>` +
            `<rect x="100" y="60" width="${width}" height="${height}"/>` +
            `<text x="${centerX}" y="${centerY}" font-family="Arial, Helvetica, sans-serif" ` +
            `font-size="13" fill="#202020" stroke="none" text-anchor="middle" ` +
            `dominant-baseline="middle">nodal</text></g>`};
}

export function symbolForSchematicEntry(entry) {
    if (entry.part?.kind === 'cascade') return schematicSymbols.cascade;
    return entry.part?.kind === 'nodal' ? nodalBlockSymbol(entry.nodes.length) :
        schematicSymbols[entry.part?.symbol];
}
