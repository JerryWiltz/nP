// Modified: 2026-11-16
import {connectionDcModel, dcModel, requiredDcModel} from './dcModel';

export function physicalDcModel(name, portCount, physical, settings, resistance) {
    const {geometry, material} = physical;
    const parameters = {geometry, material};
    if (name === 'mlin' || name === 'mclin') {
        if (geometry.length === 0 || material.resistivity === 0) {
            return connectionDcModel(name, portCount, name === 'mlin' ? [[1, 2]] : [[1, 2], [4, 3]],
                [], parameters, settings);
        }
        return requiredDcModel(name, portCount,
            'Supply a DC conductor-resistance model with explicit thickness and return-path assumptions; the RF loss law omits DC resistance.',
            parameters, settings);
    }
    if (name === 'mvgnd' || name === 'mvia') {
        return dcModel(name, portCount, 'linear', 'physical', {modelId: 'lumped', parameters: {...parameters, resistance},
            elements: [{type: 'resistor', terminals: [1, name === 'mvia' ? 2 : 'g'], resistance}], joins: []}, settings);
    }
    return connectionDcModel(name, portCount, [Array.from({length: portCount}, (_, index) => index + 1)],
        [], {...parameters, omissions: ['Conductor/contact DC resistance is omitted by this discontinuity model.']}, settings, 'approximate');
}
