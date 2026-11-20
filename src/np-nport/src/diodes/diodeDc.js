// Modified: 2026-11-19
import {diodeTemperature, junctionCurrent} from './junctionDiode';
import {legacyJunction} from './legacyDiode';

export function diodeDcDevice(model, nodes, path) {
    const d = model.definition, legacy = d.modelId === 'legacy-diode';
    return {kind: d.modelId, path, nodes, p: legacy ? d.parameters : diodeTemperature(d.record.parameters, d.temperature),
        breakdownVoltage: legacy ? d.parameters.breakdownVoltage : d.record.parameters.BV};
}

export function diodeDcCurrent(device, voltage) {
    return device.kind === 'legacy-diode' ? legacyJunction(device.p, voltage) : junctionCurrent(device.p, voltage);
}
