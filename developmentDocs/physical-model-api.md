<!-- Modified: 2026-09-06 -->
# Physical-model API contract

Physical transmission-media constructors use one canonical options object. This contract applies to microstrip now and to future stripline, coaxial-line, and waveguide families.

## Public naming and units

- Use lower camel case.
- Use complete engineering names rather than equation abbreviations.
- All physical lengths are meters.
- `relativePermittivity` and `relativePermeability` are dimensionless.
- `resistivity` is always absolute bulk resistivity in ohm-meters.
- `lossTangent` is dimensionless.
- `roughnessRms` is meters.
- `referenceTemperature` and `global.Temp` are absolute temperatures in kelvin.
- Geometry names describe their physical role, such as `inputWidth`, `outputWidth`, `commonWidth`, `innerDiameter`, or `broadWall`.

Canonical shared properties are:

```text
width, spacing, height, length, thickness
relativePermittivity, relativePermeability
resistivity, lossTangent, roughnessRms
```

## Compatibility

Existing positional `mlin()`, `mclin()`, and `mtee()` calls remain supported. Existing object spellings such as `Width`, `Height`, `Thickness`, `Space`, `Length`, `er`, `rho`, and `tand` remain accepted as legacy aliases.

Legacy `rho` deliberately retains its historical constructor-specific meaning:

- For line, coupled-line, tee, step, bend, and cross models it is a dimensionless multiplier of `COPPER_RESISTIVITY`.
- For via models it is absolute resistivity in ohm-meters.

New code must use `resistivity`, which always means absolute ohm-meters. A call that supplies both `rho` and `resistivity`, or both a canonical property and its legacy alias, is rejected. Unknown properties are rejected so spelling errors cannot silently select defaults.

## Validation

Constructors reject non-finite values, nonpositive required dimensions and material constants, negative losses, and invalid geometry relationships. Error messages name the constructor and public property.

## Metadata

Every physical constructor returns its established metadata for compatibility and also exposes:

```js
component.physicalModel = {
    family,
    model,
    geometry,
    material,
    analysis,
    sources,
    validity
};
```

Only applicable optional fields are present. Geometry and material values use canonical public names and units.

## Canonical microstrip examples

```js
nP.mlin({
    width,
    height,
    length,
    thickness,
    relativePermittivity,
    resistivity,
    lossTangent,
    roughnessRms
});

nP.mclin({
    width,
    spacing,
    height,
    thickness,
    length,
    relativePermittivity,
    resistivity,
    lossTangent,
    roughnessRms
});

nP.mtee({
    commonWidth,
    branch1Width,
    branch2Width,
    height,
    thickness,
    relativePermittivity,
    resistivity,
    lossTangent,
    roughnessRms
});
```

Future physical families must follow this contract before their individual equations and topology-specific properties are added.
