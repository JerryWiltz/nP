// Modified: 2026-11-19
import {mosfetTemperature} from './mosfetEquations';
export function mosfetDcDevice(model, nodes, path) {
    const d = model.definition;
    return {kind: 'mosfet', path, nodes, controls: [[0, 2], [1, 2], [3, 2]],
        p: mosfetTemperature(d.record.parameters, d.temperature, d.polarity), polarity: d.polarity};
}
