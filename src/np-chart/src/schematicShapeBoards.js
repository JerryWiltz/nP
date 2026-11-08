// Modified: 2026-11-07
// Declarative board settings consumed by the schematic layout interpreter.
export const schematicShapeBoards = {
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
            componentLabelOffset: [0, -90],
            portLabelOffset: [0, 60]
        }
    },
    ladder: {
        name: 'ladder',
        version: 1,
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
                componentLabelOffset: [100, 0],
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
            componentLabelOffset: [0, -90],
            portLabelOffset: [0, 60]
        }
    },
    edgeCoupledFilter: {
        name: 'edgeCoupledFilter',
        version: 1,
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
            spacing: 'attachments',
            clearance: 10,
            grid: 10,
            from: {externalPort: 1},
            to: {externalPort: 2},
            origin: [40, 100],
            direction: 'right',
            wireBoxLength: 80,
            componentLabelOffset: [0, -90],
            portLabelOffset: [0, 60],
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
            componentLabelOffset: [0, -90],
            portLabelOffset: [0, 60],
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
            attachments: [{source: 'branches', direction: 'down', componentLabelOffset: [100, 0],
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
        interface: {from: [2, 3], to: [1]},
        use: 'powerDivider',
        transform: {mirrorX: true}
    },
    powerDivider: {
        name: 'powerDivider',
        layout: 'transformer-power-divider',
        variant: 'transformer',
        version: 1,
        interface: {from: [1], to: [2, 3]},
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
            origin: [0, 0],
            components: [
                {slot: 'input', anchor: 'in', at: [12, 60],
                    directions: {in: 'left', out: 'right'}},
                {slot: 'tap', anchor: 'center', from: {slot: 'input', port: 'out'}, offset: [4, 0],
                    directions: {center: 'left', upper: 'up', lower: 'down'}},
                {slot: 'upper', anchor: 'feed', from: {slot: 'tap', port: 'upper'}, offset: [12, -4],
                    directions: {feed: 'left', out: 'right', common: 'down'}},
                {slot: 'bridge', anchor: 'top', from: {slot: 'upper', port: 'common'}, offset: [0, 2],
                    directions: {top: 'up', bottom: 'down'}},
                {slot: 'lower', anchor: 'common', from: {slot: 'bridge', port: 'bottom'}, offset: [0, 2],
                    directions: {feed: 'left', out: 'right', common: 'up'}}
            ],
            centerlines: [{axis: 'y',
                reference: {slot: 'bridge', between: ['top', 'bottom']},
                align: [{slot: 'input', port: 'in'}, {slot: 'tap', port: 'center'}]}],
            externalPorts: [
                {port: 1, from: {slot: 'input', port: 'in'}, side: 'left', cells: 8},
                {port: 2, from: {slot: 'upper', port: 'out'}, side: 'right', cells: 8},
                {port: 3, from: {slot: 'lower', port: 'out'}, side: 'right', cells: 8}
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
        }]
    }
};
