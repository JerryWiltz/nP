# Raw Technical Notes
<!-- Modified: 2026-10-04 -->

This folder collects raw research material for future RF/microwave model work.

## Noise analysis references

- `keysight_noise_figure_measurement.pdf` — Keysight Technologies, *High-Accuracy Noise Figure Measurements with Network Analyzers*, application note 5990-5800. See p. 13, Figure 6 and the noise-parameter equation for Fmin, optimum source reflection, and noise resistance. Source: https://www.keysight.com/content/dam/keysight/en/doc/gate/application-notes/5990-5800.pdf
- `randa_multiport_noise_2001.pdf` — J. Randa, *Noise Characterization of Multiport Amplifiers*, IEEE Transactions on Microwave Theory and Techniques 49(10), 2001, pp. 1757-1763. See Section II for the multiport noise-matrix definitions and equations. Source: https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=5219
- `touchstone_ver2_1.pdf` — IBIS Open Forum, *Touchstone File Format Specification*, version 2.1, ratified January 26, 2024. See pp. 24-25 for `[Noise Data]` and the five noise-parameter fields. Source: https://www.ibis.org/touchstone_ver2.1/touchstone_ver2_1.pdf

The physical `nP.mtee()` model is implemented under `src/np-nport/src/mlin/`; its selected equations and limits are summarized in `developmentDocs/microstrip/README.md`. Keep source captures and competing equations here for future model checks.

## Amplifier references

- Watkins-Johnson Company, *Application Information for Thin Film Cascadable Amplifiers*. This 15-page scan is numbered pp. 442-456. A separate citation places the same title in the 1993-1994 *RF and Microwave Designer's Handbook*, pp. 724-739; this scan does not establish that it is the same edition. [Archived PDF](https://datasheet.datasheetarchive.com/originals/scans/Scans-068/DSA2IH00223110.pdf); [1993-1994 citation](https://fileserver-az.core.ac.uk/download/37342817.pdf).

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
