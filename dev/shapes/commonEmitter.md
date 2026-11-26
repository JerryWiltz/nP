<!-- Modified: 2026-11-26 -->
# Divider-biased common-emitter amplifier

Open `commonEmitter.html` through a local server after `npm run build`.
The network follows the supplied `npn2.jpg` drawing, with demonstration values:
12 V, 100 kΩ/22 kΩ base divider, 2.2 kΩ collector resistor, 1 kΩ emitter
resistor, and four 10 nF capacitors. Nodes 1 and 5 are the two RF ports.

`nodal()` determines bias before RF. `schematic(amplifier)` independently
detects `commonEmitter`; it uses the network's original components and nodes.
The diagram shows the supply bypass (`c2`) separately from emitter bypass (`c3`).
The voltage source and its Short termination sit to the right of the supply
bypass. Along the upper rail, R1 feeds the collector Tee, then the bypass Tee,
then V1. The collector Tee connects `[18, 6, 8]`, the bypass Tee `[16, 8, 7]`,
V1 connects `[7, 17]`, and the supply bypass connects `[16, 22]`. The unnumbered
base-divider and bypass-return connections retain the earlier labels 21 and 22.
Rendered component labels are assigned by the schematic renderer, independently
of JavaScript variable names.
The separate emitter resistor and capacitor branches end with their Short
symbols on the same baseline, despite different component-symbol heights.
The layout is solved from terminal directions and ordered regions. Supply returns
end above the output path; related branches share measured component centers and
termination baselines. Caption and terminal-escape space participates in placement.
There are no amplifier-specific coordinates, ground offsets or stretched exit leads.
The expected collector current is approximately 1.308 mA. The supply bypass
affects RF behavior, so this network need not have the same S-parameters as
the Tech Note example without that capacitor.

Inspect the input/output flow, base divider, collector feed, emitter bypass,
numbered terminals, labels and grounds. The initial board supports a grounded
V supply, a Tee4 base junction, Tee collector/supply branches, two coupling
capacitors and either separate emitter R/C branches, `sePaRC()`, or an
unbypassed emitter resistor. Supply bypass is optional. Other bias topologies
remain outside this board's coverage.

The DC table uses `operatingPoint.out('vbe', 'vce', 'icmA',
{component: q1, label: 'Q1'})` and the built-in table renderer.
