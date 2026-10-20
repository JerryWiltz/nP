<!-- Modified: 2026-10-19 -->
# Math

The math API provides complex numbers, matrices, and Fourier transforms. These functions are also used by the RF and digital calculations, but you can call them directly through `nP`.

## Complex numbers

`nP.complex(real, imaginary)` creates a complex value. For example, an ideal inductor has impedance `jωL`:

```js
var frequency = 1e9;
var inductance = 10e-9;

var resistor = nP.complex(50, 0);
var inductor = nP.complex(0, 2 * Math.PI * frequency * inductance);
var impedance = resistor.add(inductor);

nP.log(impedance.getR()); // 50 ohms
nP.log(impedance.getI()); // about 62.83 ohms
nP.log(impedance.mag());  // magnitude in ohms
nP.log(impedance.ang());  // angle in degrees
```

The real and imaginary parts are available as `.x` and `.y`, or through `getR()` and `getI()`. Arithmetic methods return **new** complex values; `setR()` and `setI()` change the existing value and return it.

| Method | Result |
| --- | --- |
| `add(other)`, `sub(other)` | Sum and difference. |
| `mul(other)`, `div(other)` | Product and quotient. |
| `inv()`, `neg()`, `copy()` | Reciprocal, negative, and copy. |
| `mag()` | Magnitude. |
| `ang()` | Angle in degrees. |
| `mag20dB()` | `20 log₁₀(magnitude)`, useful for voltage or wave amplitude ratios. |
| `mag10dB()` | `10 log₁₀(magnitude)`, useful when the magnitude represents a power ratio. |
| `sinhCplx()`, `coshCplx()` | Complex hyperbolic sine and cosine. |

Pass another `nP.complex()` value to the binary arithmetic methods, including for a purely real operand such as `nP.complex(2, 0)`.

## Numeric matrices

`nP.matrix(array2d)` wraps a two-dimensional array. Read the result through its `.m` field, indexed as `.m[row][column]`; matrix objects have no `.out()` method.

```js
var a = nP.matrix([
    [2, 0],
    [0, 4]
]);
var inverse = a.invert();

nP.log(inverse.m[0][0]); // 0.5
nP.log(inverse.m[1][1]); // 0.25
```

For matrices of numbers, use `add()`, `sub()`, `mul()`, `transpose()`, and `invert()`. Each returns a matrix object. `invert()` returns a new matrix and leaves the input matrix's rows intact. Supply compatible dimensions for addition or multiplication and a nonsingular square matrix for inversion.

To solve a linear system, `solveGaussFB()` takes an **augmented matrix**: coefficient columns followed by the right-hand-side column. It returns a one-column solution matrix.

```js
// 2x + y = 5; x - y = 1
var equations = nP.matrix([
    [2, 1, 5],
    [1, -1, 1]
]);
var solution = equations.solveGaussFB();

nP.log(solution.m[0][0]); // x = 2
nP.log(solution.m[1][0]); // y = 1
```

`solveGaussFB()` also leaves the original rows intact.

## Complex matrices

When entries are `nP.complex()` values, use the matching methods with a `Cplx` suffix: `addCplx()`, `subCplx()`, `mulCplx()`, `invertCplx()`, and `solveGaussFBCplx()`. Use `transposeCplx()` for the **conjugate transpose**. The methods without `Cplx` are for ordinary numeric entries.

```js
var z = nP.matrix([
    [nP.complex(50, 0), nP.complex(0, 0)],
    [nP.complex(0, 0), nP.complex(0, 25)]
]);
var inverseZ = z.invertCplx();

nP.log(inverseZ.m[0][0].getR()); // 0.02
nP.log(inverseZ.m[1][1].getI()); // -0.04
```

`invertCplx()` and `solveGaussFBCplx()` return new matrices without changing the input rows.

## Create and copy arrays

`nP.dim(rows, columns, initial)` returns a plain two-dimensional array filled with the initial value. `nP.dup(array2d)` copies its rows into a new array. They are array helpers, so wrap their result in `nP.matrix()` when you need matrix methods.

```js
var values = nP.dim(2, 2, 0);
values[0][0] = 1;

var copiedRows = nP.dup(values);
copiedRows[0][0] = 3;

nP.log(values[0][0]);     // still 1
nP.log(copiedRows[0][0]); // 3
```

`dup()` copies the array structure, not the objects stored in its cells. For complex entries, a cell in the copy still refers to the same complex object until you replace it or copy that value separately.

## Fourier transforms

`nP.FFT(samples)` takes a nonempty array of finite numbers or `nP.complex()` values and returns an equally long array of complex frequency bins. `nP.invFFT(spectrum)` transforms those bins back into complex samples. Both support any positive array length; you do not need to pad to a power of two.

```js
var samples = [1, 0, 0, 0];
var spectrum = nP.FFT(samples);
var recovered = nP.invFFT(spectrum);

nP.log(spectrum.map(function (bin) { return bin.getR(); }));
// Approximately [1, 1, 1, 1]
nP.log(recovered.map(function (sample) { return sample.getR(); }));
// Approximately [1, 0, 0, 0]
```

The forward transform is unscaled; the inverse divides by the sample count. The functions transform sample **values** only. If you sampled at rate `Fs` with `N` samples, bin `k` corresponds to `k × Fs / N` hertz through Nyquist. Bins above Nyquist represent negative frequencies at `(k − N) × Fs / N`. The returned values are complex even when the input samples are real, so use `getR()`, `getI()`, or `mag()` to inspect them.
