<!-- Modified: 2026-09-06 -->
# nP documentation

nP is a JavaScript library for constructing, analyzing, and visualizing RF and microwave networks.

Start with the [project README](https://github.com/JerryWiltz/nP#readme) for installation, the normal analysis workflow, a circuit example, and a compact API overview.

## Reference material

- [Legacy API reference](./legacy-api-reference.md) preserves the former long-form README while its constructor documentation is modernized.
- The repository's [`developmentDocs/`](https://github.com/JerryWiltz/nP/tree/master/developmentDocs) directory contains physical-model contracts, equation provenance, design decisions, and verification guidance.

## Basic workflow

1. Set `nP.global.fList`.
2. Create components as n-port objects.
3. Connect them with `nP.nodal()` or `nP.cascade()`.
4. Extract data with `.out(...)`.
5. Display the result with `nP.lineChart()`, `nP.lineTable()`, or `nP.smithChart()`.
