// Modified: 2026-11-24

// Power-wave connections require one common construction reference and grid.
// Check every component before any DC inspection or partial composition.
export function validateNetworkComponents(components, caller) {
    const reference = components[0]?.global?.Ro;
    const frequencies = components[0]?.spars;
    for (const [index, component] of components.entries()) {
        if (!Number.isFinite(component?.global?.Ro) || component.global.Ro <= 0) {
            throw new RangeError(caller + ' component ' + (index + 1) + ' needs a positive finite reference impedance Ro.');
        }
        if (component.global.Ro !== reference) {
            throw new RangeError(caller + ' components must have the same reference impedance Ro; component ' +
                (index + 1) + ' uses ' + component.global.Ro + ' ohms instead of ' + reference + ' ohms.');
        }
        if (!Array.isArray(component.spars) || !Array.isArray(frequencies) ||
            component.spars.length !== frequencies.length ||
            component.spars.some((row, rowIndex) => row[0] !== frequencies[rowIndex][0])) {
            throw new RangeError(caller + ' components must have matching frequency rows.');
        }
    }
}
