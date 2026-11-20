// Modified: 2026-11-19
export function validateDiodeState(state) {
    const fields = ['vd', 'junctionVoltage', 'va', 'vk'];
    if (!state || typeof state !== 'object' || Array.isArray(state) || Object.keys(state).some(key => !fields.includes(key))) {
        throw new TypeError('Solved diode state needs only vd, junctionVoltage and optional va/vk.');
    }
    const {vd, junctionVoltage} = state, vk = state.vk === undefined ? 0 : state.vk;
    const va = state.va === undefined ? vk === null ? null : vk + vd : state.va;
    if (![vd, junctionVoltage].every(Number.isFinite) ||
        [va, vk].some(value => value !== null && !Number.isFinite(value)) || (va === null) !== (vk === null)) {
        throw new RangeError('Solved diode state needs finite voltages and finite or null terminal references.');
    }
    if (va !== null && Math.abs(va - vk - vd) > 1e-8 + 1e-9 * Math.abs(vd)) {
        throw new RangeError('Solved diode terminal references disagree with vd.');
    }
    return {vd, junctionVoltage, va, vk};
}

export function validateDiodeDrop(state, voltage) {
    if (!Number.isFinite(voltage) || Math.abs(voltage - state.vd) > 1e-8 + 1e-9 * Math.abs(state.vd)) {
        throw new RangeError('Solved diode state is outside the model domain or disagrees with its series-resistance law.');
    }
}
