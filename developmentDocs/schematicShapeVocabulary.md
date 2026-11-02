<!-- Modified: 2026-11-01 -->
# Schematic shape vocabulary

A shape name expresses an engineer's intended layout. The network's connections and the canonical component symbols remain the electrical and drawing facts; a shape guides how those facts are arranged. These names describe layout intent, not a particular set of components or a fixed component count. The renderer accepts `series`, `ladder`, or `branchline` alone, and a node-bounded `series` section followed by a `ladder` section in one `nodal()` network. Without `options.shapes`, it uses its general connection rules.

| Shape | Engineering layout intent |
| --- | --- |
| `series` | Connected nPort objects of any kind form a continuous path that progresses from left to right. The existing series-of-two-ports sketch is the visual reference, but the name does not restrict the path to resistors or to a particular number of parts. Each object on the through path needs an identifiable entry and exit port. |
| `ladder` | A horizontal series path of two-port nPort objects has one or more downward shunt paths. A three-port junction such as `Tee()` or `mtee()` on the series path starts each shunt; its ports 2 and 3 carry the horizontal path and port 1 leads downward in the drawing. Each shunt contains two-port nPort objects and ends in an ideal or physical open, short, or load. The existing ladder sketch is the visual reference. |
| `branchline` | One or more rectangular cells share vertical sides. Each cell has horizontal upper and lower arms and vertical side arms. Three-port junctions connect the arms at the corners; four external ports leave the outer corners. An arm can contain one or more two-port objects, so an added series resistor does not change the rectangular layout. The number of cells and every connection come from the network. |

The shape guides placement only. The network still determines which ports connect, the number of stages, and which symbols appear.

For example, `nP.schematic(network, {shapes: ['series']})` checks for one continuous two-port path. `nP.schematic(network, {shapes: ['ladder']})` checks for junction-led shunts that end in one-port terminations. If the network does not fit the requested shape, the renderer reports an error rather than drawing a misleading circuit. Shape rules are implemented in `schematic.js`; the earlier `seriesOf2Ports` and `ladder` JSON definitions are retired.

`nP.schematic(network, {shapes: ['branchline']})` checks for a rectangular chain of cells. The `nodal()` output must have four ports, ordered top-left, top-right, bottom-right, bottom-left for the drawing. Each corner or shared junction uses a three-port symbol with through and branch port metadata, such as `Tee()` or `mtee()`. Each arm must contain at least one two-port component; `Tlin()` and `mlin()` are the normal line arms. A series component inside an arm is allowed. The renderer traces the arms from the nodal connections, rotates or reflects symbols to meet their actual ports, and reports an error if it cannot draw those connections as rectangles. The development harness includes one-cell ideal and microstrip examples and a two-cell ideal example.

For two sections in one nodal network, identify their endpoints by the node numbers already used in `nodal()`:

```js
nP.schematic(network, {
  shapes: [
    {name: 'series', from: 1, to: 4},
    {name: 'ladder', from: 4, to: 11}
  ]
});
```

The shared node `4` joins the sections. `from` and `to` name electrical nodes on the input-to-output path; they are not numeric ranges. The first `from` and final `to` must be the network's external input and output nodes. The network must have one loop-free main path, a nonempty two-port series section, and a ladder section with at least one terminated downward shunt. This node-bounded form currently supports only `series` followed by `ladder`; it does not apply to a cascade without nodal node numbers.
