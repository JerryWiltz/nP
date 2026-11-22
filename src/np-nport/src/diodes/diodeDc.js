// Modified: 2026-11-22
import {diodeTemperature, junctionCurrent} from './junctionDiode';
import {legacyJunction} from './legacyDiode';
import {pinDcParameters} from './pinEquations';
import {pinChargePoint} from './pinChargeEquations';

export function diodeDcDevice(model, nodes, path) {
    const d = model.definition, legacy = d.modelId === 'legacy-diode';
    if (d.modelId === 'pin-charge') return {kind: 'pin-charge', path, nodes, record: d.record, temperature: d.temperature, breakdownVoltage: 2 * d.record.parameters.BV};
    return {kind: d.modelId, path, nodes, p: legacy ? d.parameters : d.modelId === 'pin' ? pinDcParameters(d.record, d.temperature, d.region) : diodeTemperature(d.record.parameters, d.temperature),
        breakdownVoltage: legacy ? d.parameters.breakdownVoltage : d.modelId === 'pin' ? Infinity : d.record.parameters.BV};
}

export function diodeDcCurrent(device, voltage) {
    if (device.kind === 'pin-charge') {
        const point = pinChargePoint(device.record, device.temperature, voltage);
        return {current: point.id, conductance: point.conductance, point};
    }
    return device.kind === 'legacy-diode' ? legacyJunction(device.p, voltage) : junctionCurrent(device.p, voltage);
}
