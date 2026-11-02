// Modified: 2026-10-28
import {schematicSymbolMap, schematicSymbolVariants} from './schematicSymbolMap';

export function schematicPart(constructorName, parameters = {}, variant) {
    const symbol = variant === undefined ? schematicSymbolMap[constructorName] :
        schematicSymbolVariants[constructorName]?.[variant];
    if (!symbol) {
        throw new RangeError(`No bundled schematic symbol for ${constructorName}` +
            (variant === undefined ? '.' : ` variant ${variant}.`));
    }
    return {...parameters, kind: 'component', symbol};
}
