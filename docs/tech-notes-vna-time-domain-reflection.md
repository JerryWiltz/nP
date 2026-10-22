<!-- Modified: 2026-10-22 -->
# VNA time-domain reflection

A vector network analyzer (VNA) can locate a reflection without launching a physical pulse. It measures a circuit's **complex** response at a sequence of frequencies, preserving both amplitude and phase, then calculates what a chosen time-domain stimulus would produce. Keysight describes this as an inverse Fourier transform of frequency-domain measurements; its low-pass impulse and step displays are different transform choices. [Keysight VNA time-domain documentation](https://helpfiles.keysight.com/csg/pxivna/Time/TimeDomain.htm)

This note follows the [VNA cable fault location REPL example](./repl.md#example-vna-short-reflection). Both circuits use a matched splitter, an ideal input coupler, a matched 1 km lossless line, and a termination that is either a short or an open. Reference receiver R samples the source; reflection receiver A samples the return. The VNA's output coupler and receiver B remain dormant for this one-port test. The model produces a **synthetic impulse response**. It does not model an instrument sending a broadband pulse down the line.

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

`nP.mod({mode: 'VNA-time'})` puts a **real unit complex coefficient** in each bin from DC through $k=N/2-1$ and puts **zero** in the Nyquist bin. The inverse transform supplies the negative-frequency bins as complex conjugates of the positive-frequency bins. Because all selected coefficients have zero phase, their cosine contributions line up at time zero.

With nP's inverse-transform convention, each full-spectrum bin contributes its coefficient divided by $N$. DC contributes a constant $1/N$; a positive-frequency bin and its negative-frequency partner together contribute a cosine of amplitude $2/N$. Therefore the unit source's synthetic waveform is

$$
x(t)=\frac{1}{N}\left[1+2\sum_{k=1}^{N/2-1}\cos(2\pi k\Delta f\,t)\right].
$$

**Yes: it is a sum of equally spaced cosine waves, plus DC.** The spacing is $\Delta f$, and every included frequency has the same complex coefficient. This does **not** mean a physical source emits all of these tones at once. A physical VNA sweeps them one at a time; the displayed pulse is the mathematical inverse transform of the frequency response. [Keysight VNA time-domain documentation](https://helpfiles.keysight.com/csg/pxivna/Time/TimeDomain.htm)

The $2/N$ factor matters. Calling each term a “one-volt cosine” would give the wrong pulse amplitude. In this example the unit coefficients are transform-bin values; inverse-transform normalization gives each positive-frequency cosine a peak amplitude of $2/4096\,\mathrm{V}$ in the synthetic voltage table. The pulse's height comes from the coherent sum of **2,047** cosine pairs and the DC term.

At $t=0$, every cosine equals one, so

$$
x(0)=\frac{N-1}{N}.
$$

With $N=4096$, the unit source's initial sample is **0.999755859375 V**. The plotted R receiver is after the equal splitter, so its peak is this value divided by $\sqrt{2}$, about **0.706934 V**. The A receiver uses R's frequency bins as its reference; the splitter factor cancels in A/R.

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

The splitter sends a fraction $t$ of the source to R and the same fraction toward the input coupler. That coupler sends fraction $t$ to the line and directs the returning wave to A with factor $k$. For the default equal-power split, both $t$ and $k$ are $1/\sqrt{2}$. The splitter cancels in A/R, leaving

$$
tk=\frac{1}{2}.
$$

The one-way, matched `Tlin(50, 1000)` has phase factor $e^{-j2\pi fL/c_0}$. Traveling out and back doubles its phase delay. The line end contributes reflection coefficient $\Gamma$, giving

$$
\frac{A(f)}{R(f)}=tk\,\Gamma\,e^{-j2\pi f(2L/c_0)}.
$$

The A receiver uses `referenceReceiver: referenceRx` to divide by R and `referenceGain: 2` to remove $tk=1/2$. The normalized response is therefore $\Gamma e^{-j2\pi f(2L/c_0)}$. An ideal short has $\Gamma=-1$ and an ideal open has $\Gamma=+1$. They have the same delay and magnitude but opposite signs. The ideal **continuous-time** peak near the echo is approximately $\pm1$ after finite-bin normalization. The plotted sample peaks are smaller because the delay does not land exactly on a sample.

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

The REPL plots time in nanoseconds and displays a speed-of-light transit table calculated from the **largest absolute sample** in each return waveform. Sample 1668 is at $1668\times4\,\mathrm{ns}=6672\,\mathrm{ns}$, the closest sample to the theoretical $6671.282\,\mathrm{ns}$. The measured peak times and inferred distances are:

| Check | Short | Open |
| --- | ---: | ---: |
| Predicted travel time | 6,671.282 ns | 6,671.282 ns |
| Time of plotted peak | 6,672 ns | 6,672 ns |
| Peak normalized response | −0.947616 | +0.947616 |
| Distance inferred from peak time | 1,000.108 m | 1,000.108 m |
| Peak-time difference from theory | +0.718 ns | +0.718 ns |

The time difference is **smaller than one 4 ns sample interval**. At the modeled velocity it corresponds to about **0.108 m** of inferred one-way distance. The sample location agrees with the light-speed prediction; the small difference is expected when a continuous delay is read from a sampled, band-limited waveform. It does not indicate that the model uses a different propagation speed.

## Why the short return briefly becomes positive

The short has a negative reflection coefficient, but its plotted return is not negative at every nearby time. The largest sample is **−0.947616 at 6,672 ns**; the next sample is **+0.144052 at 6,676 ns**. There is also a smaller positive sample of **+0.093675 at 6,664 ns**. These positive values are sidelobes of the same reflected impulse, not additional positive reflections or changes in the termination.

The normalized short-return waveform is the delayed, inverted synthetic impulse:

$$
y_{\mathrm{short}}(t)=-x(t-\tau).
$$

The finite, equally weighted cosine sum for $x(t)$ has oscillations around its main lobe. Shifting and inverting that entire shape gives the alternating signs around the negative return peak. The abrupt cutoff at the highest included frequency is what gives the synthetic impulse its sidelobes. This is closely related to the **Gibbs phenomenon** of truncated Fourier series; for this impulse display, **band-limited impulse ringing** or **sidelobes** describes the feature more precisely than the classic overshoot beside a step discontinuity. Keysight likewise attributes VNA time-domain impulse sidelobes to finite frequency coverage. [Keysight time-domain windowing](https://helpfiles.keysight.com/csg/N1930xB/Analyzing/Analyzing_Data_in_the_Time_Domain.html)

A frequency-domain taper could reduce the sidelobes, making a small nearby reflection easier to see. Its cost is a **wider main pulse**, so two close reflections become harder to separate. The current `mod({mode: 'VNA-time'})` example uses equal bin weights and does not offer a window option. [Keysight time-domain windowing](https://helpfiles.keysight.com/csg/N1930xB/Analyzing/Analyzing_Data_in_the_Time_Domain.html)

## What the result does and does not represent

This is an ideal, lossless reference case. The chosen line has $Z_0=50\,\Omega$, matching the default $50\,\Omega$ reference impedance, so its entrance contributes no reflection. The ideal coupler is frequency independent. Real transmission lines normally have a velocity factor below one, loss, dispersion, and imperfect terminations; a real coupler has finite bandwidth. Those effects would alter delay, pulse height, and shape.

The frequency interval sets the periodic time window, while the **frequency span and any window applied to the bins** set how sharply nearby reflections can be separated. Four-nanosecond displayed sample spacing is not, by itself, a claim of 4 ns physical resolution. This nP example uses equal bin weights, no tapering window, direct DC, and a zero Nyquist bin. It calculates an impulse-like response; it does not yet synthesize a step response or a user-selected pulse shape. For the sampling and transform foundations, see [Sampling and quantization](./tech-notes-sampling-and-quantization.md), [FFT in nPort](./tech-notes-fft-in-nport.md), and [mod() in nPort](./tech-notes-mod-in-nport.md).

## Apply the same VNA to a two-port inductor

The [VNA inductor impulse response example](./repl.md#example-vna-inductor-time) uses the same splitter and input coupler, inserts a 5 nH series inductor as the DUT, and activates the output coupler and receiver B. Its `tList` has **4,096 samples at 16 GHz**. Consecutive times are **62.5 ps** apart; the stored times run from 0 to **255.9375 ns**, and the periodic record is **256 ns** long. `mod({mode: 'VNA-time'})` creates **2,049** nonnegative frequency bins from DC to the **8 GHz** Nyquist frequency. Their spacing is **3.90625 MHz**; the Nyquist source bin is zero.

The three plotted tables have different meanings:

| Receiver table | What is plotted |
| --- | --- |
| R `referenceRx.out('waveform')` | The synthetic source impulse after the splitter, in volts. Its peak is about 0.707 V. |
| A `reflectionRx.out('waveform')` | The inverse FFT of the inductor's normalized $S_{11}$ bins. It shows the reflected impulse response. |
| B `transmissionRx.out('waveform')` | The inverse FFT of the inductor's normalized $S_{21}$ bins. It shows the transmitted impulse response. |

A and B each divide their complex frequency bins by the gain-adjusted R receiver and use `referenceGain: 2` to remove the two ideal coupler factors. The ratio is taken **before** the inverse FFT, so these two plots are dimensionless impulse responses. The R plot remains a receiver voltage. For the series inductor, $S_{11}(0)=0$ and $S_{21}(0)=1$; over this ideal model's frequencies, $S_{11}(f)+S_{21}(f)=1$. Thus the normalized A and B impulse samples add to the unit synthetic source impulse samples. The time plot shows how the inductor splits the incident signal between reflection and transmission; it does not assign a cable-like travel distance to the lumped element.

### How to read the inductor plots

The 5 nH inductor is a **series** element. Its impedance is $j2\pi fL$: near DC it is almost a through connection, so $S_{11}$ approaches zero and $S_{21}$ approaches one. As frequency increases, its impedance rises; more of the fast-changing part is reflected and less passes through. The characteristic time $L/(2Z_0)$ is **50 ps** with $Z_0=50\,\Omega$, close to the plot's **62.5 ps** sample spacing. The response is therefore concentrated at the beginning of the 256 ns window.

The first two plotted samples make the behavior concrete:

| Time | R, reference voltage | A, normalized reflection | B, normalized transmission |
| --- | ---: | ---: | ---: |
| 0 ps | +0.706934 V | +0.525463 | +0.474293 |
| 62.5 ps | +0.000173 V | −0.474638 | +0.474882 |

The A and B values add to the **unit source impulse**, about 0.999756 at time zero and 0.000244 at 62.5 ps. They do **not** add to R's voltage, because R includes the splitter's $1/\sqrt{2}$ factor. The initial positive A sample represents high-frequency reflection. Its negative following sample accompanies B's continuing positive transmission: for this ideal series element, the reflected impulse response is the unit input impulse minus the transmitted impulse response. The finite 8 GHz span, zeroed Nyquist bin, and inverse FFT also give the traces small sidelobes.

The plots show a calculated response to a synthetic impulse, **not a physical pulse launched by the VNA**. Unlike the cable plot, there is no delayed return from a distant fault. If a feature appears close to **256 ns**, it belongs to the inverse FFT's periodic time window; it is not a second reflection.

For a sweep that remains in the frequency domain and measures a 5 nH inductor's S11 and S21 with R, A, and B, see [VNA frequency-domain measurement](./tech-notes-vna-frequency-domain-measurement.md).
