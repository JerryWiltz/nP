// Modified: 2026-11-22
import {dcModelOf, dcSnapshot} from './dcModel';
import {solveDcLinearSystem, dcLinearValue, dcLinearError} from './dcLinearSystem';
import {bjtDcDevice, solveDcNonlinear} from './dcNonlinear';
import {diodeDcDevice, diodeDcCurrent} from './diodes/diodeDc';
import {mosfetDcDevice} from './transistors/fet/mosfetDc';
import {mosfetPoint} from './transistors/fet/mosfetEquations';
import {hemtDcDevice} from './transistors/fet/hemtDc';
import {mesfetDcDevice} from './transistors/fet/mesfetDc';
import {jfetDcDevice} from './transistors/fet/jfetDc';

function add(terms, index, coefficient) {
    if (index === null || !coefficient) return;
    const value = (terms.get(index) || 0) + coefficient;
    if (value) terms.set(index, value);
    else terms.delete(index);
}

function difference(a, b) {
    const terms = new Map(); add(terms, a, 1); add(terms, b, -1); return terms;
}

function unsupportedModels(model, path = '') {
    if (model.kind === 'connection') return model.definition.components.flatMap(part =>
        unsupportedModels(part.model, path ? path + '/' + part.id : part.id));
    if (model.kind === 'requiresModel' || (model.kind === 'nonlinear' && !['bjt', 'jfet', 'mesfet', 'hemt', 'mosfet', 'diode', 'pin', 'pin-charge', 'legacy-diode'].includes(model.definition.modelId))) return [{path,
        constructorName: model.constructorName, reason: model.reason ||
            'This nonlinear DC adapter is not implemented yet; supply a supported device model.'}];
    return [];
}

class DcAssembly {
    constructor() {
        this.variables = []; this.nodes = []; this.kcl = new Map();
        this.constraints = []; this.components = []; this.diagnostics = []; this.devices = [];
    }
    node(path, label, internal = false) {
        const index = this.variables.length;
        this.variables.push('voltage'); this.kcl.set(index, new Map());
        this.nodes.push({index, path, node: label, internal});
        return index;
    }
    current(nodes, coefficients) {
        const index = this.variables.length;
        this.variables.push('current');
        nodes.forEach((node, port) => { if (node !== null) add(this.kcl.get(node), index, coefficients[port]); });
        return index;
    }
    branch(a, b, resistance = 0, voltage = 0) {
        const index = this.current([a, b], [1, -1]), terms = difference(a, b);
        add(terms, index, -resistance);
        this.constraints.push({terms, value: voltage, kind: 'constraint', source: false});
        return index;
    }
    instantiate(model, path, bindings) {
        const d = model.definition, local = new Map();
        const component = {path, model, nodes: bindings, currents: Array.from({length: model.portCount}, () => new Map()), elements: []};
        if (path || model.kind !== 'connection') this.components.push(component);
        if (model.quality === 'approximate') this.diagnostics.push({code: 'approximate-model', path,
            message: model.constructorName + ': ' + (d.parameters?.omissions || ['Uses an approximate DC model.']).join(' ')});
        if (model.kind === 'connection') {
            // Each nested block keeps its own node namespace. Explicit zero-volt
            // interfaces measure its entering terminal currents without merging
            // distinct external terminals or their potentially nonunique currents.
            for (const node of [...d.externalNodes, ...d.components.flatMap(part => part.nodes)]) {
                if (!local.has(node)) local.set(node, this.node(path, node));
            }
            component.nodes = d.externalNodes.map(node => local.get(node));
            if (bindings) bindings.forEach((node, port) => {
                add(component.currents[port], this.branch(node, component.nodes[port]), 1);
            });
            for (const child of d.components) this.instantiate(child.model, path ? path + '/' + child.id : child.id,
                child.nodes.map(node => local.get(node)));
            return component;
        }
        if (!bindings) component.nodes = d.terminals.map(port => this.node(path, port));
        d.terminals.forEach((port, index) => local.set(port, component.nodes[index]));
        local.set('g', null);
        this.stamp(model, component, local);
        return component;
    }
    terminal(local, terminal, path) {
        if (!local.has(terminal)) local.set(terminal, this.node(path, terminal, true));
        return local.get(terminal);
    }
    element(component, local, type, terminals, resistance = 0, voltage = 0) {
        const nodes = terminals.map(terminal => this.terminal(local, terminal, component.path));
        const current = type === 'capacitor' || type === 'open' ? null : new Map([[this.branch(...nodes, resistance, voltage), 1]]);
        this.recordElement(component, type, terminals, nodes, current,
            type === 'capacitor' || type === 'open' ? 'open' : type === 'inductor' || (type === 'resistor' && resistance === 0) ? 'short' : undefined);
    }
    conductance(component, local, terminals, conductance) {
        // Parallel leakage branches need no independent current variable.
        // Series/contact resistors retain measured branch currents, preserving
        // tiny intrinsic junction laws beside their much larger conductances.
        if (!Number.isFinite(conductance) || conductance < 0) throw dcLinearError('DC_NUMERICAL_FAILURE', 'DC conductance exceeds the supported numerical range.');
        const nodes = terminals.map(terminal => this.terminal(local, terminal, component.path));
        const current = new Map([...difference(...nodes)].map(([node, coefficient]) => [node, coefficient * conductance]));
        nodes.forEach((node, port) => {
            if (node !== null) for (const [column, coefficient] of current) add(this.kcl.get(node), column, (port === 0 ? 1 : -1) * coefficient);
        });
        this.recordElement(component, 'resistor', terminals, nodes, current);
    }
    recordElement(component, type, terminals, nodes, current, reduction) {
        if (current !== null) terminals.forEach((terminal, port) => {
            if (Number.isInteger(terminal)) for (const [column, coefficient] of current) {
                add(component.currents[terminal - 1], column, (port === 0 ? 1 : -1) * coefficient);
            }
        });
        component.elements.push({type, terminals, nodes, current, ...(reduction ? {reduction} : {})});
    }
    stamp(model, component, local) {
        const d = model.definition;
        for (const join of d.joins || []) {
            for (let port = 1; port < join.length; port++) this.element(component, local, 'connection', [join[0], join[port]]);
        }
        if (d.modelId === 'mosfet') {
            const device = mosfetDcDevice(model, [], component.path);
            for (const [port, resistance] of [0, device.p.RD, device.p.RS].entries()) {
                this.element(component, local, 'resistor', [port + 1, 'n' + (port + 1)], resistance);
                device.nodes.push(local.get('n' + (port + 1)));
            }
            this.element(component, local, 'resistor', [d.body === 'external' ? 4 : 3, 'n4'], 0);
            device.nodes.push(local.get('n4'));
            component.device = device; this.devices.push(device);
        } else if (['bjt', 'jfet', 'mesfet', 'hemt'].includes(d.modelId)) {
            const device = d.modelId === 'hemt' ? hemtDcDevice(model, [], component.path) : d.modelId === 'bjt' ? bjtDcDevice(model, [], component.path) : d.modelId === 'jfet' ? jfetDcDevice(model, [], component.path) : mesfetDcDevice(model, [], component.path);
            const resistances = device.kind === 'bjt' ? [device.p.RB, device.p.RC, device.p.RE] : [device.p.RG || 0, device.p.RD, device.p.RS];
            if (d.terminalNetwork) {
                const network = d.terminalNetwork;
                const terminals = Array.from({length: network.nodeCount}, (_, node) => {
                    const port = network.ports.indexOf(node); return port < 0 ? 'n' + (node + 1) : port + 1;
                });
                for (const nodes of network.joins) for (const node of nodes.slice(1)) this.element(component, local, 'connection', [terminals[nodes[0]], terminals[node]]);
                for (const [kind, rows] of [['resistor', network.resistors], ['inductor', network.inductors], ['capacitor', network.capacitors]]) {
                    for (const [a, b, resistance] of rows) this.element(component, local, kind, [terminals[a], terminals[b]], kind === 'resistor' ? resistance : 0);
                }
                for (const [a, b] of network.seriesRC || []) this.element(component, local, 'open', [terminals[a], terminals[b]]);
                device.nodes = network.intrinsic.map(node => this.terminal(local, terminals[node], component.path));
            } else for (const [port, resistance] of resistances.entries()) {
                this.element(component, local, 'resistor', [port + 1, 'n' + (port + 1)], resistance);
                device.nodes.push(local.get('n' + (port + 1)));
            }
            component.device = device;
            this.devices.push(device);
        } else if (d.modelId === 'pin-charge') {
            this.element(component, local, 'connection', [1, 'n1']);
            this.element(component, local, 'connection', [2, 'n2']);
            const device = diodeDcDevice(model, [local.get('n1'), local.get('n2')], component.path);
            component.device = device; this.devices.push(device);
        } else if (['diode', 'pin', 'legacy-diode'].includes(d.modelId)) {
            const device = diodeDcDevice(model, [], component.path), legacy = d.modelId === 'legacy-diode';
            if (d.modelId === 'pin' && d.region === 'forward') {
                this.element(component, local, 'resistor', [1, 'n3'], device.p.RS);
                this.element(component, local, 'voltage-source', ['n3', 'n1'], 0, device.p.VI);
            } else this.element(component, local, 'resistor', [1, 'n1'], legacy ? device.p.rs : device.p.RS);
            this.element(component, local, 'resistor', [2, 'n2'], 0);
            device.nodes = [local.get('n1'), local.get('n2')];
            // D's leakage is outside RS; the legacy current law contains its
            // own junction-side leakage. Do not replace one with the other.
            if (!legacy && Number.isFinite(d.record.leakageResistance)) {
                this.conductance(component, local, [1, 2], 1 / d.record.leakageResistance);
            }
            component.device = device;
            this.devices.push(device);
        } else if (d.modelId === 'lumped') {
            for (const element of d.elements) this.element(component, local, element.type, element.terminals, element.resistance || 0);
        } else if (d.modelId === 'junction') {
            for (const terminals of d.opens) this.element(component, local, 'open', terminals);
        } else if (d.modelId === 'voltage-source') {
            this.element(component, local, 'voltage-source', [d.positiveTerminal, d.negativeTerminal], 0, d.voltage);
            this.constraints.at(-1).source = true;
        } else if (d.modelId === 'series-junction') {
            const index = this.current(component.nodes, d.currentRatios), terms = new Map();
            component.nodes.forEach((node, port) => {
                add(terms, node, d.voltageConstraint[port]); add(component.currents[port], index, d.currentRatios[port]);
            });
            this.constraints.push({terms, value: 0, kind: 'constraint'});
        } else if (d.modelId === 'attenuator' || d.modelId === 'linear-constraints') {
            let voltage = d.voltageCoefficients, current = d.currentCoefficients;
            if (d.modelId === 'attenuator') {
                const t = 10 ** (-d.parameters.attenuationDb / 20), r = d.parameters.referenceImpedance;
                voltage = [[1, -t], [-t, 1]]; current = [[-r, -r * t], [-r * t, -r]];
            }
            const currents = component.nodes.map(node => this.current([node], [1]));
            currents.forEach((index, port) => add(component.currents[port], index, 1));
            for (let row = 0; row < model.portCount; row++) {
                const terms = new Map();
                component.nodes.forEach((node, col) => { add(terms, node, voltage[row][col]); add(terms, currents[col], current[row][col]); });
                this.constraints.push({terms, value: 0, kind: 'constraint'});
            }
        } else throw dcLinearError('DC_UNSUPPORTED_MODELS', 'No DC adapter for ' + model.constructorName + ' (' + d.modelId + ').');
    }
}

function componentResult(component, solution) {
    const evaluate = terms => dcLinearValue(solution, terms);
    const {model} = component;
    return {path: component.path, constructorName: model.constructorName, modelId: model.definition.modelId, quality: model.quality,
        terminalVoltages: component.nodes.map(node => evaluate(new Map([[node, 1]]))),
        terminalCurrents: component.currents.map(evaluate),
        elements: component.elements.map(element => ({type: element.type, terminals: element.terminals,
            voltage: evaluate(difference(...element.nodes)),
            current: element.current === null ? 0 : evaluate(element.current),
            ...(element.reduction ? {reduction: element.reduction} : {})}))};
}

export function solveDC(part) {
    const model = dcModelOf(part), issues = unsupportedModels(model);
    if (issues.length) {
        const error = dcLinearError('DC_UNSUPPORTED_MODELS', 'DC solve needs additional model support:\n' +
            issues.map(issue => (issue.path || '(root)') + ' ' + issue.constructorName + ': ' + issue.reason).join('\n'));
        error.issues = dcSnapshot(issues);
        throw error;
    }
    const assembly = new DcAssembly(), root = assembly.instantiate(model, '');
    const equations = [...assembly.kcl.values()].map(terms => ({terms, value: 0, kind: 'kcl'})).concat(assembly.constraints);
    const nonlinear = assembly.devices.length ? solveDcNonlinear(assembly) : undefined;
    const solution = nonlinear ? nonlinear.solution : solveDcLinearSystem(equations, assembly.variables.length);
    const nodes = assembly.nodes.map(node => ({path: node.path, node: node.node, internal: node.internal,
        voltage: dcLinearValue(solution, new Map([[node.index, 1]]))}));
    const components = assembly.components.map(component => componentResult(component, solution));
    for (const node of nodes) if (node.voltage === null) assembly.diagnostics.push({code: 'floating-node', path: node.path,
        node: node.node, message: 'Absolute DC voltage is undetermined; no reference voltage is assigned to this node.'});
    for (const component of components) if (component.terminalCurrents.includes(null) || component.elements.some(element => element.current === null)) assembly.diagnostics.push({
        code: 'indeterminate-current', path: component.path, message: 'Some branch or terminal currents are nonunique in this ideal network; those entries are null.'});
    const operatingPoints = [];
    for (const component of assembly.components) if (component.device) {
        if (component.device.kind === 'mosfet') {
            const device = component.device, [g, d, s, b] = device.nodes;
            const intrinsicVgs = dcLinearValue(solution, difference(g, s));
            const intrinsicVds = dcLinearValue(solution, difference(d, s));
            const intrinsicVbs = dcLinearValue(solution, difference(b, s));
            if ([intrinsicVgs, intrinsicVds, intrinsicVbs].includes(null)) throw dcLinearError('DC_FLOATING_BIAS',
                'DC MOSFET bias is undetermined at ' + (component.path || '(root)') + '; connect gate and body to a defined bias network.');
            const vs = dcLinearValue(solution, new Map([[component.nodes[2], 1]]));
            const {data, ...point} = mosfetPoint(device.p, intrinsicVgs, intrinsicVds, intrinsicVbs, device.polarity, component.model.definition.body, vs);
            operatingPoints.push({path: component.path, intrinsicVgs, intrinsicVds, intrinsicVbs, vs});
            const result = components.find(entry => entry.path === component.path);
            if (result.terminalCurrents.includes(null)) throw dcLinearError('DC_FLOATING_BIAS', 'DC MOSFET terminal current is undetermined at ' + (component.path || '(root)') + '.');
            result.qPoint = {...point, body: component.model.definition.body, temperature: component.model.definition.temperature};
            continue;
        }
        if (['jfet', 'mesfet', 'hemt'].includes(component.device.kind)) {
            const [g, d, s] = component.device.nodes;
            const intrinsicVgs = dcLinearValue(solution, difference(g, s)), intrinsicVgd = dcLinearValue(solution, difference(g, d));
            const result = components.find(entry => entry.path === component.path);
            const [ig, id, source] = result.terminalCurrents;
            if ([intrinsicVgs, intrinsicVgd, ig, id, source].includes(null)) throw dcLinearError('DC_FLOATING_BIAS', 'DC FET bias is undetermined at ' + (component.path || '(root)') + '.');
            const vs = dcLinearValue(solution, new Map([[component.nodes[2], 1]]));
            const vgs = intrinsicVgs + (component.device.p.RG || 0) * ig - component.device.p.RS * source;
            const vds = intrinsicVgs - intrinsicVgd + component.device.p.RD * id - component.device.p.RS * source;
            operatingPoints.push({path: component.path, intrinsicVgs, intrinsicVgd, vs});
            result.qPoint = {ig, id, is: source, vgs, vds, vs, vg: vs === null ? null : vs + vgs,
                vd: vs === null ? null : vs + vds, intrinsicVgs, intrinsicVgd, temperature: component.model.definition.temperature};
            continue;
        }
        if (component.device.kind !== 'bjt') {
            const [a, k] = component.device.nodes;
            const deviceVoltage = dcLinearValue(solution, difference(a, k));
            const junctionVoltage = component.device.kind === 'pin-charge' && deviceVoltage !== null ?
                diodeDcCurrent(component.device, deviceVoltage).point.junctionVoltage : deviceVoltage;
            const vd = dcLinearValue(solution, difference(...component.nodes));
            const result = components.find(entry => entry.path === component.path), id = result.terminalCurrents[0];
            if ([vd, junctionVoltage, id].includes(null)) throw dcLinearError('DC_FLOATING_BIAS', 'DC diode bias is undetermined at ' + (component.path || '(root)') + '.');
            const va = dcLinearValue(solution, new Map([[component.nodes[0], 1]]));
            const vk = dcLinearValue(solution, new Map([[component.nodes[1], 1]]));
            operatingPoints.push({path: component.path, vd, junctionVoltage, va, vk});
            result.qPoint = {vd, id, junctionVoltage, junctionCurrent: component.device.kind === 'pin-charge' ?
                diodeDcCurrent(component.device, deviceVoltage).point.junctionCurrent : diodeDcCurrent(component.device, junctionVoltage).current,
                va, vk, temperature: component.model.definition.temperature};
            continue;
        }
        const [b, c, e] = component.device.nodes;
        const be = dcLinearValue(solution, difference(b, e)), bc = dcLinearValue(solution, difference(b, c));
        if (be === null || bc === null) throw dcLinearError('DC_FLOATING_BIAS', 'DC junction bias is undetermined at ' + (component.path || '(root)') + '.');
        const ve = dcLinearValue(solution, new Map([[component.nodes[2], 1]]));
        const point = {path: component.path, intrinsicVbe: be, intrinsicVbc: bc, ve};
        operatingPoints.push(point);
        const result = components.find(entry => entry.path === component.path);
        const [ib, ic, ie] = result.terminalCurrents;
        if ([ib, ic, ie].includes(null)) throw dcLinearError('DC_FLOATING_BIAS', 'DC terminal current is undetermined at ' + (component.path || '(root)') + '.');
        const p = component.device.p, vbe = be + p.RB * ib - p.RE * ie;
        const vce = be - bc + p.RC * ic - p.RE * ie;
        result.qPoint = {ib, ic, ie: -ie, vbe, vce, vcb: vce - vbe,
            vb: ve === null ? null : ve + vbe, vc: ve === null ? null : ve + vce, ve,
            intrinsicVbe: be, intrinsicVbc: bc, temperature: component.model.definition.temperature,
            configuration: component.model.definition.configuration};
    }
    return dcSnapshot({kind: 'dc-operating-point', method: nonlinear ? 'nonlinear' : 'linear', converged: true, model,
        reference: 'g', nodes, components,
        ports: root.nodes.map((node, port) => ({port: port + 1,
            node: model.kind === 'connection' ? model.definition.externalNodes[port] : port + 1,
            voltage: dcLinearValue(solution, new Map([[node, 1]])), current: 0})),
        diagnostics: assembly.diagnostics, residuals: nonlinear ? {maxKclAmps: nonlinear.residuals.maxKclAmps,
            maxVoltageResidual: nonlinear.residuals.maxVoltageResidual, maxScaledResidual: nonlinear.residuals.maxScaledResidual,
            maxNormalizedResidual: nonlinear.residuals.norm} : solution.residuals,
        ...(nonlinear ? {operatingPoints, initialEstimate: nonlinear.initialEstimate, convergence: nonlinear.convergence} : {}),
        linearSystem: {rank: solution.rank, unknownCount: assembly.variables.length}});
}
