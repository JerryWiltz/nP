# Raw Technical Notes
<!-- Modified: 2026-06-27 -->

This folder collects raw research material for future RF/microwave model work.

Immediate target: improve `nP.mtee()` so it can take physical dimensions, physical constants, and frequency, then produce S-parameters from the model rather than using the current placeholder-style ideal Tee behavior.

For each paper or source, capture:

- Title
- Author
- Publication/source
- Page, figure, and equation numbers
- Geometry assumptions
- Variable names and units
- Frequency dependence
- Any validity limits such as substrate range, width/height range, or quasi-static assumptions

Use common nP names for shared physical constants:

- `INCH_TO_METER`
- `MIL_TO_METER`
- `C0`
- `EPSILON0`
- `MU0`
- `VACUUM_IMPEDANCE`
- `COPPER_RESISTIVITY`

If a paper uses another symbol, note the mapping rather than changing names. Example: `eta_0 = VACUUM_IMPEDANCE`.

Useful `mtee()` equation targets:

- Microstrip Tee equivalent capacitance or susceptance
- Junction discontinuity model
- Frequency-dependent parasitic model
- Conversion from equivalent circuit to 3-port S-parameters
- Required physical inputs such as `w1`, `w2`, `h`, `er`, thickness, loss tangent, conductor resistivity, and frequency

Keep implementation code in `src/np-nport/src/mlin/`; keep raw source capture here.
