<!-- Modified: 2026-07-02 -->

# Coax In Air Notes

This note describes an ideal coaxial transmission line where the dielectric is air:

```text
er = 1
tand = 0
```

For an ideal air-filled coax, the fields are contained between the inner and outer conductors and the propagation mode is TEM. This is cleaner than microstrip because the dielectric is homogeneous and the cross-section has a known closed-form solution.

```text
ereff = 1
vp = C0
```

## Geometry

Coaxial line cross section:

```text
        outer conductor inner radius = b

        +-----------------------+
        |                       |
        |        air            |
        |          +---+        |
        |          |   |        |
        |          +---+        |
        |                       |
        +-----------------------+

        inner conductor radius = a
```

Variables:

```text
a       = inner conductor radius, meters
b       = outer conductor inner radius, meters
Length  = line length, meters
Ro      = S-parameter reference impedance, ohms
Zo      = coax characteristic impedance, ohms
```

Requirements:

```text
b > a
a > 0
```

For the ideal first model:

```text
conductor loss = 0
dielectric loss = 0
```

## Step 1: Capacitance Per Unit Length

For an air-filled coax, the exact capacitance per unit length is:

```text
Cprime = 2 * pi * EPSILON0 / ln(b / a)
```

Units:

```text
Cprime = farads per meter
```

## Maxwell Equation Approach

The coax result can also be derived directly from Maxwell's equations. For an ideal coax carrying a TEM wave, the electric field is radial and the magnetic field is circular around the inner conductor:

```text
E = E_r(r) r_hat
H = H_phi(r) phi_hat
```

where `r` is the radial distance from the center conductor.

The relevant static forms of Maxwell's equations are:

```text
div(D) = rho_v
curl(H) = J
```

with:

```text
D = EPSILON0 * E
B = MU0 * H
```

For the capacitance, use Gauss's law on a cylindrical surface of radius `r` and length `l` between the conductors:

```text
integral(D dot n) dA = Q
```

Because of cylindrical symmetry, `D` is constant over the cylindrical surface:

```text
D_r * (2 * pi * r * l) = Q
```

So:

```text
D_r = Q / (2 * pi * r * l)
E_r = Q / (2 * pi * EPSILON0 * r * l)
```

Let charge per unit length be:

```text
Qprime = Q / l
```

Then:

```text
E_r = Qprime / (2 * pi * EPSILON0 * r)
```

Voltage is the integral of electric field from inner conductor radius `a` to outer conductor inner radius `b`:

```text
V = integral_a^b E_r dr
V = Qprime / (2 * pi * EPSILON0) * ln(b / a)
```

Capacitance per unit length is:

```text
Cprime = Qprime / V
Cprime = 2 * pi * EPSILON0 / ln(b / a)
```

For the inductance, use Ampere's law around a circular path of radius `r`:

```text
integral(H dot dl) = I
```

Again, by cylindrical symmetry:

```text
H_phi * (2 * pi * r) = I
H_phi = I / (2 * pi * r)
```

Magnetic energy per unit length is:

```text
Wmprime = 0.5 * integral(MU0 * |H|^2) dA
```

For the coax annulus:

```text
Wmprime = 0.5 * integral_a^b MU0 * (I / (2 * pi * r))^2 * (2 * pi * r) dr
Wmprime = MU0 * I^2 / (4 * pi) * ln(b / a)
```

Match that to the transmission-line magnetic energy:

```text
Wmprime = 0.5 * Lprime * I^2
```

Therefore:

```text
Lprime = MU0 / (2 * pi) * ln(b / a)
```

Now:

```text
Zo = sqrt(Lprime / Cprime)
Zo = VACUUM_IMPEDANCE / (2 * pi) * ln(b / a)
```

and:

```text
vp = 1 / sqrt(Lprime * Cprime)
vp = 1 / sqrt(MU0 * EPSILON0)
vp = C0
```

This is why air-filled coax does not need a fitted effective-dielectric model. The homogeneous TEM field solution gives `Zo` and velocity directly.

## Step 2: Inductance Per Unit Length

The exact inductance per unit length is:

```text
Lprime = MU0 / (2 * pi) * ln(b / a)
```

Units:

```text
Lprime = henries per meter
```

## Step 3: Characteristic Impedance

The physical definition is:

```text
Zo = sqrt(Lprime / Cprime)
```

Substituting the coax `Lprime` and `Cprime` equations:

```text
Zo = (1 / (2 * pi)) * sqrt(MU0 / EPSILON0) * ln(b / a)
```

Using the nP shared constant name:

```text
VACUUM_IMPEDANCE = sqrt(MU0 / EPSILON0)
```

so:

```text
Zo = VACUUM_IMPEDANCE / (2 * pi) * ln(b / a)
```

Since `VACUUM_IMPEDANCE` is about 376.730313668 ohms:

```text
Zo approximately 60 * ln(b / a)
```

This is exact for ideal air-filled coax with perfect conductors.

## Step 4: Propagation Constant

For a lossless air-filled coax:

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

## Step 5: 2-Port S-Parameters, Matched To Zo

If the S-parameter reference impedance equals the coax characteristic impedance:

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

The magnitudes are:

```text
abs(s21) = 1
abs(s12) = 1
```

and the phases are:

```text
angle(s21) = -theta
angle(s12) = -theta
```

## Step 6: 2-Port S-Parameters With A Different Reference Impedance

If the coax characteristic impedance and S-parameter reference impedance are different:

```text
Ro != Zo
```

then the line is not matched in that S-parameter reference system.

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

When `Ro = Zo`, these equations reduce to:

```text
s11 = 0
s22 = 0
s21 = exp(-j * theta)
s12 = exp(-j * theta)
```

## What This Means For nP

An ideal `coaxInAir` model would need only:

```text
a
b
Length
frequency list
Ro
```

Then it would compute:

```text
Zo = VACUUM_IMPEDANCE / (2 * pi) * ln(b / a)
beta = 2 * pi * frequency / C0
theta = beta * Length
```

and return one 2-port S-parameter row for each frequency:

```text
[frequency, s11, s12, s21, s22]
```

where each S-parameter is a `complex()` object.

## Limits Of This Simplification

The ideal air-filled coax model ignores:

- conductor loss,
- finite conductor roughness,
- dielectric support beads or spacers,
- connector launch discontinuities,
- higher-order modes above cutoff,
- imperfect shields,
- radiation from openings or transitions.

For a normal below-cutoff coax section with air dielectric and good conductors, the ideal TEM equations are a very strong starting point.
