// Modified: 2026-11-09
// nP entry point for hosts that provide their own controlled execution UI.
// Legacy browser-development helpers from np-misc are intentionally excluded.
export * from './np-math/index';
export * from './np-global/index';
export * from './np-chart/index';
// These return data or SVG text without mounting a drawing or invoking browser UI.
// Retain the DOM chart exports above for the host's controlled rendering side.
export {schematicGraph, schematicTopology, schematicSvg} from './np-chart/src/schematic';
export * from './np-nport/index';
export * from './np-digital/index';
