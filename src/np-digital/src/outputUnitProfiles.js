// Modified: 2026-11-26
import {unitColumn as column} from '../../np-global/src/outputUnits';

export const transmitterUnits = {
    waveform: [column('time', 'ns'), column('voltage', 'V')],
    'frequency table': [null, column('frequency', 'Hz')],
    tones: [column('frequency', 'Hz'), column('voltage', 'V'), column('angle', 'deg')]
};

export function receiverUnits(mode, options) {
    if (mode === 'VNA-frequency') return {
        'response dB': [column('frequency', 'Hz'), null],
        'response magnitude': [column('frequency', 'Hz'), null],
        'response phase': [column('frequency', 'Hz'), column('angle', 'deg')],
        'response real': [column('frequency', 'Hz'), null],
        'response imaginary': [column('frequency', 'Hz'), null]
    };
    const analog = ['AM', 'FM', 'PM', 'SSB', 'DSB-SC'].includes(mode);
    const normalized = mode === 'VNA-time' && (options.referencePort !== undefined || options.referenceReceiver !== undefined);
    const decoded = ['DPSK', 'QPSK', 'QAM', 'MSK', 'GMSK', 'OFDM'].includes(mode);
    const voltage = decoded ? {title: 'Decoded bit'} : normalized ? null : column('voltage', 'V');
    return {
        waveform: [column('time', analog ? 's' : 'ns'), voltage],
        'carrier waveform': [column('time', 'ns'), column('voltage', 'V')],
        'passband waveform': [column('time', 'ns'), column('voltage', 'V')],
        envelope: [column('time', 's'), column('voltage', 'V')],
        phase: [column('time', 's'), column('angle', 'deg', 'Phase deviation', mode === 'FM' ? 'wrapped' : undefined)],
        'frequency deviation': [column('time', 's'), column('frequency', 'Hz')],
        tones: [column('frequency', 'Hz'), column('voltage', 'V'), column('angle', 'deg'), column('power', 'dBm')]
    };
}
