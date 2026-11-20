// Modified: 2026-11-19
// Declarative board settings consumed by the schematic layout interpreter.

function twoTerminalSlot(name, symbols) {
    return {name, symbols, portCount: 2, ports: {in: [1, 2], out: [1, 2]}};
}

function groundSlot(name) {
    return {name, symbols: ['short'], portCount: 1, ports: {in: [1]}};
}

const bipolarDivider = {name: 'commonEmitter', symbols: ['npn', 'pnp'], control: 'base', output: 'collector', common: 'emitter', returnPrefix: 'emitter'};
const fetDivider = {name: 'commonSource', symbols: ['njf', 'pjf', 'nmos', 'pmos'], control: 'gate', output: 'drain', common: 'source', returnPrefix: 'return'};

function dividerBiasedAmplifierBoard(emitter, supplyBypass, collectorCommon, railOrder = 'sourceFirst', device = bipolarDivider) {
    const {control, output, common, returnPrefix} = device;
    const controlJunction = control + 'Junction', outputLoad = output + 'Load', outputJunction = output + 'Junction';
    const returnJunction = returnPrefix + 'Junction', returnResistor = returnPrefix + 'Resistor', returnBypass = returnPrefix + 'Bypass';
    const returnGround = returnPrefix + 'Ground', returnBypassGround = returnPrefix + 'BypassGround', returnNetwork = returnPrefix + 'Network';
    const sideOutput = collectorCommon === 'output';
    const collectorFirst = supplyBypass && railOrder === 'collectorFirst';
    const slots = [
        {name: 'device', symbols: device.symbols, portCount: 3,
            ports: {[control]: [1], [output]: [2], [common]: [3]}},
        twoTerminalSlot('input', ['capacitor']),
        {name: controlJunction, symbols: ['tee4'], portCount: 4,
            ports: {input: [1, 2, 3, 4], device: [1, 2, 3, 4], upper: [1, 2, 3, 4], lower: [1, 2, 3, 4]}},
        twoTerminalSlot('upperBias', ['resistor']),
        twoTerminalSlot('lowerBias', ['resistor']),
        groundSlot('biasGround'),
        twoTerminalSlot(outputLoad, ['resistor']),
        {name: outputJunction, symbols: ['tee'], portCount: 3,
            ports: {supply: sideOutput ? [2, 3] : [1], device: [2, 3], output: sideOutput ? [1] : [2, 3]}},
        twoTerminalSlot('output', ['capacitor']),
        {name: 'supplyJunction', symbols: ['tee'], portCount: 3,
            ports: collectorFirst ? {source: [2, 3], bias: [2, 3], load: [1]} :
                {source: [1], bias: [2, 3], load: [2, 3]}},
        {name: 'source', symbols: ['voltage-source'], portCount: 2, ports: {in: [1], out: [2]}},
        groundSlot('sourceGround')
    ];
    const components = [
        {slot: 'device', anchor: control, directions: {[control]: 'left', [output]: 'up', [common]: 'down'}},
        {slot: 'input', anchor: 'out', directions: {in: 'left', out: 'right'}},
        {slot: controlJunction, anchor: 'device',
            directions: {input: 'left', device: 'right', upper: 'up', lower: 'down'}},
        {slot: 'upperBias', anchor: 'out', directions: {in: 'up', out: 'down'}},
        {slot: 'lowerBias', anchor: 'in', directions: {in: 'up', out: 'down'}},
        {slot: 'biasGround', anchor: 'in', directions: {in: 'up'}},
        {slot: outputLoad, anchor: 'in', directions: {in: 'up', out: 'down'}},
        {slot: outputJunction, anchor: sideOutput ? 'supply' : 'device',
            directions: sideOutput ? {supply: 'up', device: 'down', output: 'right'} :
                {supply: 'up', device: 'left', output: 'right'}},
        {slot: 'output', anchor: 'in',
            directions: {in: 'left', out: 'right'}},
        {slot: 'supplyJunction', anchor: collectorFirst ? 'load' : 'bias',
            directions: collectorFirst ? {source: 'right', bias: 'left', load: 'down'} :
                {source: 'up', bias: 'left', load: 'right'}},
        {slot: 'source', anchor: 'in',
            directions: {in: 'up', out: 'down'}},
        {slot: 'sourceGround', anchor: 'in', directions: {in: 'up'}}
    ];
    const wires = [
        {from: {externalPort: 1}, to: {slot: 'input', port: 'in'}},
        {from: {slot: 'input', port: 'out'}, to: {slot: controlJunction, port: 'input'}},
        {from: {slot: controlJunction, port: 'device'}, to: {slot: 'device', port: control}},
        {from: {slot: controlJunction, port: 'upper'}, to: {slot: 'upperBias', port: 'out'}},
        {from: {slot: controlJunction, port: 'lower'}, to: {slot: 'lowerBias', port: 'in'}},
        {from: {slot: 'lowerBias', port: 'out'}, to: {slot: 'biasGround', port: 'in'}},
        {from: {slot: 'upperBias', port: 'in'}, to: {slot: 'supplyJunction', port: 'bias'}, route: 'verticalFirst'},
        ...(!collectorFirst ? [{from: {slot: 'supplyJunction', port: 'source'}, to: {slot: 'source', port: 'in'}, route: 'horizontalFirst'}] : []),
        {from: {slot: 'source', port: 'out'}, to: {slot: 'sourceGround', port: 'in'}},
        {from: {slot: outputLoad, port: 'out'}, to: {slot: outputJunction, port: 'supply'}},
        {from: {slot: 'device', port: output}, to: {slot: outputJunction, port: 'device'}, route: 'verticalFirst'},
        {from: {slot: outputJunction, port: 'output'}, to: {slot: 'output', port: 'in'}},
        {from: {slot: 'output', port: 'out'}, to: {externalPort: 2}}
    ];
    if (supplyBypass) {
        slots.push({name: 'railJunction', symbols: ['tee'], portCount: 3,
            ports: collectorFirst ? {load: [2, 3], supply: [2, 3], bypass: [1]} :
                {load: [1], supply: [2, 3], bypass: [2, 3]}},
        twoTerminalSlot('supplyBypass', ['capacitor']), groundSlot('supplyBypassGround'));
        components.push(
            {slot: 'railJunction', anchor: collectorFirst ? 'bypass' : 'load',
                directions: collectorFirst ? {load: 'left', supply: 'right', bypass: 'down'} :
                    {load: 'down', supply: 'left', bypass: 'right'}},
            {slot: 'supplyBypass', anchor: 'in', directions: {in: 'up', out: 'down'}},
            {slot: 'supplyBypassGround', anchor: 'in', directions: {in: 'up'}});
        wires.push(...(collectorFirst ? [
            {from: {slot: 'supplyJunction', port: 'load'}, to: {slot: outputLoad, port: 'in'}},
            {from: {slot: 'supplyJunction', port: 'source'}, to: {slot: 'railJunction', port: 'load'}},
            {from: {slot: 'railJunction', port: 'supply'}, to: {slot: 'source', port: 'in'}, route: 'horizontalFirst'}
        ] : [
            {from: {slot: 'supplyJunction', port: 'load'}, to: {slot: 'railJunction', port: 'supply'}},
            {from: {slot: 'railJunction', port: 'load'}, to: {slot: outputLoad, port: 'in'}}
        ]),
            {from: {slot: 'railJunction', port: 'bypass'}, to: {slot: 'supplyBypass', port: 'in'}, route: 'horizontalFirst'},
            {from: {slot: 'supplyBypass', port: 'out'}, to: {slot: 'supplyBypassGround', port: 'in'}});
    } else wires.push({from: {slot: 'supplyJunction', port: 'load'}, to: {slot: outputLoad, port: 'in'}, route: 'horizontalFirst'});
    if (emitter === 'split') {
        slots.push({name: returnJunction, symbols: ['tee'], portCount: 3,
            ports: {device: [1], resistor: [2, 3], bypass: [2, 3]}},
        twoTerminalSlot(returnResistor, ['resistor']), twoTerminalSlot(returnBypass, ['capacitor']),
        groundSlot(returnGround), groundSlot(returnBypassGround));
        components.push(
            {slot: returnJunction, anchor: 'device', directions: {device: 'up', resistor: 'left', bypass: 'right'}},
            {slot: returnResistor, anchor: 'in', directions: {in: 'up', out: 'down'}},
            {slot: returnBypass, anchor: 'in', directions: {in: 'up', out: 'down'}},
            {slot: returnGround, anchor: 'in', directions: {in: 'up'}},
            {slot: returnBypassGround, anchor: 'in', directions: {in: 'up'}});
        wires.push(
            {from: {slot: 'device', port: common}, to: {slot: returnJunction, port: 'device'}},
            {from: {slot: returnJunction, port: 'resistor'}, to: {slot: returnResistor, port: 'in'}, route: 'horizontalFirst'},
            {from: {slot: returnJunction, port: 'bypass'}, to: {slot: returnBypass, port: 'in'}, route: 'horizontalFirst'},
            {from: {slot: returnResistor, port: 'out'}, to: {slot: returnGround, port: 'in'}},
            {from: {slot: returnBypass, port: 'out'}, to: {slot: returnBypassGround, port: 'in'}});
    } else {
        slots.push(twoTerminalSlot(returnNetwork, [emitter === 'combined' ? 'se-parallel-rc' : 'resistor']), groundSlot(returnGround));
        components.push(
            {slot: returnNetwork, anchor: 'in', directions: {in: 'up', out: 'down'}},
            {slot: returnGround, anchor: 'in', directions: {in: 'up'}});
        wires.push(
            {from: {slot: 'device', port: common}, to: {slot: returnNetwork, port: 'in'}},
            {from: {slot: returnNetwork, port: 'out'}, to: {slot: returnGround, port: 'in'}});
    }
    return {name: device.name, version: 1, variant: `${emitter}${supplyBypass ? '-supply-bypass' : ''}-${collectorCommon}${collectorFirst ? '-collector-first' : ''}`,
        match: {externalPortCount: 2, slots}, board: {grid: 10, layout: 'relations', components, wires,
            order: [{axis: 'x', slots: ['input', controlJunction, 'device', 'output',
                ...(supplyBypass ? ['supplyBypass'] : []), 'source']},
            {axis: 'y', slots: [['sourceGround', ...(supplyBypass ? ['supplyBypassGround'] : [])], 'output', 'device']}],
            externalPorts: [
                {port: 1, from: {slot: 'input', port: 'in'}, side: 'left'},
                {port: 2, from: {slot: 'output', port: 'out'}, side: 'right'}
            ]}};
}

function commonSourceBoard(sourceNetwork, supplyBypass, drainCommon) {
    const sideOutput = drainCommon === 'output';
    const slots = [
        {name: 'device', symbols: ['njf', 'pjf', 'nmos', 'pmos'], portCount: 3, ports: {gate: [1], drain: [2], source: [3]}},
        twoTerminalSlot('input', ['capacitor']),
        {name: 'gateJunction', symbols: ['tee'], portCount: 3, ports: {bias: [1], input: [2, 3], device: [2, 3]}},
        twoTerminalSlot('gateResistor', ['resistor']), groundSlot('gateGround'),
        twoTerminalSlot('drainLoad', ['resistor']),
        {name: 'drainJunction', symbols: ['tee'], portCount: 3,
            ports: {supply: sideOutput ? [2, 3] : [1], device: [2, 3], output: sideOutput ? [1] : [2, 3]}},
        twoTerminalSlot('output', ['capacitor']),
        {name: 'source', symbols: ['voltage-source'], portCount: 2, ports: {in: [1], out: [2]}},
        groundSlot('sourceGround')
    ];
    const components = [
        {slot: 'device', anchor: 'gate', directions: {gate: 'left', drain: 'up', source: 'down'}},
        {slot: 'input', anchor: 'out', directions: {in: 'left', out: 'right'}},
        {slot: 'gateJunction', anchor: 'device', directions: {input: 'left', device: 'right', bias: 'down'}},
        {slot: 'gateResistor', anchor: 'in', directions: {in: 'up', out: 'down'}},
        {slot: 'gateGround', anchor: 'in', directions: {in: 'up'}},
        {slot: 'drainLoad', anchor: 'in', directions: {in: 'up', out: 'down'}},
        {slot: 'drainJunction', anchor: sideOutput ? 'supply' : 'device', directions: sideOutput ?
            {supply: 'up', device: 'down', output: 'right'} : {supply: 'up', device: 'left', output: 'right'}},
        {slot: 'output', anchor: 'in', directions: {in: 'left', out: 'right'}},
        {slot: 'source', anchor: 'in', directions: {in: 'up', out: 'down'}},
        {slot: 'sourceGround', anchor: 'in', directions: {in: 'up'}}
    ];
    const wires = [
        {from: {externalPort: 1}, to: {slot: 'input', port: 'in'}},
        {from: {slot: 'input', port: 'out'}, to: {slot: 'gateJunction', port: 'input'}},
        {from: {slot: 'gateJunction', port: 'device'}, to: {slot: 'device', port: 'gate'}},
        {from: {slot: 'gateJunction', port: 'bias'}, to: {slot: 'gateResistor', port: 'in'}},
        {from: {slot: 'gateResistor', port: 'out'}, to: {slot: 'gateGround', port: 'in'}},
        {from: {slot: 'drainLoad', port: 'out'}, to: {slot: 'drainJunction', port: 'supply'}},
        {from: {slot: 'device', port: 'drain'}, to: {slot: 'drainJunction', port: 'device'}, route: 'verticalFirst'},
        {from: {slot: 'drainJunction', port: 'output'}, to: {slot: 'output', port: 'in'}},
        {from: {slot: 'output', port: 'out'}, to: {externalPort: 2}},
        {from: {slot: 'source', port: 'out'}, to: {slot: 'sourceGround', port: 'in'}}
    ];
    if (supplyBypass) {
        slots.push({name: 'supplyJunction', symbols: ['tee'], portCount: 3, ports: {bypass: [1], load: [2, 3], source: [2, 3]}},
            twoTerminalSlot('supplyBypass', ['capacitor']), groundSlot('supplyBypassGround'));
        components.push({slot: 'supplyJunction', anchor: 'load', directions: {load: 'left', source: 'right', bypass: 'down'}},
            {slot: 'supplyBypass', anchor: 'in', directions: {in: 'up', out: 'down'}},
            {slot: 'supplyBypassGround', anchor: 'in', directions: {in: 'up'}});
        wires.push({from: {slot: 'drainLoad', port: 'in'}, to: {slot: 'supplyJunction', port: 'load'}, route: 'verticalFirst'},
            {from: {slot: 'supplyJunction', port: 'source'}, to: {slot: 'source', port: 'in'}, route: 'horizontalFirst'},
            {from: {slot: 'supplyJunction', port: 'bypass'}, to: {slot: 'supplyBypass', port: 'in'}},
            {from: {slot: 'supplyBypass', port: 'out'}, to: {slot: 'supplyBypassGround', port: 'in'}});
    } else wires.push({from: {slot: 'source', port: 'in'}, to: {slot: 'drainLoad', port: 'in'}, route: 'horizontalFirst'});
    if (sourceNetwork === 'split') {
        slots.push({name: 'returnJunction', symbols: ['tee'], portCount: 3, ports: {device: [1], resistor: [2, 3], bypass: [2, 3]}},
            twoTerminalSlot('sourceResistor', ['resistor']), twoTerminalSlot('sourceBypass', ['capacitor']),
            groundSlot('returnGround'), groundSlot('returnBypassGround'));
        components.push({slot: 'returnJunction', anchor: 'device', directions: {device: 'up', resistor: 'left', bypass: 'right'}},
            {slot: 'sourceResistor', anchor: 'in', directions: {in: 'up', out: 'down'}},
            {slot: 'sourceBypass', anchor: 'in', directions: {in: 'up', out: 'down'}},
            {slot: 'returnGround', anchor: 'in', directions: {in: 'up'}},
            {slot: 'returnBypassGround', anchor: 'in', directions: {in: 'up'}});
        wires.push({from: {slot: 'device', port: 'source'}, to: {slot: 'returnJunction', port: 'device'}},
            {from: {slot: 'returnJunction', port: 'resistor'}, to: {slot: 'sourceResistor', port: 'in'}, route: 'horizontalFirst'},
            {from: {slot: 'returnJunction', port: 'bypass'}, to: {slot: 'sourceBypass', port: 'in'}, route: 'horizontalFirst'},
            {from: {slot: 'sourceResistor', port: 'out'}, to: {slot: 'returnGround', port: 'in'}},
            {from: {slot: 'sourceBypass', port: 'out'}, to: {slot: 'returnBypassGround', port: 'in'}});
    } else {
        slots.push(twoTerminalSlot('sourceNetwork', [sourceNetwork === 'combined' ? 'se-parallel-rc' : 'resistor']), groundSlot('returnGround'));
        components.push({slot: 'sourceNetwork', anchor: 'in', directions: {in: 'up', out: 'down'}},
            {slot: 'returnGround', anchor: 'in', directions: {in: 'up'}});
        wires.push({from: {slot: 'device', port: 'source'}, to: {slot: 'sourceNetwork', port: 'in'}},
            {from: {slot: 'sourceNetwork', port: 'out'}, to: {slot: 'returnGround', port: 'in'}});
    }
    return {name: 'commonSource', version: 1, variant: `${sourceNetwork}${supplyBypass ? '-supply-bypass' : ''}-${drainCommon}`,
        match: {externalPortCount: 2, slots}, board: {grid: 10, layout: 'relations', components, wires,
            order: [{axis: 'x', slots: ['input', 'gateJunction', 'device', 'output', ...(supplyBypass ? ['supplyBypass'] : []), 'source']},
                {axis: 'y', slots: [['sourceGround', ...(supplyBypass ? ['supplyBypassGround'] : [])], 'output', 'device']}],
            externalPorts: [{port: 1, from: {slot: 'input', port: 'in'}, side: 'left'}, {port: 2, from: {slot: 'output', port: 'out'}, side: 'right'}]}};
}

const commonSourceVariants = ['split', 'combined', 'resistor'].flatMap(source => [false, true]
    .flatMap(bypass => ['output', 'supply'].map(common => commonSourceBoard(source, bypass, common))));

const dividerFetVariants = ['split', 'combined', 'resistor'].flatMap(source => [false, true]
    .flatMap(bypass => ['output', 'supply'].flatMap(common => (bypass ? ['sourceFirst', 'collectorFirst'] : ['sourceFirst'])
        .map(order => ({...dividerBiasedAmplifierBoard(source, bypass, common, order, fetDivider),
            variant: 'divider-' + source + (bypass ? '-supply-bypass' : '') + '-' + common + '-' + order})))));
commonSourceVariants.push(...dividerFetVariants);


const commonEmitterVariants = ['split', 'combined', 'resistor'].flatMap(emitter => [true, false]
    .flatMap(bypass => ['output', 'supply'].flatMap(common =>
        (bypass ? ['collectorFirst', 'sourceFirst'] : ['sourceFirst'])
            .map(order => dividerBiasedAmplifierBoard(emitter, bypass, common, order)))));

export const schematicShapeBoards = {
    commonSource: {...commonSourceVariants[0], detect: true, interface: {from: [1], to: [2]}, alternatives: commonSourceVariants.slice(1)},
    commonEmitter: {...commonEmitterVariants[0], detect: true, interface: {from: [1], to: [2]},
        alternatives: commonEmitterVariants.slice(1)},
    generic: {
        name: 'generic',
        version: 1,
        automatic: true,
        match: {
            externalPortCount: 2,
            terminalDegree: 2,
            paths: [{bind: 'parts', from: {externalPort: 1}, to: {externalPort: 2},
                through: {portCount: 2}, minimum: 1, coverAllComponents: true}]
        },
        board: {
            automatic: true,
            flow: 'right',
            branches: 'down',
            loopArrangement: 'rectangular',
            from: {externalPort: 1},
            to: {externalPort: 2},
            tiles: [
                {kind: 'wire'},
                {kind: 'component', source: 'parts', repeat: 'oneOrMore',
                    between: {kind: 'wire'}},
                {kind: 'wire'}
            ],
            grid: 10,
            origin: [80, 100],
            componentGap: 120,
            branchGap: 100,
            wireBoxLength: 40,
            externalPortLead: 80,
            cornerSize: 10,
            clearance: 10,
            routingMargin: 160,
            bendCost: 10
        }
    },
    series: {
        name: 'series',
        version: 1,
        detect: true,
        interface: {from: [1], to: [2]},
        match: {
            externalPortCount: 2,
            paths: [{bind: 'parts', from: {externalPort: 1}, to: {externalPort: 2},
                through: {portCount: 2}, minimum: 1, coverAllComponents: true}]
        },
        board: {
            grid: 10,
            from: {externalPort: 1},
            to: {externalPort: 2},
            tiles: [
                {kind: 'wire', slot: 'inputLead'},
                {kind: 'component', source: 'parts', role: 'seriesPart', repeat: 'oneOrMore',
                    between: {kind: 'wire', slot: 'between'}},
                {kind: 'wire', slot: 'outputLead'}
            ],
            origin: [40, 100],
            direction: 'right',
            wireBoxLength: 80,
        }
    },
    ladder: {
        name: 'ladder',
        version: 1,
        detect: true,
        interface: {from: [1], to: [2]},
        match: {
            externalPortCount: 2,
            coverAllComponents: true,
            paths: [{bind: 'mainParts', from: {externalPort: 1}, to: {externalPort: 2},
                through: {portCounts: [2, 3]}, minimum: 1}],
            attachments: [{bind: 'branches', on: 'mainParts', from: 'unusedPorts',
                through: {portCount: 2}, until: {portCount: 1},
                minimum: 1, minimumBranches: 1}]
        },
        board: {
            grid: 10,
            from: {externalPort: 1},
            to: {externalPort: 2},
            tiles: [
                {kind: 'wire', slot: 'input'},
                {kind: 'component', source: 'mainParts', role: 'mainPart',
                    repeat: 'oneOrMore', between: {kind: 'wire', slot: 'between'}},
                {kind: 'wire', slot: 'output'}
            ],
            attachments: [{source: 'branches', direction: 'down',
                tiles: [
                    {kind: 'wire', slot: 'entry'},
                    {kind: 'component', source: 'parts', role: 'shuntPart',
                        repeat: 'oneOrMore', between: {kind: 'wire', slot: 'between'}},
                    {kind: 'wire', slot: 'termination'},
                    {kind: 'component', source: 'termination', role: 'termination', repeat: 'one'}
                ]}],
            origin: [40, 100],
            direction: 'right',
            wireBoxLength: 80,
        }
    },
    edgeCoupledFilter: {
        name: 'edgeCoupledFilter',
        version: 1,
        detect: true,
        interface: {from: [1], to: [2]},
        match: {
            externalPortCount: 2,
            coverAllComponents: true,
            paths: [{bind: 'sections', from: {externalPort: 1}, to: {externalPort: 2},
                through: {portCount: 4, symbols: ['coupled-transmission-line', 'microstrip-coupled-line'],
                    portPairs: [[1, 3], [3, 1]]}, minimum: 1}],
            attachments: [{bind: 'terminations', on: 'sections', from: 'unusedPorts',
                through: {portCounts: []}, until: {portCount: 1}, minimum: 0, minimumBranches: 2}]
        },
        board: {
            clearance: 10,
            grid: 10,
            from: {externalPort: 1},
            to: {externalPort: 2},
            origin: [40, 100],
            direction: 'right',
            wireBoxLength: 80,
            tiles: [
                {kind: 'wire'},
                {kind: 'component', source: 'sections', role: 'section', repeat: 'oneOrMore',
                    orientation: {terminals: 'leads', advance: 'down'}, between: {kind: 'wire'}},
                {kind: 'wire'}
            ],
            attachments: [{source: 'terminations', direction: 'terminal', wireBoxLength: 40,
                tiles: [
                    {kind: 'wire'},
                    {kind: 'component', source: 'termination', role: 'termination', repeat: 'one'}
                ]}]
        }
    },
    bridgedT: {
        name: 'bridgedT',
        version: 1,
        detect: true,
        interface: {from: [1], to: [2]},
        match: {
            externalPortCount: 2,
            coverAllComponents: true,
            paths: [{bind: 'mainParts', from: {externalPort: 1}, to: {externalPort: 2},
                through: {portCounts: [2, 3, 4]}, minimum: 1}],
            connections: [{bind: 'bridges', on: 'mainParts', from: 'unusedPorts',
                through: {portCount: 2}, minimum: 1, minimumConnections: 1}],
            attachments: [{bind: 'branches', on: 'mainParts', from: 'unusedPorts',
                through: {portCount: 2}, until: {portCount: 1}, minimum: 1, minimumBranches: 1}]
        },
        board: {
            grid: 10,
            from: {externalPort: 1},
            to: {externalPort: 2},
            origin: [40, 100],
            direction: 'right',
            wireBoxLength: 40,
            tiles: [
                {kind: 'wire'},
                {kind: 'component', source: 'mainParts', role: 'mainPart', repeat: 'oneOrMore',
                    between: {kind: 'wire'}},
                {kind: 'wire'}
            ],
            connections: [{source: 'bridges', direction: 'up', clearance: 60, wireBoxLength: 40,
                tiles: [
                    {kind: 'wire'},
                    {kind: 'component', source: 'parts', role: 'bridgePart', repeat: 'oneOrMore',
                        between: {kind: 'wire'}},
                    {kind: 'wire'}
                ]}],
            attachments: [{source: 'branches', direction: 'down',
                tiles: [
                    {kind: 'wire'},
                    {kind: 'component', source: 'parts', role: 'shuntPart', repeat: 'oneOrMore',
                        between: {kind: 'wire'}},
                    {kind: 'wire'},
                    {kind: 'component', source: 'termination', role: 'termination', repeat: 'one'}
                ]}]
        }
    },
    branchline: {
        name: 'branchline',
        version: 1,
        detect: true,
        interface: {from: [1, 4], to: [2, 3]},
        match: {
            externalPortCount: 4,
            anchors: {symbols: ['tee', 'microstrip-tee'], portCount: 3},
            through: {portCount: 2},
            minimumLaneParts: 1
        },
        board: {
            grid: 10,
            minimumColumns: 2,
            paths: {
                twoPortLane: [
                    {kind: 'wire', slot: 'entry'},
                    {kind: 'component', source: 'parts', role: 'lanePart', repeat: 'oneOrMore',
                        between: {kind: 'wire', slot: 'between'}},
                    {kind: 'wire', slot: 'exit'}
                ]
            },
            rows: [
                {name: 'top', tile: {kind: 'component', role: 'junction'}},
                {name: 'bottom', tile: {kind: 'component', role: 'junction'}}
            ],
            lanes: [
                {name: 'topRail', from: 'top', to: 'top', columns: 'adjacent',
                    direction: 'right', path: 'twoPortLane'},
                {name: 'bottomRail', from: 'bottom', to: 'bottom', columns: 'adjacent',
                    direction: 'right', path: 'twoPortLane'},
                {name: 'rung', from: 'top', to: 'bottom', columns: 'each',
                    direction: 'down', path: 'twoPortLane'}
            ],
            externalPorts: [
                {port: 1, row: 'top', column: 'first', side: 'left'},
                {port: 2, row: 'top', column: 'last', side: 'right'},
                {port: 3, row: 'bottom', column: 'last', side: 'right'},
                {port: 4, row: 'bottom', column: 'first', side: 'left'}
            ],
            origin: [240, 240],
            spacing: 'largestArm',
            wireBoxLength: 20,
            externalPortLead: {kind: 'wire', length: 100}
        }
    },
    powerCombiner: {
        name: 'powerCombiner',
        version: 1,
        detect: true,
        interface: {from: 'remaining', to: [1]},
        use: 'powerDivider',
        transform: {mirrorX: true}
    },
    powerDivider: {
        name: 'powerDivider',
        layout: 'transformer-power-divider',
        variant: 'transformer',
        version: 1,
        detect: true,
        detectionPriority: 10,
        interface: {from: [1], to: 'remaining'},
        match: {
            externalPortCount: 3,
            slots: [
                {name: 'input', symbols: ['transformer'], portCount: 2,
                    ports: {in: [1, 2], out: [1, 2]}},
                {name: 'tap', symbols: ['transformer-auto'], portCount: 3,
                    ports: {center: [1], upper: [2, 3], lower: [2, 3]}},
                {name: 'upper', symbols: ['tee'], portCount: 3,
                    ports: {common: [1], feed: [2, 3], out: [2, 3]}},
                {name: 'lower', symbols: ['tee'], portCount: 3,
                    ports: {common: [1], feed: [2, 3], out: [2, 3]}},
                {name: 'bridge', symbols: ['resistor'], portCount: 2,
                    ports: {top: [1, 2], bottom: [1, 2]}}
            ]
        },
        board: {
            grid: 10,
            layout: 'relations',
            components: [
                {slot: 'input', anchor: 'in',
                    directions: {in: 'left', out: 'right'}},
                {slot: 'tap', anchor: 'center',
                    directions: {center: 'left', upper: 'up', lower: 'down'}},
                {slot: 'upper', anchor: 'feed',
                    directions: {feed: 'left', out: 'right', common: 'down'}},
                {slot: 'bridge', anchor: 'top',
                    directions: {top: 'up', bottom: 'down'}},
                {slot: 'lower', anchor: 'common',
                    directions: {feed: 'left', out: 'right', common: 'up'}}
            ],
            centerlines: [{axis: 'y',
                reference: {slot: 'bridge', between: ['top', 'bottom']},
                align: [{slot: 'input', port: 'in'}, {slot: 'tap', port: 'center'}]}],
            externalPorts: [
                {port: 1, from: {slot: 'input', port: 'in'}, side: 'left'},
                {port: 2, from: {slot: 'upper', port: 'out'}, side: 'right'},
                {port: 3, from: {slot: 'lower', port: 'out'}, side: 'right'}
            ],
            wires: [
                {from: {externalPort: 1}, to: {slot: 'input', port: 'in'}},
                {from: {slot: 'input', port: 'out'}, to: {slot: 'tap', port: 'center'}},
                {from: {slot: 'tap', port: 'upper'}, to: {slot: 'upper', port: 'feed'}, route: 'verticalFirst'},
                {from: {slot: 'tap', port: 'lower'}, to: {slot: 'lower', port: 'feed'}, route: 'verticalFirst'},
                {from: {slot: 'upper', port: 'common'}, to: {slot: 'bridge', port: 'top'}},
                {from: {slot: 'bridge', port: 'bottom'}, to: {slot: 'lower', port: 'common'}},
                {from: {slot: 'upper', port: 'out'}, to: {externalPort: 2}},
                {from: {slot: 'lower', port: 'out'}, to: {externalPort: 3}}
            ]
        },
        alternatives: [{
            name: 'powerDivider',
            layout: 'wilkinson-power-divider',
            variant: 'wilkinson',
            version: 1,
            match: {
                externalPortCount: 3,
                anchors: {symbols: ['tee', 'microstrip-tee'], portCount: 3},
                through: {portCount: 2},
                minimumLaneParts: 1
            },
            board: {
                grid: 10,
                origin: [180, 200],
                spacing: 'byAxis',
                wireBoxLength: 40,
                externalPortLead: {kind: 'wire', length: 80},
                paths: {
                    arm: [
                        {kind: 'wire'},
                        {kind: 'component', source: 'parts', role: 'armPart', repeat: 'oneOrMore',
                            between: {kind: 'wire'}},
                        {kind: 'wire'}
                    ],
                    bridge: [
                        {kind: 'wire'},
                        {kind: 'component', source: 'parts', role: 'isolationPart', repeat: 'oneOrMore',
                            between: {kind: 'wire'}},
                        {kind: 'wire'}
                    ]
                },
                anchors: [
                    {id: 'input', cell: [0, 1], tile: {kind: 'component', role: 'junction'}},
                    {id: 'upper', cell: [1, 0], tile: {kind: 'component', role: 'junction'}},
                    {id: 'lower', cell: [1, 2], tile: {kind: 'component', role: 'junction'}}
                ],
                lanes: [
                    {name: 'upperArm', from: 'input', to: 'upper', path: 'arm',
                        direction: 'right', fromSide: 'up', route: 'verticalFirst'},
                    {name: 'lowerArm', from: 'input', to: 'lower', path: 'arm',
                        direction: 'right', fromSide: 'down', route: 'verticalFirst'},
                    {name: 'isolation', from: 'upper', to: 'lower', path: 'bridge',
                        direction: 'down', through: {symbols: ['resistor'], portCount: 2}}
                ],
                externalPorts: [
                    {port: 1, slot: 'input', side: 'left'},
                    {port: 2, slot: 'upper', side: 'right'},
                    {port: 3, slot: 'lower', side: 'right'}
                ]
            }
        }, {
            name: 'powerDivider', layout: 'junction-power-divider', variant: 'junction', version: 1,
            match: {
                minimumExternalPortCount: 3,
                fan: {commonExternalPort: 1, through: {portCount: 2, straight: true}}
            },
            board: {
                grid: 10, origin: [180, 200], wireBoxLength: 40,
                fan: {direction: 'right', clearance: 60},
                tiles: [
                    {kind: 'wire'},
                    {kind: 'component', source: 'parts', role: 'armPart', repeat: 'oneOrMore',
                        between: {kind: 'wire'}},
                    {kind: 'wire'}
                ]
            }
        }]
    }
};
