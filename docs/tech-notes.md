<!-- Modified: 2026-10-22 -->
# Tech Notes

Engineering notes for the ideas behind nP. The left sidebar groups notes by subject; the right sidebar lists headings on the current page.

## RF Notes

RF notes cover circuit and network theory, including the concepts used by nP's n-port models.

- [S-parameters for the novice](./tech-notes-s-parameters-for-the-novice.md) explains incident and outgoing waves, calculates the S-parameters of a 5 nH series inductor at 2 GHz, and follows the calculation into `nP.L()`.
- [nPort overview](./tech-notes-nport-overview.md) explains how nP represents components and complete circuits as frequency-dependent nPort objects.
- [VNA time-domain reflection](./tech-notes-vna-time-domain-reflection.md) derives the synthetic impulse, checks a 1 km cable's return time, and explains the inductor's three receiver impulse plots.
- [VNA frequency-domain measurement](./tech-notes-vna-frequency-domain-measurement.md) follows R, A, and B through the ideal fixture and derives the 5 nH inductor's measured S11 and S21 values.

## Digital Notes

Digital notes cover sampled signals, modulation, and the time and frequency domain concepts used by nP.

- [Sampling and quantization](./tech-notes-sampling-and-quantization.md) explains sample frequency, Nyquist, ADC bit depth, and anti-alias filtering.
- [Waveform in nPort](./tech-notes-waveform-in-nport.md) explains how a periodic voltage shape becomes samples on a chosen time grid.
- [FFT in nPort](./tech-notes-fft-in-nport.md) explains the frequency bins produced from time samples and how nP exposes them.
- [mod() in nPort](./tech-notes-mod-in-nport.md) explains how nP turns bits into a sampled transmit signal and prepares it for an n-port circuit.
