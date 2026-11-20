// Modified: 2026-11-19
import {mosfetConstructor} from './mosfetConstructor';
export function PMOS(options = {}) { return mosfetConstructor(options, -1); }
