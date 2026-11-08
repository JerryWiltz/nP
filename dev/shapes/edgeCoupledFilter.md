<!-- Modified: 2026-11-08 -->
# Edge-coupled filter schematic guidance

Open `edgeCoupledFilter.html` for five drawings: a three-section ideal filter, the same network flipped vertically, microstrip sections, seven sections in one nodal network, and alternative short/load terminations. The existing top-level `dev/edgeCoupledFilter.html` noise-analysis page is separate and unchanged.

```js
nP.schematic(network, {
  shapes: ['edgeCoupledFilter'],
  mount: '#drawing'
});
```

The default staircase progresses right and downward. To progress right and upward:

```js
nP.schematic(network, {
  shapes: ['edgeCoupledFilter'],
  flipVertical: true,
  mount: '#upward-drawing'
});
```

Each coupled section retains its canonical four-port symbol and actual electrical node assignments. The finished nodal network has two external ports; those network port numbers are separate from the numbered terminals of each internal coupled section.

## Connections and board data

The definition in `schematicShapeBoards.js` accepts one or more `Tclin()`/`mclin()` symbol occurrences along a path through numbered ports 1 and 3, in either direction. Port 3 of one section connects to port 1 of the next in the examples. Each remaining numbered port must connect directly to a one-port termination supplied by the network. Ordinary filter examples use `Open()`. No termination or connecting node is invented. Reordering nodal rows does not change the traced path. The first board does not include intermediate two-port parts between sections or between a section and its termination.

The board declares allowed `portPairs`, repeated component/wire boxes, and tile `orientation: {terminals: 'leads', advance: 'down'}`. Shared ORI operations orient each section from its canonical input and output lead directions. The output terminal lies below the input terminal, so the next wire begins at that lower height. Repeated sections therefore form the staircase without per-section coordinates. Symbol dimensions come from the canonical drawing geometry, not from the transmission line's physical length parameter.

`direction: 'terminal'` makes each termination attachment follow its actual transformed lead direction. Two opposite unused ports consequently receive left-facing and right-facing terminations. The shared `spacing: 'attachments'` policy previews body bounds and calculates additional main-path wire spacing when adjacent terminations need clearance. The calculation uses component geometry and progress along the path, not circuit names or a stage count. Preview placements do not consume component reference designators.

`flipVertical` uses ORI's existing reflection operation before annotation placement. It reflects complete geometry, including canonical symbol transforms and numbered terminals, while labels are placed afterward as readable text. The option accepts a boolean and also works for other ORI nodal boards and compositions, including series/ladder sections. Cascade and signal-path drawings do not support that option.

Dense terminal groups use the common annotation search. If its bounded search cannot place every annotation, ORI uses the existing wider spacing fallback for guided and generic boards. Node dots remain on their electrical wires; labels and circled node numbers remain clear of symbols, wires and other annotations.

The definition contains no JavaScript matcher or drawing callback. The same numbered-port, terminal-direction and reflection operations accept another board name or upward advancement declared in data. The board's single-node input/output interface also permits series sections before or after the filter within one nodal network.


## Blind detection

The whole-network examples now omit shape hints and log `drawing.detected`. ORI uses the independently detected board; the equivalent explicit call remains valid. Any example composing several bounded sections keeps its explicit section list, because automatic composition detection is not enabled.
