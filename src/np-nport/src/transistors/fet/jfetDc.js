// Modified: 2026-11-19
import {jfetTemperature} from './jfetEquations';

export function jfetDcDevice(model, nodes, path) {
    const d = model.definition;
    return {kind: 'jfet', path, nodes, p: jfetTemperature(d.record.parameters, d.temperature), polarity: d.polarity};
}
