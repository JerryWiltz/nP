<!-- Modified: 2026-07-15 -->
# np-math Development Notes

`src/np-math/` supplies the complex arithmetic and matrix operations used by every RF constructor and by `nP.nodal()`. These objects are deliberately small JavaScript structures rather than typed-array or external numerical-library abstractions.

## Public exports

`src/np-math/index.js` exports:

```js
nP.complex(real, imaginary)
nP.matrix(array2d)
nP.dim(rows, columns, initial)
nP.dup(array2d)
```

`complex()` is defined in `src/np-math/src/complex.js`. `matrix()`, `dim()`, and `dup()` are defined together in `src/np-math/src/matrix.js`.

## Complex object

```js
var z = nP.complex(real, imaginary);
```

The returned object's public representation is:

```text
z.x = real part
z.y = imaginary part
```

Do not rename these fields without updating all consumers. Browser logging code and other modules sometimes read them directly.

### Mutation

The mutating methods are:

```js
z.set(real, imaginary)
z.setR(real)
z.setI(imaginary)
```

They return `this`, so setter chaining is supported.

The arithmetic methods return new complex objects and leave the receiver unchanged:

| Method | Operation |
| --- | --- |
| `add(c)` | Complex addition. |
| `sub(c)` | Complex subtraction. |
| `mul(c)` | Complex multiplication. |
| `div(c)` | Complex division. |
| `inv()` | Multiplicative inverse. |
| `neg()` | Additive inverse. |
| `copy()` | Independent complex value with the same parts. |
| `sinhCplx()` | Complex hyperbolic sine. |
| `coshCplx()` | Complex hyperbolic cosine. |

### Measurements

| Method | Result |
| --- | --- |
| `mag()` | `sqrt(x² + y²)`. |
| `ang()` | `atan2(y, x)` converted to degrees. |
| `mag10dB()` | `10 log10(magnitude)`. |
| `mag20dB()` | `20 log10(magnitude)`. |

S-parameter voltage-wave ratios normally use `mag20dB()`. `mag10dB()` remains available for quantities where a ten-times logarithmic convention is intended.

The implementation does not add special handling for division by zero, zero-magnitude logarithms, overflow, or underflow. JavaScript `Infinity`, `-Infinity`, and `NaN` therefore propagate normally.

The constructor function is named `Complex`. Preserve that name because some existing logging code checks `constructor.name === 'Complex'`.

## Matrix object

```js
var A = nP.matrix([
    [a11, a12],
    [a21, a22]
]);
```

The two-dimensional JavaScript array is public as `A.m`.

The implementation has separate real and complex method families:

| Real entries | Complex entries |
| --- | --- |
| `add()` | `addCplx()` |
| `sub()` | `subCplx()` |
| `mul()` | `mulCplx()` |
| `invert()` | `invertCplx()` |
| `solveGaussFB()` | `solveGaussFBCplx()` |

Do not call a real method on complex entries or a complex method on plain numeric entries.

`dimension(rows, columns, initial)` creates and wraps a new matrix. `copyMatrix()` duplicates the row arrays and wraps the result.

## Allocation helpers

`dim(rows, columns, initial)` creates a rectangular two-dimensional array and places `initial` in every cell. If `initial` is an object, each cell initially refers to that same object. Current complex algorithms normally replace cells with new values, but code must not mutate a shared initial complex object in place.

`dup(array2d)` creates new row arrays and copies each cell reference. It is therefore a structural or shallow copy. Plain numbers are copied by value; complex objects remain shared until replaced.

## Inversion and solving

Real and complex inversion use augmented-matrix elimination:

1. Duplicate the input rows.
2. Append an identity matrix.
3. Use magnitude-based row pivoting.
4. Eliminate below the diagonal.
5. Normalize the diagonal.
6. Eliminate above the diagonal.
7. Return the appended inverse block.

The Gaussian solve methods expect an augmented matrix with one right-hand-side column. They use forward elimination and back substitution, then return the solved rightmost column as a matrix.

The public input matrix is not intentionally modified by inversion or solving. Tests in `test/math.test.js` verify this behavior for representative inputs.

## Numerical limitations

The current implementation:

- Uses ordinary JavaScript double-precision numbers.
- Uses partial pivoting by absolute value or complex magnitude.
- Does not check matrix dimensions before arithmetic.
- Does not detect ragged arrays.
- Does not explicitly detect a zero pivot or singular matrix.
- Does not estimate condition number or accumulated error.
- Assumes inversion inputs are square.
- Assumes Gaussian-solve inputs have the expected augmented shape.

Callers should validate shapes and physical inputs before reaching the solver. When a circuit produces a singular or ill-conditioned matrix, the present symptom may be non-finite values rather than a specialized error.

## Test expectations

Changes to `np-math` should verify:

- Basic complex identities such as `a.mul(b).div(b) ≈ a` for nonzero `b`.
- Inverse identity `z.mul(z.inv()) ≈ 1` for nonzero `z`.
- Magnitude and phase in known quadrants.
- Real and complex matrix addition, subtraction, and multiplication.
- Inversion by checking `A × A⁻¹ ≈ I`.
- Gaussian solving against a known system.
- Non-mutation of caller-owned matrices.
- Behavior near zero pivots and any new error handling.

Use tolerance-based comparisons for calculated floating-point results. A change to matrix indexing or complex arithmetic requires n-port and nodal regression tests because those layers depend directly on this implementation.

## Related development pages

- `dev/matrixDevelopment.html` is the browser harness.
- `dev/matrixDevelopment.md` is the Obsidian `npjs` version.
- `test/math.test.js` contains the automated arithmetic and solver checks.
