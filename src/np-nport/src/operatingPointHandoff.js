// Modified: 2026-11-19
import {dcModelOf, dcSnapshot} from './dcModel';
import {applyInputSignal} from './signal';

// Runtime recipes retain RF objects/functions separately from data-only DC models.
export function rfConnection(components, rebuild) {
    return Object.freeze({components: Object.freeze(components.slice()), rebuild});
}

function collectPlacements(part, model, path, placements, ancestors) {
    if (dcModelOf(part) !== model) throw new TypeError('RF/DC construction snapshots differ at ' + (path || '(root)') + '.');
    if (ancestors.has(part)) throw new TypeError('RF construction recipes must not contain cycles.');
    ancestors.add(part);
    if (model.kind === 'connection') {
        const recipe = part._rfModel;
        if (!recipe || !Array.isArray(recipe.components) || typeof recipe.rebuild !== 'function' ||
            recipe.components.length !== model.definition.components.length) {
            throw new TypeError('Missing RF construction recipe at ' + (path || '(root)') + '.');
        }
        model.definition.components.forEach((child, index) => collectPlacements(recipe.components[index], child.model,
            path ? path + '/' + child.id : child.id, placements, ancestors));
    } else if (model.kind === 'nonlinear') {
        if (typeof part._rfModel?.atOperatingPoint !== 'function') {
            throw new TypeError('No RF operating-point adapter for ' + model.constructorName + ' at ' + (path || '(root)') + '.');
        }
        placements.set(path, part);
    }
    ancestors.delete(part);
}

function finiteWave(value) { return Number.isFinite(value?.x) && Number.isFinite(value?.y); }

function rebuildPlacement(part, model, path, points) {
    let result;
    if (model.kind === 'connection') {
        const recipe = part._rfModel;
        const children = model.definition.components.map((child, index) => rebuildPlacement(recipe.components[index], child.model,
            path ? path + '/' + child.id : child.id, points));
        if (children.every((child, index) => child === recipe.components[index])) return part;
        result = recipe.rebuild(children);
    } else if (points.has(path)) {
        try { result = part._rfModel.atOperatingPoint(points.get(path)); }
        catch (error) { throw new RangeError('Invalid operating point at ' + (path || '(root)') + ': ' + error.message, {cause: error}); }
        if (part.signal && !part._rfInputSignals?.length) result.signal = part.signal;
    } else return part;
    if (result === part || !result?.spars || result.spars.length !== part.spars.length ||
        result.spars.some((row, index) => row[0] !== part.spars[index][0] || row.length !== part.spars[index].length)) {
        throw new RangeError('RF rebuilding changed the frequency or port boundary at ' + (path || '(root)') + '.');
    }
    if (result.spars.some(row => row.slice(1).some(value => !finiteWave(value))) ||
        result.noise?.some(row => row.C.some(values => values.some(value => !finiteWave(value))))) {
        throw new RangeError('RF rebuilding produced nonfinite S/noise data at ' + (path || '(root)') + '.');
    }
    result._dcModel = model;
    result._schematic = part._schematic;
    // Replay external excitations through the new S matrix. Copying the old
    // output waves here would retain the RF response of the original bias.
    for (const options of part._rfInputSignals || []) applyInputSignal(result, options);
    return result;
}

// Internal handoff from the nonlinear DC solver. Records use signed
// physical junction voltages and the same placement paths as the DC netlist.
export function withOperatingPoints(part, records) {
    if (!Array.isArray(records)) throw new TypeError('Operating-point handoff needs an array of placement records.');
    const model = dcModelOf(part), placements = new Map(), points = new Map();
    collectPlacements(part, model, '', placements, new Set());
    for (const record of records) {
        if (!record || typeof record !== 'object' || Array.isArray(record) || typeof record.path !== 'string') {
            throw new TypeError('Each operating-point record needs a placement path.');
        }
        if (points.has(record.path)) throw new TypeError('Duplicate operating point at ' + (record.path || '(root)') + '.');
        if (!placements.has(record.path)) throw new TypeError('Unknown nonlinear-device placement ' + (record.path || '(root)') + '.');
        const {path, ...state} = record;
        points.set(path, dcSnapshot(state));
    }
    for (const path of placements.keys()) if (!points.has(path)) {
        throw new TypeError('Missing operating point at ' + (path || '(root)') + '.');
    }
    const result = rebuildPlacement(part, model, '', points);
    if (result !== part) result._operatingPoints = dcSnapshot(records);
    return result;
}


// Apply root-netlist placement records to immediate children before combining
// their RF matrices. Nested recipes retain the remaining local path segments.
export function connectionOperatingPoints(model, components, records) {
    return model.definition.components.map((child, index) => {
        const local = records.filter(record => record.path === child.id || record.path.startsWith(child.id + '/'))
            .map(record => ({...record, path: record.path === child.id ? '' : record.path.slice(child.id.length + 1)}));
        return local.length ? withOperatingPoints(components[index], local) : components[index];
    });
}
