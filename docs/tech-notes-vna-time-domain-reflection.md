<!-- Modified: 2026-10-21 -->
# VNA time-domain reflection

A vector network analyzer (VNA) can locate a reflection without launching a physical pulse. It measures a circuit's **complex** response at a sequence of frequencies, preserving both amplitude and phase, then calculates what a chosen time-domain stimulus would produce. Keysight describes this as an inverse Fourier transform of frequency-domain measurements; its low-pass impulse and step displays are different transform choices. [Keysight VNA time-domain documentation](https://helpfiles.keysight.com/csg/pxivna/Time/TimeDomain.htm)

This note follows the [VNA short and open reflections REPL example](./repl.md#example-vna-short-reflection). Both circuits use an ideal 180-degree coupler, a matched 1 km lossless line, and a termination that is either a short or an open. The model produces a **synthetic impulse response** at the coupler's receive port. It does not model an instrument sending a broadband pulse down the line.

## Establish the frequency and time grids

The example asks for $N=4096$ equally spaced time samples at $F_s=250\,\mathrm{MHz}$. The sample spacing is

$$
\Delta t=\frac{1}{F_s}.
$$

Here $\Delta t$ is **4 ns**.

The complete record spans $N\Delta t=16.384\,\mu\mathrm{s}$ even though its last stored time is $(N-1)\Delta t=16.380\,\mu\mathrm{s}$. The frequency spacing is

$$
\Delta f=\frac{F_s}{N}.
$$

For this grid, $\Delta f$ is **61,035.15625 Hz**.

The nonnegative frequency bins are $f_k=k\Delta f$ for $k=0,1,\ldots,N/2$. There are **2,049** of them, from DC to the $125\,\mathrm{MHz}$ Nyquist bin. The time waveform repeats mathematically every $1/\Delta f=16.384\,\mu\mathrm{s}$. A return later than that would wrap into this displayed time window.

| Quantity | Value in the example | What it controls |
| --- | ---: | --- |
| Sample count $N$ | 4,096 | Number of reconstructed time samples |
| Sample rate $F_s$ | 250 MHz | 4 ns spacing between displayed samples |
| Frequency spacing $\Delta f$ | 61,035.15625 Hz | 16.384 µs unambiguous time period |
| Nonnegative bins | 2,049 | DC through Nyquist, including the zeroed Nyquist bin |
| Highest nonzero source bin | 124.93896484375 MHz | Finite synthesized bandwidth |

## Build the synthetic pulse from cosine waves

`nP.mod({mode: 'VNA'})` puts a **real unit complex coefficient** in each bin from DC through $k=N/2-1$ and puts **zero** in the Nyquist bin. The inverse transform supplies the negative-frequency bins as complex conjugates of the positive-frequency bins. Because all selected coefficients have zero phase, their cosine contributions line up at time zero.

With nP's inverse-transform convention, each full-spectrum bin contributes its coefficient divided by $N$. DC contributes a constant $1/N$; a positive-frequency bin and its negative-frequency partner together contribute a cosine of amplitude $2/N$. Therefore the displayed reference waveform is

$$
x(t)=\frac{1}{N}\left[1+2\sum_{k=1}^{N/2-1}\cos(2\pi k\Delta f\,t)\right].
$$

**Yes: it is a sum of equally spaced cosine waves, plus DC.** The spacing is $\Delta f$, and every included frequency has the same complex coefficient. This does **not** mean a physical source emits all of these tones at once. A physical VNA sweeps them one at a time; the displayed pulse is the mathematical inverse transform of the frequency response. [Keysight VNA time-domain documentation](https://helpfiles.keysight.com/csg/pxivna/Time/TimeDomain.htm)

The $2/N$ factor matters. Calling each term a “one-volt cosine” would give the wrong pulse amplitude. In this example the unit coefficients are transform-bin values; inverse-transform normalization gives each positive-frequency cosine a peak amplitude of $2/4096\,\mathrm{V}$ in the synthetic voltage table. The pulse's height comes from the coherent sum of **2,047** cosine pairs and the DC term.

At $t=0$, every cosine equals one, so

$$
x(0)=\frac{N-1}{N}.
$$

With $N=4096$, the initial sample is **0.999755859375 V**.

If the Nyquist bin were also one, the samples would be a perfect periodic Kronecker impulse: 1 V at sample zero and 0 V at all other samples. nP instead zeros that bin. On the sample grid, the exact consequence is

$$
x[n]=\delta_{n,0}-\frac{(-1)^n}{N}.
$$

Here $\delta_{n,0}$ is one at $n=0$ and zero at the other sample positions. Thus the other samples alternate between $+1/N$ and $-1/N$, about $\pm0.000244\,\mathrm{V}$. Between sample positions, the finite cosine sum has a central lobe and smaller oscillations; it is a **periodic, band-limited impulse-like waveform**, not an infinitely narrow physical impulse or a gamma-shaped pulse. Adding frequency bins narrows its main lobe. Omitting high frequencies or applying a window broadens it.

## Let the RF circuit change each frequency

Each source bin passes through the circuit at its own frequency. Let $H_k$ be the complex voltage transfer from the source port to the receive port at $f_k$. The received bin is $H_k$ times the unit source bin. Its magnitude changes the corresponding cosine's strength, while its angle shifts that cosine's phase. With the Nyquist bin still zero, the reconstructed receive waveform is

$$
y[n]=\frac{1}{N}\left[H_0+2\operatorname{Re}\left\{\sum_{k=1}^{N/2-1}H_k e^{j2\pi kn/N}\right\}\right].
$$

The zero-frequency transfer $H_0$ must be real for this real waveform. In nP, `mod()` populates `global.fList`, the n-port constructors calculate one S-parameter row per frequency, and `demod(...).out('waveform')` constructs the conjugate negative-frequency bins and calls the inverse FFT. nP evaluates DC directly in this ideal circuit. A physical RF VNA may extrapolate DC from measured low-frequency points; Keysight documents such extrapolation for its low-pass transforms. [Keysight VNA time-domain documentation](https://helpfiles.keysight.com/csg/pxivna/Time/TimeDomain.htm)

The ideal coupler sends a fraction $t$ of the input voltage wave to its through port 2. A returning wave from port 2 reaches isolated receive port 3 with factor $k$. Its forward coupled port 4 is matched. For the default equal-power split, both $t$ and $k$ are $1/\sqrt{2}$, so

$$
tk=\frac{1}{2}.
$$

The one-way, matched `Tlin(50, 1000)` has phase factor $e^{-j2\pi fL/c_0}$. Traveling out and back doubles its phase delay. The line end contributes reflection coefficient $\Gamma$, giving

$$
H(f)=tk\,\Gamma\,e^{-j2\pi f(2L/c_0)}.
$$

An ideal short has $\Gamma=-1$ and an ideal open has $\Gamma=+1$. They therefore have the same delay and magnitude but opposite signs. With $tk=1/2$, the ideal **continuous-time** peak near the echo is approximately $\pm0.5\,\mathrm{V}$ after the finite-bin normalization. The plotted sample peaks are smaller because the delay does not land exactly on a sample. The negative short pulse and positive open pulse demonstrate the polarity of the reflection coefficient. They are not separate transmit pulses.

## Check the 2 km travel time

`Tlin()` uses nP's `C0=299792458` m/s. This is the exact SI speed of light in vacuum. [NIST CODATA speed of light](https://physics.nist.gov/cgi-bin/cuu/Value?c%7Csearch_for=velocity+of+light)

The termination is $L=1000\,\mathrm{m}$ from the coupler. The signal travels **1 km outward and 1 km back**, a total of 2 km, so the predicted delay is

$$
\tau=\frac{2L}{c_0}.
$$

For this model,

$$
\tau=\frac{2000\,\mathrm{m}}{299{,}792{,}458\,\mathrm{m/s}}.
$$

The predicted travel time is **6.671281904 µs**, or **6671.281904 ns**.

The REPL plots time in nanoseconds. Sample 1668 is at $1668\times4\,\mathrm{ns}=6672\,\mathrm{ns}$, the closest sample to the theoretical $6671.282\,\mathrm{ns}$. Reading the largest absolute sample in each return table gives:

| Check | Short | Open |
| --- | ---: | ---: |
| Predicted travel time | 6,671.282 ns | 6,671.282 ns |
| Time of plotted peak | 6,672 ns | 6,672 ns |
| Peak voltage | −0.473808 V | +0.473808 V |
| Peak-time difference from theory | +0.718 ns | +0.718 ns |

The time difference is **smaller than one 4 ns sample interval**. At the modeled velocity it corresponds to about **0.108 m** of inferred one-way distance. The sample location agrees with the light-speed prediction; the small difference is expected when a continuous delay is read from a sampled, band-limited waveform. It does not indicate that the model uses a different propagation speed.

## Why the short return briefly becomes positive

The short has a negative reflection coefficient, but its plotted return is not negative at every nearby time. The largest sample is **−0.473808 V at 6,672 ns**; the next sample is **+0.072026 V at 6,676 ns**. There is also a smaller positive sample of **+0.046837 V at 6,664 ns**. These positive values are sidelobes of the same reflected impulse, not additional positive reflections or changes in the termination.

The ideal circuit's short-return waveform is the delayed, inverted input waveform scaled by the two coupler paths:

$$
y_{\mathrm{short}}(t)=-\frac{1}{2}x(t-\tau).
$$

The finite, equally weighted cosine sum for $x(t)$ has oscillations around its main lobe. Shifting and inverting that entire shape gives the alternating signs around the negative return peak. The abrupt cutoff at the highest included frequency is what gives the synthetic impulse its sidelobes. This is closely related to the **Gibbs phenomenon** of truncated Fourier series; for this impulse display, **band-limited impulse ringing** or **sidelobes** describes the feature more precisely than the classic overshoot beside a step discontinuity. Keysight likewise attributes VNA time-domain impulse sidelobes to finite frequency coverage. [Keysight time-domain windowing](https://helpfiles.keysight.com/csg/N1930xB/Analyzing/Analyzing_Data_in_the_Time_Domain.html)

A frequency-domain taper could reduce the sidelobes, making a small nearby reflection easier to see. Its cost is a **wider main pulse**, so two close reflections become harder to separate. The current `mod({mode: 'VNA'})` example uses equal bin weights and does not offer a window option. [Keysight time-domain windowing](https://helpfiles.keysight.com/csg/N1930xB/Analyzing/Analyzing_Data_in_the_Time_Domain.html)

## What the result does and does not represent

This is an ideal, lossless reference case. The chosen line has $Z_0=50\,\Omega$, matching the default $50\,\Omega$ reference impedance, so its entrance contributes no reflection. The ideal coupler is frequency independent. Real transmission lines normally have a velocity factor below one, loss, dispersion, and imperfect terminations; a real coupler has finite bandwidth. Those effects would alter delay, pulse height, and shape.

The frequency interval sets the periodic time window, while the **frequency span and any window applied to the bins** set how sharply nearby reflections can be separated. Four-nanosecond displayed sample spacing is not, by itself, a claim of 4 ns physical resolution. This nP example uses equal bin weights, no tapering window, direct DC, and a zero Nyquist bin. It calculates an impulse-like response; it does not yet synthesize a step response or a user-selected pulse shape. For the sampling and transform foundations, see [Sampling and quantization](./tech-notes-sampling-and-quantization.md), [FFT in nPort](./tech-notes-fft-in-nport.md), and [mod() in nPort](./tech-notes-mod-in-nport.md).
