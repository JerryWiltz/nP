// Modified: 2026-10-25
// Reuse one SVG for examples with the same circuit topology.
export const schematicMap = {
  'frequency-sweep': ['frequency-sweep'],
  'rc-low-pass': ['rc-low-pass'],
  'rlc-ladder': ['rlc-ladder'],
  'method-chaining-nport': ['five-cascaded-two-ports'],
  'vna-port1': ['vna-receivers', 'vna-inductor-fixture'],
  'vna-inductor-time': ['vna-receivers', 'vna-inductor-fixture'],
  'vna-short-reflection': ['vna-cable-receivers', 'vna-cable-short', 'vna-cable-open'],
  'tee-power-divider': ['tee-power-divider'],
  'series-stub': ['series-stub'],
  'coupled-line': ['ideal-coupled-line'],
  'line-chart': ['line-chart-transmission'],
  'series-rc-smith-chart': ['series-rc'],
  'line-table': ['transmission-line'],
  'full-wave-rectified-sine-fft': ['waveform-fft'],
  'square-wave-fft': ['waveform-fft'],
  'trapezoid-fft-round-trip': ['waveform-fft-inverse'],
  'chebyshev-ladder': ['chebyshev-ladder'],
  'microstrip-line': ['microstrip-line'],
  'microstrip-coupler': ['microstrip-coupled-line'],
  'microstrip-tee': ['microstrip-tee'],
  'microstrip-layout': ['microstrip-layout-path'],
  'microstrip-film-resistor': ['microstrip-film-resistor'],
  'amplifier-noise': ['amplifier-then-attenuator'],
  'noise-order': ['amplifier-then-attenuator', 'attenuator-then-amplifier'],
  'two-tone-ip3': ['amplifier-then-attenuator'],
  'diode-dc-rf': ['diode-dc-rf'],
  'am-envelope': ['mod-demod', 'attenuator-three-db'],
  'fm-pm-sidebands': ['fm-pm-modulators'],
  'ssb-dsb-sidebands': ['ssb-dsb-modulators'],
  'ascii-through-circuit': ['mod-demod', 'attenuator-three-db'],
  'pn7-waveform': ['pn-waveform'],
  'psk-receiver': ['mod-demod', 'attenuator-three-db'],
  'ber-attenuation': ['ber-comparison', 'attenuator-seventeen-db'],
  'qam-ofdm': ['mod-demod', 'rf-through']
}

export const examplesWithoutCircuits = new Set([
  'complex-arithmetic',
  'matrix-arithmetic',
  'math-method-chaining'
])
