<!-- Modified: 2026-09-08 -->
# Dependent sources and a MESFET model

This note records the design considerations for adding a small-signal MESFET model to nP. The proposed device will contain one or more dependent sources and parasitic components, then expose a normal n-port result that can be connected with `nodal()` or `cascade()`.

## 1. Controlled-source vocabulary

The four standard linear dependent sources are:

| Name | Control quantity | Output quantity | Typical equation |
| --- | --- | --- | --- |
| VCVS | Voltage | Voltage | `Vout = μ Vin` |
| VCCS | Voltage | Current | `Iout = gm Vin` |
| CCCS | Current | Current | `Iout = β Iin` |
| CCVS | Current | Voltage | `Vout = rm Iin` |

The gain symbols have different units:

- VCVS gain `μ`: dimensionless.
- VCCS transconductance `gm`: siemens.
- CCCS gain `β`: dimensionless.
- CCVS transresistance `rm`: ohms.

Every constructor must define port orientation, positive current direction, reference node conventions, and the sign of the controlled quantity. These choices matter more than the constructor names because a sign error can turn a stable device into an apparently unstable one.

## 2. Why dependent sources do not immediately look like nP components

nP's ordinary network objects are described by power waves:

$$
\mathbf b = \mathbf S\mathbf a + \mathbf c
$$

Dependent sources are normally written using voltages and currents. For example, a VCCS is naturally expressed as `Iout = gm Vin`, not as a complete S-matrix. Converting a controlled-source equation to S-parameters requires port reference impedances and a consistent voltage/current-to-wave normalization.

An ideal controlled source can also produce a singular or poorly conditioned intermediate matrix. It may have infinite input impedance, zero output impedance, or an unconstrained voltage/current variable. A direct S-matrix-only representation can therefore be less robust than the original voltage/current equations.

## 3. Two possible implementation paths

### Path A: solve the complete device internally

Build the controlled sources and parasitic RLC elements inside a MESFET constructor. Solve the internal voltage/current system, convert the external device behavior to a 2-port S-matrix, and return a normal nP object:

```text
MESFET internals
    dependent sources + parasitic RLC
            ↓
    internal linear solve
            ↓
    external S(f) and explicit C(f)
            ↓
    ordinary nP 2-port
```

This path fits the existing architecture best. The completed MESFET can be passed to `nP.nodal()` alongside capacitors, resistors, and transmission lines. Its internal voltage/current bookkeeping remains hidden from users.

### Path B: expose controlled sources directly to `nodal()`

Extend the global network solver so each component can contribute voltage/current constitutive equations in addition to S-parameter equations. This is similar to modified nodal analysis (MNA) or a generalized hybrid-parameter formulation.

This path would allow users to stitch a VCCS, VCVS, CCCS, or CCVS directly to external parasitics. It is more flexible, but it changes the assumptions of the current wave-based `nodal()` assembly and requires new variable types, equation rows, source orientations, and singularity handling.

It should not be undertaken merely to build the first MESFET model.

## 4. Recommended architecture

Use an internal linear controlled-source representation and solve the complete MESFET as one device. The public MESFET constructor should return a normal nP 2-port with:

```js
device.spars; // frequency-aligned external S-parameters
device.noise; // explicit covariance, when a noise model is supplied
```

The four source types can be internal primitives or later become public constructors if there is a clear use case. If made public, they should share one constitutive-source implementation rather than duplicate sign and normalization logic.

Use explicit engineering names and units in options objects. A future public shape might resemble:

```js
{
    transconductance: 0.02, // S
    transresistance: 50,     // ohms
    gain: 2,                 // dimensionless
    frequency: ...
}
```

The exact option names are not yet settled. Do not silently mix volts, millivolts, amps, milliamps, ohms, and siemens.

## 5. MESFET small-signal structure

A practical first MESFET model can contain:

- Gate-source and gate-drain capacitances.
- Drain-source output conductance or resistance.
- A voltage-controlled drain current source (`gm · vgs`).
- Optional gate resistance and package parasitics.
- Optional drain/source series resistances.
- Frequency-dependent or bias-dependent small-signal parameters.

The internal circuit is linearized around a bias point. The public device remains a frequency-swept n-port, so it can be reused in larger nP networks.

## 6. Noise rules

An ideal dependent source is noiseless unless an explicit noise model is attached. Its signal gain does not imply thermal noise.

The passive fallback

$$
\mathbf C = k_BT(\mathbf I-\mathbf S\mathbf S^\dagger)
$$

must not be used as the amplifier's noise model. An active S-matrix and temperature do not uniquely determine active-device noise.

A MESFET constructor must therefore either:

1. Provide an explicit noise-wave covariance matrix `C(f)`, or
2. Provide physical noise sources internally and propagate them to the external ports.

Noise parameters such as `Fmin`, `Rn`, and `Γopt` can be converted into an external covariance model, but a single noise figure is not enough to determine every covariance entry. A semi-ideal test model may deliberately choose one output noise source and document that assumption.

## 7. Interaction with `nodal()` and cascade

Once the MESFET returns an external `(S, C)` pair, no special user-facing network syntax is needed:

```js
var network = nP.nodal(
    [inputCapacitor, 1, 2],
    [mesfet, 2, 3],
    [outputCapacitor, 3, 4],
    ['out', 1, 4]
);
```

`nodal()` uses the MESFET S-matrix in the deterministic solve and its explicit covariance in the noise propagation. The same pair can be carried through `cascade()` when the device is part of a two-port chain.

The user does not need to know the internal controlled-source equations, the global matrix size, or the noise-transfer matrix `F`. Those remain implementation details of the device and network solvers.

## 8. Development and validation plan

1. Define and test sign conventions for each controlled-source type.
2. Implement an internal voltage/current linear solve for a minimal VCCS.
3. Add parasitic RLC elements around the controlled source.
4. Convert the solved external behavior to S-parameters.
5. Compare against hand-derived low-frequency and high-frequency limits.
6. Add an explicit MESFET noise model separately from the signal model.
7. Connect the resulting device through `nodal()` and compare against an equivalent direct solve.
8. Verify stability, finite values, passivity of passive submodels, and covariance Hermitian/positive-semidefinite checks.

The first implementation should avoid changing the existing `nodal()` equation format. Direct controlled-source components can be considered later if multiple device models demonstrate a real need for generalized MNA support.
