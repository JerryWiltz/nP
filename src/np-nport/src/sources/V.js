// Modified: 2026-11-16
import {complex} from '../../../np-math/src/complex';
import {global} from '../../../np-global/src/global';
import {nPort} from '../nPort';
import {componentSettings} from '../componentSettings';
import {analysisFrequencies} from '../analysisFrequencies';
import {dcModel} from '../dcModel';
import {schematicPart} from '../schematicPart';

// Floating DC supply: terminal 1 is positive relative to terminal 2.
// S describes the chosen incremental model, not the nonzero DC excitation.
export function V(voltage = 1, options) {
    const objectForm = voltage !== null && typeof voltage === 'object';
    if (objectForm) {
        if (Array.isArray(voltage) || options !== undefined) {
            throw new TypeError('V accepts a voltage and options, or one options object.');
        }
        options = voltage;
        voltage = options.voltage === undefined ? 1 : options.voltage;
    }
    if (options === undefined) options = {};
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('V options must be an object.');
    }
    for (const name of Object.keys(options)) {
        if (name !== 'fList' && !(objectForm && name === 'voltage')) {
            throw new TypeError('Unknown V option: ' + name + '.');
        }
    }
    if (!Number.isFinite(voltage)) throw new RangeError('V voltage must be finite volts.');
    const settings = componentSettings(global, options), frequencies = analysisFrequencies(settings);
    if (!Number.isFinite(settings.Ro) || settings.Ro <= 0 || !frequencies.length ||
        Array.from(frequencies).some(frequency => !Number.isFinite(frequency) || frequency < 0)) {
        throw new RangeError('V requires positive reference impedance and a nonempty nonnegative frequency list.');
    }
    const source = new nPort(), spars = [], noise = [];
    for (const frequency of frequencies) {
        const through = frequency === 0 ? 1 : 0, reflection = frequency === 0 ? 0 : 1;
        spars.push([frequency, complex(reflection, 0), complex(through, 0), complex(through, 0), complex(reflection, 0)]);
        // The ideal supply is noiseless; preserve explicit covariance rather
        // than relying on the generic passive-noise fallback.
        noise.push({frequency, C: [[complex(0, 0), complex(0, 0)], [complex(0, 0), complex(0, 0)]]});
    }
    source.setspars(spars);
    source.setglobal(settings);
    source.noise = noise;
    source.source = {type: 'voltage', voltage, positivePort: 1, negativePort: 2,
        rfModel: 'open', noiseModel: 'noiseless'};
    source._dcModel = dcModel('V', 2, 'linear', 'ideal', {modelId: 'voltage-source',
        voltage, positiveTerminal: 1, negativeTerminal: 2}, settings);
    source._schematic = schematicPart('V', {labelPrefix: 'V', value: voltage, displayValue: String(voltage) + ' V'});
    return source;
}
