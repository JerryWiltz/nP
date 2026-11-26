<!-- Modified: 2026-11-26 -->
# Frequency and time grid generation

`global.fGen(start, stop, points)` and `global.tGen(start, stop, points)` use the
shared `linearGrid()` helper in `src/np-global/src/global.js`. They return new
ordinary numeric arrays and do not read or modify the selected context's lists.
Assign the result before constructing dependent components.

| Contract | `fGen` | `tGen` |
| --- | --- | --- |
| Endpoints | Finite JavaScript numbers, in Hz | Finite JavaScript numbers, in s |
| Point count | Integer >=1 | Integer >=2 |
| Direction | Increasing, decreasing or constant | Increasing (`stop > start`) |
| One point | `[start]`; still validate `stop` | Error: no sampling interval |
| Multiple points | Include exact start and stop | Include exact start and stop |

```js
var g = nP.global;
var singleFrequency = g.fGen(2e9, 2e9, 1);
var frequencies = g.fGen(2e9, 4e9, 51);
var times = g.tGen(0, 1e-6, 101);
g.fList = frequencies;
g.tList = times;
```

A single RF frequency is a meaningful independent measurement. Sampled signals
need at least two times to establish an interval. Frequency lists may include
signed bins or descend; time origins may be negative. Components and signal
analyses retain their own domain, uniformity and length requirements. These
generators do not make an otherwise unsupported frequency or sample rate valid.

Both reject nonnumeric/nonfinite endpoints and zero, negative, fractional,
nonfinite, missing or nonnumeric counts with RangeError messages naming the
generator and invalid field. The natural JavaScript array-length maximum is
4294967295; larger counts reject before generation. This is an array-format
limit rather than a promise that every permitted size fits available memory.

For multi-point intervals, `stop - start` must be finite. Values are calculated
by index rather than repeated addition, with the first and last entries pinned
to the requested endpoints. Ordinary IEEE-754 rounding remains. A nonconstant
interval whose adjacent values collapse or reverse at numeric resolution
rejects with guidance to reduce points or change the interval. Equal frequency
endpoints intentionally return repeated values; equal time endpoints reject.

The previous unvalidated fGen could round fractional counts up, return empty
arrays for missing/invalid counts, or loop indefinitely for Infinity. These
requests now reject. Previously accumulated frequency rounding may differ by
small floating-point amounts from indexed values; neither generator accumulates
endpoint drift now. One-point RF behavior and valid ordinary grids remain.

`test/global.test.js` covers counts, endpoints, directions, one-frequency RF
analysis, time origins, floating-point limits, returned-array ownership and
unchanged context settings. Digital/FFT/waveform tests cover consuming analyses.
