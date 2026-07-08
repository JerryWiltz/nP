<!-- Modified: 2026-07-02 -->

# Microstrip In Air Notes

This note describes a simplified microstrip-like line where the dielectric is air:

```text
er = 1
tand = 0
```

In this case there is no dielectric mixing problem. The electric field is not partly in air and partly in a dielectric substrate. It is all in air, so there is no need to compute an effective dielectric constant in the usual microstrip-substrate sense.

```text
ereff = 1
vp = C0
```

That means the normal Hammerstad/Jensen effective-dielectric correction is not needed. Hammerstad/Jensen-style equations can still be evaluated with `er = 1`, but doing that is mostly a complicated way of getting back to an air-filled line result. For this special case, it is clearer to compute the air-filled characteristic impedance directly.

## Geometry

Assume a zero-thickness or thin signal strip over an infinite ground plane:

```text
                 air

             signal strip
          <------ Width ------>
          ====================       y = Height



          --------------------       y = 0
             infinite ground
```

Variables:

```text
Width   = conductor width, meters
Height  = distance from strip to ground plane, meters
Length  = line length, meters
Ro      = S-parameter reference impedance, ohms
Zo      = line characteristic impedance, ohms
```

For the ideal first model:

```text
Thickness = 0 or ignored
rho       = 0 or ignored
tand      = 0
roughness = 0
```

The line is treated as lossless and homogeneous.

## Procedure For Zo

The physical definition is:

```text
Zo = sqrt(Lprime / Cprime)
vp = 1 / sqrt(Lprime * Cprime)
```

For a homogeneous air-filled line:

```text
vp = C0
```

Therefore:

```text
Zo = 1 / (C0 * Cprime)
```

where `Cprime` is the capacitance per unit length of the strip-over-ground geometry in air.

So the clean procedure is:

1. Define `Width` and `Height`.
2. Compute the normalized width:

```text
u = Width / Height
```

3. Compute the air-filled capacitance per unit length, `Cprime`.
4. Convert capacitance to characteristic impedance:

```text
Zo = 1 / (C0 * Cprime)
```

Equivalently, use a direct air-line closed-form approximation for `Zo`.

One common engineering approximation for a thin strip over ground in air is:

For `u <= 1`:

```text
Zo = VACUUM_IMPEDANCE / (2 * pi) * ln(8 / u + u / 4)
```

For `u > 1`:

```text
Zo = VACUUM_IMPEDANCE / (u + 1.393 + 0.667 * ln(u + 1.444))
```

These are not a new dielectric model. They are an air-filled geometry approximation. Since `er = 1`, no `sqrt(ereff)` correction is applied.

## Propagation Constant

For a lossless air-filled line:

```text
alpha = 0
beta = 2 * pi * frequency / C0
gamma = alpha + j * beta = j * beta
```

The electrical length is:

```text
theta = beta * Length
```

in radians.

## 2-Port S-Parameters, Matched To Zo

If the S-parameter reference impedance is equal to the line impedance:

```text
Ro = Zo
```

then the ideal lossless line is matched at both ports:

```text
s11 = 0
s22 = 0
s21 = exp(-j * theta)
s12 = exp(-j * theta)
```

Expanded:

```text
s21 = cos(theta) - j * sin(theta)
s12 = cos(theta) - j * sin(theta)
```

The magnitude is unity:

```text
abs(s21) = 1
abs(s12) = 1
```

and the phase is:

```text
angle(s21) = -theta
angle(s12) = -theta
```

## 2-Port S-Parameters With A Different Reference Impedance

If the line impedance and S-parameter reference impedance are not equal:

```text
Ro != Zo
```

then the line is not matched in the S-parameter system, even though the physical line itself is lossless.

Use the lossless transmission-line ABCD matrix:

```text
A = cos(theta)
B = j * Zo * sin(theta)
C = j * sin(theta) / Zo
D = cos(theta)
```

Then convert ABCD to S-parameters for equal real reference impedance `Ro`:

```text
den = A + B / Ro + C * Ro + D

s11 = (A + B / Ro - C * Ro - D) / den
s21 = 2 / den
s12 = 2 * (A * D - B * C) / den
s22 = (-A + B / Ro - C * Ro + D) / den
```

For a reciprocal lossless line:

```text
A * D - B * C = 1
```

so:

```text
s12 = s21
```

When `Ro = Zo`, the formulas reduce to the matched-line result:

```text
s11 = 0
s22 = 0
s21 = exp(-j * theta)
s12 = exp(-j * theta)
```

## What This Means For nP

An air-line model could be implemented as a simple ideal transmission line whose `Zo` is calculated from `Width` and `Height`, with:

```text
ereff = 1
vp = C0
alpha = 0
beta = 2 * pi * frequency / C0
```

The constructor would not need the full `mlin()` dielectric calculations unless conductor loss, finite thickness, surface roughness, radiation, or a non-air support material is added later.

For a first implementation, the output is just the 2-port S-parameter row at each frequency:

```text
[frequency, s11, s12, s21, s22]
```

where each S-parameter is a `complex()` object.

## Limits Of This Simplification

This air model is useful as a clean reference case. It is not a complete physical model for every real open structure.

Important limitations:

- Real conductors have finite conductivity, so `alpha` is not exactly zero.
- A real strip has finite thickness.
- A real fixture may have dielectric supports, solder mask, connectors, or nearby metal.
- A very open line can radiate.
- The simple closed-form `Zo` approximations have geometry limits.
- If the geometry is electrically large, higher-order effects may matter.

So the assumption "no Hammerstad/Jensen needed" is correct only for the ideal homogeneous air-filled line case. If a dielectric substrate is present, or if the line has mixed air/dielectric fields, effective dielectric constant is needed again.
