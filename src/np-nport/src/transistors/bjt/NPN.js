// Modified: 2026-11-15
import {bjtConstructor} from './bjtConstructor';
import {npnModel} from './npnModels';

export function NPN(options = {}) {
    return bjtConstructor(options, 'NPN', npnModel, 1);
}
