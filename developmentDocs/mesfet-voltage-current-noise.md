<!-- Modified: 2026-09-08 -->
# Floating MESFET voltage/current model and noise

This note describes a possible frequency-domain voltage/current (modified nodal analysis, or MNA) model for a three-terminal MESFET. It is separate from the existing wave-based `nP.nodal()` solver. The model is floating: gate, drain, and source are all terminals, and none is implicitly ground.

## Why use a separate solver?

The present n-port interconnection method works with incident and reflected waves:

```text
b = S a + c
b = Γ a
```

A transistor model is naturally specified by node voltages, branch currents, controlled sources, and parasitic elements. A voltage/current solver can assemble those equations directly and later convert the solved terminal behavior into S-parameters.

## Floating small-signal model

Use external terminals `G`, `D`, and `S`, and intrinsic terminals `gᵢ`, `dᵢ`, and `sᵢ`:

```text
external D o──Rd──o intrinsic d
external G o──Rg──o intrinsic g
external S o──Rs──o intrinsic s

intrinsic g ── Cgs ── intrinsic s
intrinsic g ── Cgd ── intrinsic d
intrinsic d ── Cds ── intrinsic s
intrinsic d ── gds ── intrinsic s

controlled drain current: i_gm = gm (Vgᵢ - Vsᵢ), directed dᵢ → sᵢ
```

The series resistances model package/contact parasitics. The capacitors model charge-storage and fringing effects. `gds` models finite drain-source output conductance, and `gm` is the transconductance.

## Branch and node numbering

```text
1 = external G       4 = intrinsic g
2 = external D       5 = intrinsic d
3 = external S       6 = intrinsic s
```

Choose these branch orientations:

```text
e1: Rg       1 → 4
e2: Rd       2 → 5
e3: Rs       3 → 6
e4: Cgs      4 → 6
e5: Cgd      4 → 5
e6: Cds      5 → 6
e7: gm       5 → 6
e8: gds      5 → 6
```

The `6 × 8` incidence matrix is:

```text
B =

[  1   0   0   0   0   0   0   0 ]
[  0   1   0   0   0   0   0   0 ]
[  0   0   1   0   0   0   0   0 ]
[ -1   0   0   1   1   0   0   0 ]
[  0  -1   0   0  -1   1   1   1 ]
[  0   0  -1  -1   0  -1  -1  -1 ]
```

With the convention that each branch voltage is the voltage at the `+1` node minus the voltage at the `−1` node:

```text
vbranch = Bᵀ vnode
inode   = B ibranch
```

The signs describe orientation and conservation. This differs from a wave Γ matrix, whose positive ones swap paired incoming and outgoing waves.

## Deterministic frequency-domain equations

At angular frequency `ω`, let `s = jω` and define:

```text
yrg  = 1/Rg
yrd  = 1/Rd
yrs  = 1/Rs
ycgs = s Cgs
ycgd = s Cgd
ycds = s Cds
ygds = gds
gm   = transconductance
```

The branch relations are:

```text
I_Rg  = yrg  (V1 - V4)       I_Rd  = yrd  (V2 - V5)
I_Rs  = yrs  (V3 - V6)       I_Cgs = ycgs (V4 - V6)
I_Cgd = ycgd (V4 - V5)       I_Cds = ycds (V5 - V6)
I_gds = ygds (V5 - V6)       I_gm  = gm   (V4 - V6)
```

The assembled `6 × 6` nodal matrix is:

```text
Y =

[ yrg   0    0   -yrg                         0                         0 ]
[  0   yrd   0    0                        -yrd                        0 ]
[  0    0   yrs   0                          0                       -yrs ]
[ -yrg  0    0   yrg+ycgs+ycgd            -ycgd                    -ycgs ]
[  0  -yrd   0   gm-ycgd       yrd+ycgd+ycds+ygds       -gm-ycds-ygds ]
[  0    0  -yrs -gm-ycgs             -ycds-ygds    yrs+ycgs+ycds+ygds+gm ]
```

The deterministic solve is `Y V = Iexternal`. A reference node or explicit reference constraint is required because a completely floating network has arbitrary common-mode voltage.

## Adding semiconductor noise

Noise does not change `B` or the deterministic `Y`. It adds stochastic branch sources to the right-hand side:

```text
Y V = Iexternal + Cnoise in
```

A minimal RF model uses drain-channel noise and gate noise:

```text
in = [ ind ]
     [ ing ]

Cnoise =
[  0   0 ]
[  0   0 ]
[  0   0 ]
[  0   1 ]
[  1   0 ]
[ -1  -1 ]
```

Their covariance is:

```text
Q(f, bias) = E{ in inᴴ }

       [ Sdd(f)   Sdg(f)  ]
     = [                    ]
       [ Sdg*(f)  Sgg(f)  ]
```

The diagonal terms are drain and gate noise PSDs. `Sdg` is complex drain/gate correlation. Typical mechanisms are channel thermal noise, induced gate noise, Schottky gate shot noise, `1/f` noise, and measured excess noise. Gate shot noise has a basic term proportional to `2 q Igate`; channel-noise coefficients are model-dependent.

The parasitic resistors also contribute thermal noise, with PSD proportional to `4 k T / R` under the project's PSD convention. Append those sources to `Cnoise` and enlarge `Q` as needed.

## Propagating covariance

Solve `Y X = Cnoise` for `X`; this is preferable to explicitly forming `Y⁻¹`. Then:

```text
Cv = X Q Xᴴ
   = Y⁻¹ Cnoise Q Cnoiseᴴ (Y⁻¹)ᴴ
```

Select the external-terminal rows for gate, drain, and source noise covariance. The same solved voltages and branch currents provide terminal current noise.

## Conversion to S-parameters

Apply independent terminal excitations and record terminal voltages and currents to construct a three-port `Z` or `Y` description. For a scalar reference impedance `Z0`:

```text
S = (Z - Z0 I) (Z + Z0 I)⁻¹
```

Transform the terminal voltage/current noise covariance into noise-wave covariance, then expose noise figure, noise parameters, or output noise. The resulting three-port nPort can be reused by `nP.cascade()` or the existing wave-based `nP.nodal()`.

## Overall data flow

```text
MESFET branches + sparse V/I topology
    → terminal Z/Y and noise covariance
    → optional S-parameter/noise-wave conversion
    → existing n-port composition
```
