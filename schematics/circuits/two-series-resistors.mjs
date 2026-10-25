// Modified: 2026-10-25
// Small source circuit used to check the code-to-schematic workflow.
import * as nP from '../../dist/nP.esm.js';

nP.global.fList = [2e9];

var r1 = nP.R(25);
var r2 = nP.R(50);

var circuit = nP.cascade(r1, r2);
var response = circuit.out('s11dB', 's21dB');

export {circuit, response};
