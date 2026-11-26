<!-- Modified: 2026-11-26 -->
# Numeric constructor validation

The older electrical constructors validate numerical arguments before calculating
S-parameters. Valid positional calls and their defaults remain intact. R() is
numeric-only in its first argument; existing seR()/paR() object forms remain.

## Covered contracts

| Family | Parameter rules |
| --- | --- |
| R/L/C, their se/pa forms, and all 16 combined RL/RC/LC/RLC forms | Finite nonnegative Ω/H/F. Resistor temperature: finite nonnegative K. |
| Tlin/Tclin | Finite positive impedances in Ω; finite nonnegative length in meters. |
| trf/trf4Port | Finite signed turns ratio, including the existing zero-ratio ideal limit. |
| Ideal connections, sources of fixed RF gain/loss, lines and transformers | Options must be objects; captured Ro positive finite, Temp nonnegative finite, frequency rows finite and dense. Existing Amp/Attn/Coupler180 parameter checks remain. |
| chebyLPNsec | Positive pass/rejection frequencies and ripple/rejection dB; stop frequency above pass and rejection above ripple. |
| chebyLPgk | Positive integer order within the JavaScript array-size limit; positive ripple dB. |
| chebyLPLCs | Positive dense prototype array with source/load and at least one reactive entry; positive cutoff Hz and impedance Ω. |

`numericValidation.js` supplies common type/range, construction-context and
nonfinite-result checks. A nonnumber throws TypeError; a numeric domain violation
throws RangeError. Messages name the caller and parameter. Options defaults,
explicit fList copies, two-tone frequencies and captured settings are preserved.
Empty construction grids and signed frequencies retain their existing uses;
two-tone analysis still requires positive tones. No coercion converts strings,
booleans or null into component values. Unknown-option rejection across every
constructor is a separate API decision, not part of this numerical pass.

## Valid zero values and singular branch limits

`rlc/lumpedSpars.js` evaluates shared series/parallel impedance or admittance
relations. Zero R and L are shorts; zero C is an open. An open dominates a series
branch; a short dominates a parallel branch. Pure resistance uses the existing
exact resistive conversion. Zero-frequency and exact series/parallel LC resonance
therefore produce finite open/short/through S rows instead of divide-by-zero NaN.
This follows electrical topology without constructor-name or example exceptions.
Per-constructor terminal order, schematic metadata and physical DC descriptors
remain intact. Separate resistor noise covariance retains its temperature and
correlation signs; other passive noise follows the existing nPort behavior.

Negative passive R/L/C inputs now reject, replacing their former unsupported-DC
descriptor behavior. An active equivalent requires a separate explicit model.
Infinity is not an open/short parameter spelling; use zero-valued limits or the
existing Open()/Short() constructors.

Finite input values can still exceed the floating-point range of intermediate
calculations. Those cases throw an actionable numeric-range error instead of
returning nonfinite S/noise values. This is not a promise of extreme-value
accuracy or an arbitrary maximum-value policy. It does not change undefined
derived measurements such as infinite intercept for a linear device, -Infinity
dB for zero transmission, or undefined stability metrics.

## Verification

`test/constructor-validation.test.js` covers every positional RLC/line/transformer
argument, temperature, corrupt contexts, sparse grids, retained signed/empty
grids, valid aliases, zero-element combinations, exact LC resonance, numeric
overflow, and Chebyshev parameter relationships. Existing DC, frequency, noise,
intermodulation and network tests exercise callers and metadata preservation.
Before replacement, 63 ordinary valid constructor cases were captured and
compared with the shared branch path; their RF differences were at rounding
precision and their immutable DC descriptors matched exactly.
