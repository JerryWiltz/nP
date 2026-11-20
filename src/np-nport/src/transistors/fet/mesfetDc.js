// Modified: 2026-11-19
import {mesfetParameters} from './mesfetEquations';

export function mesfetDcDevice(model, nodes, path) {
    const d = model.definition;
    return {kind: 'mesfet', path, nodes, p: mesfetParameters(d.record.parameters), polarity: 1};
}
