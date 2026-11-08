<!-- Modified: 2026-11-07 -->
# Power-combiner schematic guidance

Open `powerCombiner.html` to compare four networks using `shapes: ['powerCombiner']`:

- The transformer arrangement built from `trf()`, `trfAuto()`, two tees and an isolation resistor.
- An ideal two-way Wilkinson with quarter-wave lines at 2 GHz.
- The Wilkinson arrangement with microstrip junctions and lines, using illustrative rather than tuned dimensions.
- Unequal arm component counts, exercising spacing rather than matched RF performance.

Each network is one `nodal()` definition. Port 2 is the upper input on the left, port 3 is the lower input on the left, and port 1 is the common output on the right. The shape preserves the numbered ports and nodes in the network. It does not renumber the output to port 3 or alter electrical simulation.

```js
nP.schematic(network, {
  shapes: ['powerCombiner'],
  mount: '#drawing'
});
```

## Reusing the divider board

The complete shape definition is data in `schematicShapeBoards.js`:

```js
powerCombiner: {
  name: 'powerCombiner',
  version: 1,
  use: 'powerDivider',
  transform: {mirrorX: true}
}
```

ORI resolves `use` through the board registry, binds the network to the existing transformer or Wilkinson description, and reflects the resulting geometry about the vertical axis through x = 0. Negative SVG coordinates are valid; the finalizer computes a viewBox containing the whole drawing. The shared reflection operation transforms component anchors, canonical symbol orientation, numbered terminal coordinates, wire paths, node dots and external ports together. Annotation placement happens afterward, so the node numbers and component labels remain ordinary readable text.

The reflected geometry uses the same component and wire boxes, terminal spacing, centerline alignment and variable arm lengths as the divider. There is no power-combiner-specific JavaScript matcher or layout helper. Reference cycles and unknown boards produce errors rather than recursive layout attempts. The original network and referenced board data remain unchanged.

Both ideal examples retain matched ports, isolated input ports and reciprocal paths of magnitude 1/√2 between either input and the common port. This is the individual S-parameter path magnitude; coherent combining depends on both applied input signals and their phases.

This shape covers the existing three-port transformer and single-stage Wilkinson arrangements. The fourth example in `powerDivider.html` composes divider and combiner boards within one nodal network using node-bounded shape sections. Their shared interfaces must have matching port spacing and ordering. The generic splitter/combiner example in `../trf5Port.html` is retained as its separate baseline.
