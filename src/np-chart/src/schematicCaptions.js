// Modified: 2026-11-19
// Captions reserve measured space on a side without a canonical terminal lead.
const SIDES = [[0, -1], [1, 0], [0, 1], [-1, 0]];

// Conservative glyph advances for the renderer's 16-unit sans-serif font.
// Pure/worker rendering cannot query a browser's font metrics. A single average
// character width under-reserves long uppercase references and wide glyphs.
export function schematicTextWidth(text) {
    return Math.ceil(Array.from(text).reduce((width, character) => width +
        (/^[mwMW@]$/.test(character) || character.codePointAt(0) > 127 ? 16 :
            /^[ilI.,:;!'|]$/.test(character) ? 5 : character === ' ' ? 5 :
                /^[frt()[\]]$/.test(character) ? 7 : /^[A-Z]$/.test(character) ? 12 : 10), 0));
}

export function captionBounds(text, x, y) {
    const half = Math.ceil(schematicTextWidth(text) / 2);
    return [x - half, y - 16, x + half, y + 4];
}

function rotate(vector, placement) {
    const x = vector[0] * (placement.mirrorX ? -1 : 1), y = vector[1] * (placement.mirrorY ? -1 : 1);
    return placement.rotation === 0 ? [x, y] : placement.rotation === 90 ? [-y, x] :
        placement.rotation === 180 ? [-x, -y] : [y, -x];
}

export function componentLeadDirections(placement, symbol) {
    return symbol.ports.map((port, index) => {
        const inside = symbol.leads[index].find(point => point.some((value, axis) => value !== port[axis]));
        return rotate(port.map((value, axis) => Math.sign(value - inside[axis])), placement);
    });
}

export function componentCaption(text, placement, symbol, bounds, distance = 20) {
    const normals = componentLeadDirections(placement, symbol);
    const sides = SIDES.filter(side => !normals.some(normal => side.every((value, axis) => value === normal[axis])));
    if (normals.length === 1) sides.sort((a, b) =>
        a[0] * normals[0][0] + a[1] * normals[0][1] - b[0] * normals[0][0] - b[1] * normals[0][1]);
    const side = sides[0] || [1, -1];
    const half = Math.ceil(schematicTextWidth(text) / 2);
    const x = side[0] > 0 ? Math.ceil((bounds[2] + distance + half) / 10) * 10 :
        side[0] < 0 ? Math.floor((bounds[0] - distance - half) / 10) * 10 : Math.round((bounds[0] + bounds[2]) / 20) * 10;
    const y = side[1] > 0 ? Math.ceil((bounds[3] + distance + 16) / 10) * 10 :
        side[1] < 0 ? Math.floor((bounds[1] - distance - 4) / 10) * 10 : Math.round((bounds[1] + bounds[3] + 12) / 20) * 10;
    return {x, y, bounds: captionBounds(text, x, y), cost: distance - 20};
}

export function captionPackingBounds(body, caption, escapes = []) {
    return [Math.min(body[0], caption.bounds[0], ...escapes.map(point => point[0])),
        Math.min(body[1], caption.bounds[1], ...escapes.map(point => point[1])),
        Math.max(body[2], caption.bounds[2], ...escapes.map(point => point[0])),
        Math.max(body[3], caption.bounds[3], ...escapes.map(point => point[1]))];
}
