// Modified: 2026-11-20
import {hemtParameters} from './hemtEquations';
export function hemtDcDevice(model, nodes, path) {
    const record = model.definition.record;
    return {kind: 'hemt', path, nodes, p: hemtParameters(record.parameters, record.contactResistances), polarity: 1};
}
