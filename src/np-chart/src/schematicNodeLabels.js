// Modified: 2026-11-25
// One measured enclosure contract for board, cascade and drawing-input labels.
import {schematicTextWidth} from './schematicCaptions';
const HORIZONTAL_PADDING = 8;

export function nodeLabelMetrics(id) {
    const text = String(id), numeric = /^[-+]?\d+(?:\.\d+)?$/.test(text);
    const fontSize = numeric && text.length > 2 ? 10 : 16;
    const width = numeric && text.length <= 3 ? 24 :
        Math.max(24, Math.ceil((schematicTextWidth(text) * fontSize / 16 + 2 * HORIZONTAL_PADDING) / 10) * 10);
    return {width, fontSize};
}

export function nodeLabelBounds(id, x, y) {
    const {width} = nodeLabelMetrics(id);
    return [x - width / 2, y - 12, x + width / 2, y + 12];
}

// Preserve the ordinary circle-to-wire clearance when a wider enclosure is
// placed beside a vertical wire. Move candidates by measured half-width, not
// by a node-specific offset or by shrinking the text.
export function nodeLabelPosition(id, point, offset) {
    const {width} = nodeLabelMetrics(id);
    const extra = Math.ceil((width - 24) / 20) * 10;
    return [point[0] + offset[0] + Math.sign(offset[0]) * extra, point[1] + offset[1]];
}
