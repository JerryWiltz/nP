// Modified: 2026-11-01

function branchSeriesTop(nP) {
    const tee1 = nP.Tee();
    const tee2 = nP.Tee();
    const tee3 = nP.Tee();
    const tee4 = nP.Tee();
    const topLine = nP.Tlin(35.35, 0.025);
    const leftLine = nP.Tlin(50, 0.025);
    const rightLine = nP.Tlin(50, 0.025);
    const bottomLine = nP.Tlin(35.35, 0.025);
    const topResistor = nP.R(10);
    return nP.nodal(
        [tee1, 5, 1, 2],
        [topLine, 2, 13],
        [topResistor, 13, 3],
        [tee2, 6, 3, 4],
        [leftLine, 5, 7],
        [rightLine, 6, 8],
        [tee3, 7, 10, 9],
        [bottomLine, 10, 11],
        [tee4, 8, 12, 11],
        ['out', 1, 4, 12, 9]
    );
}

function branchSeriesOpposite(nP) {
    const tee1 = nP.Tee();
    const tee2 = nP.Tee();
    const tee3 = nP.Tee();
    const tee4 = nP.Tee();
    const topLine = nP.Tlin(35.35, 0.025);
    const leftLine = nP.Tlin(50, 0.025);
    const rightLine = nP.Tlin(50, 0.025);
    const bottomLine = nP.Tlin(35.35, 0.025);
    const topResistor = nP.R(10);
    const bottomResistor = nP.R(15);
    return nP.nodal(
        [tee1, 5, 1, 2],
        [topLine, 2, 13],
        [topResistor, 13, 3],
        [tee2, 6, 3, 4],
        [leftLine, 5, 7],
        [rightLine, 6, 8],
        [tee3, 7, 10, 9],
        [bottomLine, 10, 14],
        [bottomResistor, 14, 11],
        [tee4, 8, 12, 11],
        ['out', 1, 4, 12, 9]
    );
}

function ratRaceSeries(nP) {
    const tee1 = nP.Tee();
    const tee2 = nP.Tee();
    const tee3 = nP.Tee();
    const tee4 = nP.Tee();
    const line1 = nP.Tlin(70.7, 0.025);
    const line2 = nP.Tlin(70.7, 0.025);
    const line3 = nP.Tlin(70.7, 0.025);
    const longLine = nP.Tlin(70.7, 0.075);
    const resistor = nP.R(10);
    return nP.nodal(
        [tee1, 1, 12, 2],
        [line1, 2, 13],
        [resistor, 13, 3],
        [tee2, 4, 3, 5],
        [line2, 5, 6],
        [tee3, 7, 6, 8],
        [line3, 8, 9],
        [tee4, 10, 9, 11],
        [longLine, 11, 12],
        ['out', 1, 4, 10, 7]
    );
}

function threeShuntLadder(nP) {
    const inputResistor = nP.R(20);
    const tee1 = nP.Tee();
    const tee2 = nP.Tee();
    const tee3 = nP.Tee();
    const firstShunt = nP.C(1e-12);
    const middleSeries = nP.L(5e-9);
    const secondShunt = nP.L(4e-9);
    const lastSeries = nP.R(30);
    const thirdShunt = nP.C(2e-12);
    const outputResistor = nP.R(20);
    const short1 = nP.Short();
    const short2 = nP.Short();
    const short3 = nP.Short();
    return nP.nodal(
        [inputResistor, 1, 2],
        [tee1, 3, 2, 4],
        [firstShunt, 3, 5],
        [short1, 5],
        [middleSeries, 4, 6],
        [tee2, 7, 6, 8],
        [secondShunt, 7, 9],
        [short2, 9],
        [lastSeries, 8, 10],
        [tee3, 11, 10, 12],
        [thirdShunt, 11, 13],
        [short3, 13],
        [outputResistor, 12, 14],
        ['out', 1, 14]
    );
}

function twoStageDivider(nP) {
    const inputTee = nP.Tee();
    const upperFirstTee = nP.Tee();
    const lowerFirstTee = nP.Tee();
    const upperSecondTee = nP.Tee();
    const lowerSecondTee = nP.Tee();
    const firstIsolation = nP.R(100);
    const secondIsolation = nP.R(100);
    const upperFirstLine = nP.Tlin(70.7, 0.025);
    const lowerFirstLine = nP.Tlin(70.7, 0.025);
    const upperSecondLine = nP.Tlin(70.7, 0.025);
    const lowerSecondLine = nP.Tlin(70.7, 0.025);
    return nP.nodal(
        [inputTee, 1, 2, 3],
        [upperFirstTee, 4, 2, 5],
        [lowerFirstTee, 6, 3, 7],
        [firstIsolation, 4, 6],
        [upperFirstLine, 5, 8],
        [lowerFirstLine, 7, 9],
        [upperSecondTee, 10, 8, 11],
        [lowerSecondTee, 12, 9, 13],
        [secondIsolation, 10, 12],
        [upperSecondLine, 11, 14],
        [lowerSecondLine, 13, 15],
        ['out', 1, 14, 15]
    );
}

function ringWithChord(nP) {
    const junction1 = nP.Tee4();
    const junction2 = nP.Tee();
    const junction3 = nP.Tee4();
    const junction4 = nP.Tee();
    const side1 = nP.Tlin(50, 0.025);
    const side2 = nP.Tlin(50, 0.025);
    const side3 = nP.Tlin(50, 0.025);
    const side4 = nP.Tlin(50, 0.025);
    const bridge = nP.R(75);
    return nP.nodal(
        [junction1, 1, 2, 3, 16],
        [side1, 2, 5],
        [junction2, 4, 5, 6],
        [side2, 6, 8],
        [junction3, 7, 8, 9, 17],
        [side3, 9, 11],
        [junction4, 10, 11, 12],
        [side4, 12, 3],
        [bridge, 16, 17],
        ['out', 1, 4, 7, 10]
    );
}

function reorderedBranchRing(nP) {
    const tee1 = nP.Tee();
    const tee2 = nP.Tee();
    const tee3 = nP.Tee();
    const tee4 = nP.Tee();
    const topLine = nP.Tlin(35.35, 0.025);
    const leftLine = nP.Tlin(50, 0.025);
    const rightLine = nP.Tlin(50, 0.025);
    const bottomLine = nP.Tlin(35.35, 0.025);
    const topResistor = nP.R(10);
    return nP.nodal(
        [tee4, 108, 112, 111],
        [bottomLine, 110, 111],
        [tee3, 107, 110, 109],
        [rightLine, 106, 108],
        [leftLine, 105, 107],
        [tee2, 106, 103, 104],
        [topResistor, 113, 103],
        [topLine, 102, 113],
        [tee1, 105, 101, 102],
        ['out', 101, 104, 112, 109]
    );
}

function twoCellBranchline(nP) {
    const tee1 = nP.Tee();
    const tee2 = nP.Tee();
    const tee3 = nP.Tee();
    const tee4 = nP.Tee();
    const tee5 = nP.Tee();
    const tee6 = nP.Tee();
    const topLine1 = nP.Tlin(50, 0.025);
    const topLine2 = nP.Tlin(50, 0.025);
    const bottomLine1 = nP.Tlin(50, 0.025);
    const bottomLine2 = nP.Tlin(50, 0.025);
    const leftLine = nP.Tlin(50, 0.025);
    const middleLine = nP.Tlin(50, 0.025);
    const rightLine = nP.Tlin(50, 0.025);
    return nP.nodal(
        [tee1, 11, 1, 12],
        [topLine1, 12, 13],
        [tee2, 14, 13, 15],
        [topLine2, 15, 16],
        [tee3, 17, 16, 2],
        [leftLine, 11, 21],
        [tee4, 21, 22, 4],
        [bottomLine1, 22, 23],
        [tee5, 24, 25, 23],
        [bottomLine2, 25, 26],
        [tee6, 27, 3, 26],
        [middleLine, 14, 24],
        [rightLine, 17, 27],
        ['out', 1, 2, 3, 4]
    );
}

function microstripBranchline(nP) {
    const tee1 = nP.mtee();
    const tee2 = nP.mtee();
    const tee3 = nP.mtee();
    const tee4 = nP.mtee();
    const topLine = nP.mlin();
    const leftLine = nP.mlin();
    const bottomLine = nP.mlin();
    const rightLine = nP.mlin();
    return nP.nodal(
        [tee1, 5, 1, 2],
        [topLine, 2, 3],
        [tee2, 6, 3, 4],
        [leftLine, 5, 7],
        [tee3, 7, 9, 10],
        [bottomLine, 10, 11],
        [tee4, 8, 11, 12],
        [rightLine, 6, 8],
        ['out', 1, 4, 12, 9]
    );
}

export function buildSchematicStressCases(nP) {
    nP.global.fList = [2e9];
    return [
        {id: 'branch-series-top', title: 'Branch ring with a series resistor',
            circuit: branchSeriesTop(nP)},
        {id: 'branch-series-opposite', title: 'Branch ring with opposite resistors',
            circuit: branchSeriesOpposite(nP)},
        {id: 'rat-race-series', title: 'Rat-race with a series resistor',
            circuit: ratRaceSeries(nP)},
        {id: 'three-shunt-ladder', title: 'Three-shunt ladder',
            circuit: threeShuntLadder(nP)},
        {id: 'two-stage-divider', title: 'Two-stage power divider',
            circuit: twoStageDivider(nP)},
        {id: 'ring-with-chord', title: 'Ring with a cross bridge',
            circuit: ringWithChord(nP)},
        {id: 'branch-reordered', title: 'Branch ring with reordered connections',
            circuit: reorderedBranchRing(nP)},
        {id: 'branchline-two-cell', title: 'Two-cell branchline',
            circuit: twoCellBranchline(nP)},
        {id: 'branchline-microstrip', title: 'Microstrip branchline',
            circuit: microstripBranchline(nP)}
    ];
}
