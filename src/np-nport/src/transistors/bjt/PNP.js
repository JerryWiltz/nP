// Modified: 2026-11-15
import {bjtConstructor} from './bjtConstructor';
import {pnpModel} from './pnpModels';

export function PNP(options = {}) {
    return bjtConstructor(options, 'PNP', pnpModel, -1);
}
