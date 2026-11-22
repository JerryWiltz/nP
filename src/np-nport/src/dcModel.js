// Modified: 2026-11-22
import {validateTerminalNetwork} from './transistors/contactNetwork';
// Owned immutable data can be shared across circuit trees without copying each
// earlier cascade again. Caller-owned objects are always copied before freezing.
const ownedData = new WeakSet();
const models = new WeakSet();
const kinds = ['linear', 'nonlinear', 'connection', 'requiresModel'];
const qualities = ['ideal', 'physical', 'approximate', 'composite', 'unspecified'];

function modelTerminal(terminal, count) {
    return terminal === 'g' || (Number.isInteger(terminal) && terminal >= 1 && terminal <= count) ||
        (typeof terminal === 'string' && /^n[1-9]\d*$/.test(terminal));
}
function terminalList(list, count, minimum) {
    return Array.isArray(list) && list.length >= minimum &&
        Array.from(list).every(terminal => modelTerminal(terminal, count));
}
function validateDefinition(model) {
    const d = model.definition, count = model.portCount;
    if (model.kind === 'requiresModel') return;
    if (model.kind === 'connection') {
        if (d.modelId !== 'connection') throw new TypeError('A connection needs a connection definition.');
        return;
    }
    if (model.kind === 'nonlinear') {
        if (d.terminalNetwork) validateTerminalNetwork(d.terminalNetwork, count);
        if (d.modelId === 'mosfet' && count === (d.body === 'source' ? 3 : d.body === 'external' ? 4 : 0) &&
            [1, -1].includes(d.polarity) && d.record?.parameters && Number.isFinite(d.temperature) && d.temperature > 0) return;
        if (['bjt', 'jfet', 'mesfet', 'hemt'].includes(d.modelId) && count === 3 && [1, -1].includes(d.polarity) && d.record?.parameters &&
            Number.isFinite(d.temperature) && d.temperature > 0) return;
        if (['diode', 'pin', 'pin-charge'].includes(d.modelId) && (d.modelId !== 'pin' || ['forward', 'reverse'].includes(d.region)) && count === 2 && d.record?.parameters &&
            Number.isFinite(d.temperature) && d.temperature > 0) return;
        if (d.modelId === 'legacy-diode' && count === 2 && d.parameters &&
            Number.isFinite(d.temperature) && d.temperature > 0) return;
        throw new TypeError('Unknown or incomplete nonlinear DC definition.');
    }
    if (d.modelId === 'lumped') {
        if (!Array.isArray(d.elements) || !d.elements.length || !Array.isArray(d.joins)) {
            throw new TypeError('A lumped DC definition needs elements and joins.');
        }
        for (const element of d.elements) {
            const field = {resistor: 'resistance', inductor: 'inductance', capacitor: 'capacitance'}[element?.type];
            if (!field || !terminalList(element.terminals, count, 2) || element.terminals.length !== 2 ||
                !Number.isFinite(element[field]) || element[field] < 0) throw new TypeError('Invalid lumped DC element.');
        }
    } else if (d.modelId === 'junction') {
        if (!Array.isArray(d.joins) || !Array.isArray(d.opens) ||
            d.opens.some(branch => !terminalList(branch, count, 2) || branch.length !== 2)) {
            throw new TypeError('Invalid DC junction definition.');
        }
    } else if (d.modelId === 'voltage-source') {
        if (count !== 2 || !Number.isFinite(d.voltage) || d.positiveTerminal !== 1 || d.negativeTerminal !== 2) {
            throw new TypeError('A DC voltage source needs finite volts and oriented terminals 1 and 2.');
        }
    } else if (d.modelId === 'attenuator') {
        if (count !== 2 || !Number.isFinite(d.parameters?.attenuationDb) || d.parameters.attenuationDb < 0 ||
            !Number.isFinite(d.parameters.referenceImpedance) || d.parameters.referenceImpedance <= 0) {
            throw new TypeError('Invalid DC attenuator definition.');
        }
    } else if (d.modelId === 'series-junction') {
        if (count !== 3 || [d.voltageConstraint, d.currentRatios].some(row => !Array.isArray(row) ||
            row.length !== 3 || Array.from(row).some((value, index) => value !== [1, -1, 1][index]))) {
            throw new TypeError('Invalid oriented DC series junction.');
        }
    } else if (d.modelId === 'linear-constraints') {
        for (const coefficients of [d.voltageCoefficients, d.currentCoefficients]) {
            if (!Array.isArray(coefficients) || coefficients.length !== count ||
                Array.from(coefficients).some(row => !Array.isArray(row) || row.length !== count ||
                    Array.from(row).some(value => !Number.isFinite(value)))) {
                throw new TypeError('DC linear constraints need square finite real coefficient matrices.');
            }
        }
    } else throw new TypeError('Unknown linear DC model: ' + d.modelId + '.');
    if (d.joins && d.joins.some(join => !terminalList(join, count, 2))) throw new TypeError('Invalid DC node join.');
}

export function dcSnapshot(value, ancestors = new Set()) {
    if (value === null || typeof value !== 'object') {
        if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
            throw new TypeError('DC descriptions must contain data, not executable or symbolic values.');
        }
        return value;
    }
    if (ownedData.has(value)) return value;
    if (ancestors.has(value)) throw new TypeError('DC descriptions must not contain cycles.');
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== null && Object.getPrototypeOf(prototype) !== null) {
        throw new TypeError('DC descriptions must contain plain objects and arrays.');
    }
    ancestors.add(value);
    const result = Array.isArray(value) ? value.map(item => dcSnapshot(item, ancestors)) :
        Object.fromEntries(Object.entries(value).map(([key, item]) => [key, dcSnapshot(item, ancestors)]));
    ancestors.delete(value);
    Object.freeze(result);
    ownedData.add(result);
    return result;
}

export function dcContext(settings = {}) {
    return dcSnapshot({Ro: settings.Ro, Temp: settings.Temp, fList: settings.fList,
        tList: settings.tList, twoTone: settings.twoTone});
}

export function validateDcModel(input, ancestors = new Set()) {
    if (models.has(input)) return input;
    if (!input || input.version !== 1 || typeof input.constructorName !== 'string' || !input.constructorName ||
        !Number.isInteger(input.portCount) || input.portCount < 1 || !kinds.includes(input.kind) ||
        !qualities.includes(input.quality) || !input.definition || typeof input.definition.modelId !== 'string' ||
        !input.definition.modelId || !Array.isArray(input.definition.terminals) ||
        input.definition.terminals.length !== input.portCount ||
        Array.from(input.definition.terminals).some((port, index) => port !== index + 1)) {
        throw new TypeError('Invalid DC model version, kind, quality or ordered terminal mapping.');
    }
    if (input.kind === 'requiresModel' && (typeof input.reason !== 'string' || !input.reason.trim())) {
        throw new TypeError('A missing DC model must explain the required information.');
    }
    validateDefinition(input);
    if (ancestors.has(input)) throw new TypeError('DC descriptions must not contain cycles.');
    ancestors.add(input);
    if (input.kind === 'connection') {
        const {components, externalNodes} = input.definition;
        if (!Array.isArray(components) || !components.length || !Array.isArray(externalNodes) ||
            externalNodes.length !== input.portCount) throw new TypeError('Invalid DC connection model.');
        const ids = new Set();
        for (const component of components) {
            if (!component || typeof component.id !== 'string' || !component.id || component.id.includes('/') || ids.has(component.id) ||
                !Array.isArray(component.nodes)) throw new TypeError('Invalid DC component placement.');
            ids.add(component.id);
            const child = validateDcModel(component.model, ancestors);
            if (child.portCount !== component.nodes.length) throw new RangeError('DC placement terminal count differs from its model.');
            component.nodes.forEach(validateDcNode);
        }
        externalNodes.forEach(validateDcNode);
    }
    ancestors.delete(input);
    const result = dcSnapshot(input);
    models.add(result);
    return result;
}

export function dcModel(constructorName, portCount, kind, quality, definition, settings, reason) {
    return validateDcModel({version: 1, constructorName, portCount, kind, quality,
        definition: {...definition, terminals: Array.from({length: portCount}, (_, index) => index + 1)},
        analysis: dcContext(settings), ...(reason ? {reason} : {})});
}

export function requiredDcModel(constructorName, portCount, reason, parameters = {}, settings) {
    return dcModel(constructorName, portCount, 'requiresModel', 'unspecified',
        {modelId: 'unspecified', parameters}, settings, reason);
}

export function lumpedDcModel(constructorName, placement, arrangement, parameters, settings, temperature = settings.Temp) {
    const entries = Object.entries(parameters);
    if (entries.some(([, value]) => !Number.isFinite(value) || value < 0)) {
        return requiredDcModel(constructorName, 2, 'Supply finite nonnegative R/L/C values or an explicit active DC equivalent.', parameters, settings);
    }
    const end = placement === 'shunt' ? 'g' : 2;
    const elements = entries.map(([name, value], index) => {
        const a = arrangement === 'parallel' || index === 0 ? 1 : 'n' + index;
        const b = arrangement === 'parallel' || index === entries.length - 1 ? end : 'n' + (index + 1);
        return {type: {resistance: 'resistor', inductance: 'inductor', capacitance: 'capacitor'}[name],
            terminals: [a, b], [name]: value};
    });
    return dcModel(constructorName, 2, 'linear', 'ideal',
        {modelId: 'lumped', placement, arrangement, parameters, temperature, elements,
            joins: placement === 'shunt' ? [[1, 2]] : []}, settings);
}

export function connectionDcModel(constructorName, portCount, joins, opens, parameters, settings, quality = 'ideal') {
    return dcModel(constructorName, portCount, 'linear', quality,
        {modelId: 'junction', joins, opens, parameters}, settings);
}

export function validateDcNode(node) {
    if (typeof node !== 'string' && !(typeof node === 'number' && Number.isFinite(node))) {
        throw new TypeError('Circuit node labels must be strings or finite numbers.');
    }
}

export function dcModelOf(part) {
    const input = part && (part._dcModel || (part.version === 1 && part));
    if (input) {
        const model = validateDcModel(input);
        if (part.spars && part.spars.length && Math.sqrt(part.spars[0].length - 1) !== model.portCount) {
            throw new RangeError('DC model and RF terminal counts differ.');
        }
        return model;
    }
    const count = part && part.spars && part.spars.length && Math.sqrt(part.spars[0].length - 1);
    if (!Number.isInteger(count) || count < 1) throw new TypeError('Circuit components need a DC descriptor or a valid nPort boundary.');
    return requiredDcModel('nPort', count, 'Supply an explicit DC equivalent; S-parameters do not define a physical DC model.', {}, part.global);
}

export function dcRequirements(model) {
    if (model.kind === 'requiresModel') return [{path: '', constructorName: model.constructorName,
        portCount: model.portCount, reason: model.reason}];
    if (model.kind !== 'connection') return [];
    const requirements = [];
    for (const placement of model.definition.components) {
        for (const issue of dcRequirements(placement.model)) {
            requirements.push({...issue, path: placement.id + (issue.path ? '/' + issue.path : '')});
        }
    }
    return requirements;
}

export function dcConnection(constructorName, placements, externalNodes, groups = [], settings) {
    if (!Array.isArray(placements) || !placements.length) throw new TypeError('DC connections require component placements.');
    for (const node of externalNodes) validateDcNode(node);
    const components = placements.map((placement, index) => {
        const model = dcModelOf(placement.part);
        if (placement.nodes.length !== model.portCount) throw new RangeError('Circuit placement needs one node for each component terminal.');
        placement.nodes.forEach(validateDcNode);
        return {id: 'p' + (index + 1), nodes: placement.nodes.slice(), model};
    });
    return dcModel(constructorName, externalNodes.length, 'connection', 'composite',
        {modelId: 'connection', components, externalNodes, groups},
        settings || components[0].model.analysis);
}

export function namedDcModel(constructorName, model, parameters, settings) {
    return dcModel(constructorName, model.portCount, model.kind, model.quality,
        {...model.definition, construction: {constructorName, parameters}}, settings || model.analysis, model.reason);
}

export function cascadeDcModel(left, right, settings) {
    return dcConnection('cascade', [{part: left, nodes: [1, 2]}, {part: right, nodes: [2, 3]}], [1, 3], [], settings);
}
