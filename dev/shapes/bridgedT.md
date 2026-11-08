<!-- Modified: 2026-11-08 -->
# Bridged-T schematic guidance

Open `bridgedT.html` for five networks using the same shape request:

```js
nP.schematic(network, {
  shapes: ['bridgedT'],
  mount: '#drawing'
});
```

The examples show a resistive bridged-T, a five-component bridge with a multi-component shunt, four-port junctions, repeated bridged sections, and a microstrip arrangement. Their values demonstrate layout rather than a specified attenuator or filter response. Each example has one `nodal()` call with its components directly in that network.

The main path runs left to right. One or more two-port objects connect an unused main-path junction port to an unused port farther along the main path; these form upper bridges. Other unused ports feed downward paths of one or more two-port objects ending in a one-port termination. At least one bridge and one terminated shunt must be present. Several main-path components may lie between junctions. Two-port upstream networks can occupy component boxes without expanding their internals.

`Tee()` and `mtee()` retain their declared through ports 2 and 3. Their common port 1 rotates upward for a bridge or downward for a shunt. Where a bridge and shunt meet the same main-path position, `Tee4()` supplies the four terminals: the examples use ports 2 and 4 horizontally, port 3 upward and port 1 downward. ORI derives straight opposite port pairs from canonical geometry when no through pair is declared; it preserves each numbered port's actual node assignment.

## Board data and shared operations

`schematicShapeBoards.bridgedT` supplies the path predicates, repeated component/wire tiles, `connections` directed upward, and terminated `attachments` directed downward. No bridged-T JavaScript matching or drawing callback is present in the definition.

ORI binds the main path first, then traces connections between its unused numbered ports. It marks both bridge endpoints and every bridge component as consumed before tracing the remaining terminated shunts. Full coverage is required; extra components and dangling or mismatched connections are errors.

The shared path-spacing operation measures bridge symbol spans and wire boxes. If a bridge needs more horizontal space, it grows the main path's flexible wire boxes in grid steps. It does not shrink symbols or insert placeholder components. Straight canonical terminal pairs are required along these paths; bend-following bridged layouts are outside this first definition.

The shared connection operation reserves upper tracks from actual component bounds and the declared clearance. Disjoint intervals can share a track. Shorter intervals take inner tracks first, leaving enclosing bridges farther out. It places bridge components with ORI's existing tile operation and joins each end using the existing corner-wire operation. Every corner has no dot and is separated from symbols by straight wire boxes. Grid alignment, labels, node numbers, SVG rendering and PNG copying use the common code.

The same operations can draw connections below and shunts above by changing the data directions; a test exercises that arrangement under another board name. `interface: {from: [1], to: [2]}` also makes the board available to the shared node-bounded composition operation. Named shape selection remains explicit: an unhinted call continues to use the generic board.


## Blind detection

The whole-network examples now omit shape hints and log `drawing.detected`. ORI uses the independently detected board; the equivalent explicit call remains valid. Any example composing several bounded sections keeps its explicit section list, because automatic composition detection is not enabled.
