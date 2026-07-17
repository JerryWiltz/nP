<!-- Modified: 2026-07-15 -->
# np-nport Development Notes

`src/np-nport/` contains the common n-port object, lumped components, ideal fixtures, transmission lines, physical microstrip models, and network-composition functions.

## Export path

```text
src/np-nport/src/<implementation>.js
        ↓
src/np-nport/src/index.js
        ↓
src/np-nport/index.js
        ↓
src/index.js
        ↓ Rollup
dist/nP.js, dist/nP.esm.js, and dist/nP.cjs
```

A new public constructor must be exported through this path and covered by a direct source test. Rebuild the root distribution when the browser or packaged library is expected to contain the change.

## Common component result

Every constructor returns an object based on `nPort` with:

- One S-parameter row per configured frequency.
- Row-major square S matrices made of `complex()` values.
- A reference to the shared global settings.
- `.out(...)` for display-table extraction.
- Compatibility with `nP.nodal()`.

See [`../nport-data-model.md`](../nport-data-model.md) for the exact row contract.

## Constructor families

### Lumped RLC components

The preferred explicit component constructors are:

```js
nP.R()
nP.L()
nP.C()
```

They represent series two-port elements. The older explicit series and parallel families remain public:

```text
seR, seL, seC
paR, paL, paC
```

There are also combined RLC constructors such as `seSeRLC()` and `paPaRLC()`. For examples intended to communicate topology, prefer individual components plus `nP.nodal()`.

For a series impedance `Z` with real reference impedance `Z0`, the simple reciprocal two-port pattern is:

```text
S11 = S22 = Z / (Z + 2 Z0)
S21 = S12 = 2 Z0 / (Z + 2 Z0)
```

For a shunt admittance `Y` with reference admittance `Y0`:

```text
S11 = S22 = -Y / (Y + 2 Y0)
S21 = S12 = 2 Y0 / (Y + 2 Y0)
```

### Ideal fixtures and junctions

| Constructor | Ports | Meaning |
| --- | ---: | --- |
| `Open()` | 1 | Ideal reflection coefficient `+1`. |
| `Short()` | 1 | Ideal reflection coefficient `-1`. |
| `Load()` | 1 | Matched reflection coefficient `0`. |
| `Shift90()` | 2 | Matched ideal 90-degree phase shift. |
| `Tee()` | 3 | Ideal equal-impedance junction. |
| `Tee4()` | 4 | Ideal four-way junction. |
| `Tee5()` | 5 | Ideal five-way junction. |
| `Tlin()` | 2 | Ideal lossless transmission line. |
| `Tclin()` | 4 | Ideal lossless coupled transmission line. |

Ideal public names begin with an uppercase letter. Physical microstrip constructors remain lowercase.

The ideal Tee-family matrices contain a small `1e-7` offset. This is a numerical regularization detail, not a modeled physical loss.

### Transformers

`trf()` and `trf4Port()` provide ideal transformer models. Tests should include inverse-ratio cascades, expected match, reciprocity, and lossless transmission.

### Microstrip

Physical microstrip models include:

```text
mlin, mclin, mtee, mstep, mbend, mcross, mtfr, mvgnd, mvia
```

Their equations, units, model families, metadata, and limitations are documented in [`../microstrip/README.md`](../microstrip/README.md).

## Composition

### Two-port cascade

`a.cas(b)` combines two two-ports and returns a new n-port. `nP.cascade(a, b, c)` applies the same operation across a chain.

Cascade requires two-port inputs with aligned frequency rows and reference impedance. The helper reduces its local argument array; it does not intentionally change the original n-port objects.

### Arbitrary nodal connection

`nP.nodal()` combines arbitrary port counts by building and inverting a complex connection matrix at each frequency. Use it for shunt elements, tees, dividers, diplexers, coupled structures, and hierarchical subnetworks.

See [`../nodal-analysis.md`](../nodal-analysis.md) for its calling and connection invariants.

## Public port conventions

### Tee and microstrip Tee

Public port 1 is the common branch. Ports 2 and 3 are the two outgoing branches:

```text
          port 2
            |
port 1 -----+
            |
          port 3
```

`mtee()` maps published inline-arm notation into this nP order. Its width options are `commonWidth`, `branch1Width`, and `branch2Width`.

### Coupled lines

Coupled-line ports are numbered clockwise from the upper left:

```text
port 1  ---- coupled line ----  port 2
port 4  ---- coupled line ----  port 3
```

With excitation at port 1, port 2 is through, port 4 is coupled, and port 3 is isolated. Preserve this order in `Tclin()`, `mclin()`, tests, diagrams, and nodal calls.

## Adding a constructor

1. Choose the owning subdirectory and canonical public name.
2. Document physical reference planes, port order, units, equation source, and validity range.
3. Read `global.fList` and `global.Ro` after the caller has configured them.
4. Generate a complete row-major S matrix at every frequency.
5. Set `.spars` and `.global` on a new `nPort`.
6. Attach engineering metadata where it improves auditability.
7. Export the constructor through `src/np-nport/src/index.js`.
8. Add direct numerical tests and at least one composition test.
9. Add or update a focused `dev/` browser harness.
10. Rebuild the distribution when the change is intended for browser or plugin consumption.

## Verification patterns

- A matched load has zero reflection.
- A short and open have unit reflection with the correct sign.
- A reciprocal network has `Sij = Sji` where the model requires reciprocity.
- A symmetric network has the expected equal diagonal and transmission terms.
- Cascading inverse fixtures restores a matched through path.
- Loss parameters reduce, rather than increase, transmission magnitude.
- Output row length remains `1 + n²`.
- Every complex part remains finite over the model's validity range.
- A component can be wrapped in a direct `nP.nodal()` call without changing its result.

Pin external or published reference values when possible. A self-consistency check alone cannot detect a shared equation or indexing error.
