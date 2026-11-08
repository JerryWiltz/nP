<!-- Modified: 2026-11-08 -->
# Parallel and nested shape composition

Open `parallelComposition.html` after rebuilding `dist/nP.js`. Each example has one `nodal()` network; existing shape names guide its paths, while direct `Tee()` and `Tee4()` junctions use canonical symbols. Component values illustrate layout rather than RF matching.

The page shows:

1. Two resistor paths between ideal tees.
2. A series path above a ladder path.
3. A nested splitter feeding two amplifiers, beside a ladder track, with all three paths joining a `Tee4()`.
4. Nested splitting into three independent external outputs.
5. An intentionally reversed track order that reports a crossover error.
6. A successful drawing after that error, with the shape-list order reversed.

The composer measures complete sections before positioning them. Electrical boundary nodes determine the section graph, splitting creates ordered tracks, and complete drawing bounds determine the required space above and below each section's connection axis. Downward shunts do not raise the horizontal track, and boundary routing respects the existing terminal lead directions when choosing bends. Connections use the common grid wire and corner boxes. Every node number and numbered component terminal comes from `nodal()`; the shape list adds no electrical parts or connections.

This is the first stage of parallel composition: crossover routing between sections is disabled. Click **Demonstrate crossover error** to run the deliberate failure; normal page loading produces no intentional console errors. The expected inline error is part of the page, and the final drawing demonstrates that subsequent JavaScript continues. A route failure does not prove that the network is mathematically nonplanar. Existing single-board matching coverage is unchanged.

The implementation belongs to the shared `schematicBoardComposition.js` operation and the shared graph router. No coordinates, constructor names or example-specific matching callbacks were added to a shape definition. See `developmentDocs/schematicShapeVocabulary.md` for the signature and limitations.
