<!-- Modified: 2026-10-23 -->
# np-nport Development Notes

`src/np-nport/` contains the common n-port object, lumped components, ideal fixtures, transmission lines, physical microstrip models, noise and intermodulation helpers, and network-composition functions.

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

The [constructor catalog](./constructorCatalog.md) lists public n-port constructors, the resulting `nPort` object and its methods, math helpers, and low-pass prototype generators. Update it whenever one of these APIs or defaults changes.

## Common component result

Every constructor returns an object based on `nPort` with:

- S-parameter rows at every frequency required by the selected analysis. Built-in constructors capture per-component options with `componentSettings(global, options)`, then use `analysisFrequencies(settings)` to include two-tone product frequencies when configured.
- Row-major square S matrices made of `complex()` values.
- Frequency-aligned full noise covariance, including for combined nPorts.
- Captured analysis settings, including the component's selected frequency list.
- `.out(...)` for display-table extraction.
- Compatibility with `nP.nodal()`.

See [`../nPortDataModel.md`](../nPortDataModel.md) for the exact row contract.

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
| `Thru()` | 2 | Matched ideal through connection. |
| `Attn()` | 2 | Matched attenuator with temperature-dependent thermal noise. |
| `Amp()` | 2 | Frequency-flat amplifier with noise covariance and optional OIP2/OIP3 sources. |
| `Shift90()` | 2 | Matched ideal 90-degree phase shift. |
| `Tee()` | 3 | Ideal equal-impedance junction. |
| `seriesTee()` | 3 | Junction for inserting a one-port as a floating series branch. |
| `Tee4()` | 4 | Ideal four-way junction. |
| `Tee5()` | 5 | Ideal five-way junction. |
| `Tlin()` | 2 | Ideal lossless transmission line. |
| `Tclin()` | 4 | Ideal lossless coupled transmission line. |
| `Coupler180()` | 4 | Matched ideal 180-degree coupler with settable coupling. |

Ideal public names begin with an uppercase letter. Physical microstrip constructors remain lowercase.

The ideal Tee-family matrices are lossless and use exact junction coefficients without a numerical offset.

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

Cascade requires two-port inputs with aligned frequency rows and a common reference impedance. It combines S-parameters and noise covariance and retains known internal amplifier intermodulation sources. The helper does not mutate the input nPorts.

### Arbitrary nodal connection

`nP.nodal()` combines arbitrary port counts by building and inverting a complex connection matrix at each frequency. Use it for shunt elements, tees, dividers, diplexers, coupled structures, and hierarchical subnetworks.

See [`../nodalAnalysis.md`](../nodalAnalysis.md) for its calling and connection invariants.

### Noise outputs

Set `global.fList` before creating components. Their noise covariance uses the temperature captured at construction.

```js
nP.global.fList = [1e9];

var amp = nP.Amp({gainDb: 20, noiseFigureDb: 4});
var attenuator = nP.Attn(3);
var chain = nP.cascade(amp, attenuator);
var noiseResults = chain.out('NF21dB', 'noiseFloor');
```

`noiseFloor` reports output noise density in dBm/Hz for input port 1 and output port 2, using matched 290 K measurement defaults. Port-specific forms such as `noiseFloor31dBmHz` work on larger nPorts. `nodal()`, `cas()`, and `cascade()` preserve combined noise covariance. Passive components contribute thermal noise at their captured temperature; ideal lossless parts add none. The diode model has bias-dependent noise.

### Intermodulation outputs

Set `global.twoTone` before creating components. Built-in constructors then supply S-parameter rows at both fundamentals and product frequencies. Custom nPorts need matching frequency rows to join the same two-tone network.

```js
nP.global.fList = [1e9];
nP.global.twoTone = {spacingHz: 1e6, p1dBm: -30, p2dBm: -25};

var amp = nP.Amp({gainDb: 20, oip3dBm: 30});
var attenuator = nP.Attn(3);
var chain = nP.cascade(amp, attenuator);
var intermodResults = chain.out('OIP3lower21dBm');
```

`nodal()`, `cas()`, and `cascade()` preserve known nonlinear sources. The diode model can supply weak junction-current and junction-charge sources. The intermodulation solver propagates generated products once through the linear network; it does not model compression or nonlinear remixing.

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
3. Capture settings with `componentSettings(global, options)`, then read `analysisFrequencies(settings)` and `global.Ro` after the caller has configured the analysis context. Respect an explicit component `fList`.
4. Generate a complete row-major S matrix at every required frequency.
5. Set `.spars` and `.global` on a new `nPort`; provide explicit covariance for active or biased noise models and a component temperature for lossy passive models. A nonlinear model must provide its own generated-wave source rather than treating a physical diode as intrinsically linear.
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
