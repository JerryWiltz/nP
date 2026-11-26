<!-- Modified: 2026-11-25 -->
# Schottky detector analysis

Open `schottkyDetector.html` after `npm run build`. It compares a zero-bias
SMS7630 detector with a matched pair sharing a 10 kΩ bias resistor at 1 GHz
and 300.15 K. The second circuit measures detector minus reference DC voltage.
The examples use single-junction cards with no package parasitics or thermal
model. Common bias and finite choke isolation are explicitly represented.
Both schematics are drawn directly from the analyzed nPort networks with
`nP.schematic()`. The DC measurement nodes are internal nodes, so the drawings
have one external RF input each rather than extra RF output terminations.
The renderer recognizes the reusable diodeDetector and differentialDetector
boards automatically. RF enters from the left, the differential bias rail sits
above both junctions, and the load/bypass branches terminate below on aligned
baselines. Fit drawing scales the complete view; actual size permits scrolling.
The boards contain terminal-role and ordering relations, without fixed example
coordinates or routing overrides. Named node labels use measured enclosures,
and numeric R/L/C captions use engineering units.

The plot/table report RF-induced DC changes in µV versus available input dBm.
The `inputPowerDbm: {start: -90, stop: -60, points: 7}` sweep belongs to
`rectify()`. Named `.out('deltaVoltageuV', {label: ...})` tables go directly to
the chart/table helpers; the HTML contains no sweep loop, table assembly or
voltage conversion. A separate output table reports differential sensitivity.
`rectify()` solves RF-off bias, loaded junction RF voltage and a second-order
DC correction. The returned source records expose generated junction currents and shifts.
The reference diode is not artificially held fixed or RF-isolated by the solver.
The single-diode input choke supplies a physical DC return; measurement ports
do not add DC termination resistances. Bypass capacitors remain active at RF.

This is weak-signal square-law detection. Excessive drive rejects; no high-power
peak detection, charging transient, detector noise or full temperature
compensation is implied. Full method, result fields, source convention and
independent reference decks are in
[the rectification note](../developmentDocs/analysis/rectification.md).
