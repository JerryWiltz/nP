// Modified: 2026-11-01

export function buildSchematicCases(nP) {
    nP.global.fList = [2e9];
    const cases = [];

    const parallelR1 = nP.R(50);
    const parallelR2 = nP.R(100);
    const parallel = nP.nodal(
        [parallelR1, 1, 2],
        [parallelR2, 1, 2],
        ['out', 1, 2]
    );
    cases.push({id: 'parallel-resistors', title: 'Two parallel resistors', circuit: parallel});

    const dividerTee = nP.Tee();
    const dividerLine1 = nP.Tlin(50, 0.025);
    const dividerLine2 = nP.Tlin(75, 0.025);
    const divider = nP.nodal(
        [dividerTee, 1, 2, 3],
        [dividerLine1, 2, 4],
        [dividerLine2, 3, 5],
        ['out', 1, 4, 5]
    );
    cases.push({id: 'three-port-divider', title: 'Three-port tee divider', circuit: divider});

    const loopTee1 = nP.Tee();
    const loopTee2 = nP.Tee();
    const loopR1 = nP.R(50);
    const loopR2 = nP.R(100);
    const twoBranchLoop = nP.nodal(
        [loopTee1, 1, 2, 3],
        [loopR1, 2, 5],
        [loopR2, 3, 6],
        [loopTee2, 4, 5, 6],
        ['out', 1, 4]
    );
    cases.push({id: 'two-branch-loop', title: 'Two-resistor loop', circuit: twoBranchLoop});

    const seriesR1 = nP.R(25);
    const seriesR2 = nP.R(75);
    const series = nP.nodal(
        [seriesR1, 1, 2],
        [seriesR2, 2, 3],
        ['out', 1, 3]
    );
    cases.push({id: 'series-resistors', title: 'Two resistors in series', circuit: series});

    const sectionR1 = nP.R(50);
    const sectionR2 = nP.R(75);
    const sectionTee = nP.Tee();
    const sectionC = nP.C(1e-12);
    const sectionShort = nP.Short();
    const sectionLine = nP.Tlin(50, 0.01);
    const seriesLadder = nP.nodal(
        [sectionShort, 7],
        [sectionTee, 5, 4, 6],
        [sectionR2, 27, 4],
        [sectionC, 5, 7],
        [sectionR1, 1, 27],
        [sectionLine, 6, 11],
        ['out', 1, 11]
    );
    cases.push({id: 'series-then-ladder',
        title: 'Two shapes in one network: series (1→4), ladder (4→11)',
        circuit: seriesLadder, shapes: [
            {name: 'series', from: 1, to: 4},
            {name: 'ladder', from: 4, to: 11}
        ]});

    const rcR = nP.R(50);
    const rcTee = nP.Tee();
    const rcC = nP.C(1e-12);
    const rcShort = nP.Short();
    const rcLowPass = nP.nodal(
        [rcR, 1, 2],
        [rcTee, 3, 2, 4],
        [rcC, 3, 5],
        [rcShort, 5],
        ['out', 1, 4]
    );
    cases.push({id: 'rc-low-pass', title: 'RC low-pass with a shunt branch', circuit: rcLowPass});

    const piTee1 = nP.Tee();
    const piTee2 = nP.Tee();
    const piC1 = nP.C(1e-12);
    const piL = nP.L(5e-9);
    const piC2 = nP.C(1e-12);
    const piShort1 = nP.Short();
    const piShort2 = nP.Short();
    const piFilter = nP.nodal(
        [piTee1, 2, 1, 3],
        [piC1, 2, 4],
        [piShort1, 4],
        [piL, 3, 5],
        [piTee2, 6, 5, 7],
        [piC2, 6, 8],
        [piShort2, 8],
        ['out', 1, 7]
    );
    cases.push({id: 'pi-filter', title: 'C-L-C pi filter', circuit: piFilter});

    const cascadeR = nP.R(25);
    const cascadeL = nP.L(5e-9);
    const cascadeC = nP.C(1e-12);
    const cascade = nP.cascade(cascadeR, cascadeL, cascadeC);
    cases.push({id: 'rlc-cascade', title: 'R-L-C cascade', circuit: cascade});

    const bendR = nP.R(50);
    const bend = nP.mbend();
    const bendL = nP.L(5e-9);
    const bendPath = nP.nodal(
        [bendR, 1, 2],
        [bend, 2, 3],
        [bendL, 3, 4],
        ['out', 1, 4]
    );
    cases.push({id: 'bend-path', title: 'Path with a microstrip bend', circuit: bendPath});

    const tee4Split = nP.Tee4();
    const tee4Join = nP.Tee4();
    const tee4R = nP.R(50);
    const tee4L = nP.L(5e-9);
    const tee4C = nP.C(1e-12);
    const threeLanes = nP.nodal(
        [tee4Split, 1, 2, 3, 4],
        [tee4R, 2, 5],
        [tee4L, 3, 6],
        [tee4C, 4, 7],
        [tee4Join, 8, 7, 6, 5],
        ['out', 1, 8]
    );
    cases.push({id: 'three-lanes', title: 'Three distinct parallel lanes', circuit: threeLanes});

    const tee5Split = nP.Tee5();
    const tee5Join = nP.Tee5();
    const tee5R1 = nP.R(25);
    const tee5R2 = nP.R(50);
    const tee5L = nP.L(5e-9);
    const tee5C = nP.C(1e-12);
    const fourLanes = nP.nodal(
        [tee5Split, 1, 2, 3, 4, 5],
        [tee5R1, 2, 6],
        [tee5R2, 3, 7],
        [tee5L, 4, 8],
        [tee5C, 5, 9],
        [tee5Join, 10, 9, 8, 7, 6],
        ['out', 1, 10]
    );
    cases.push({id: 'four-lanes', title: 'Four distinct parallel lanes', circuit: fourLanes});

    const wilkinsonInput = nP.Tee();
    const wilkinsonOutput1 = nP.Tee();
    const wilkinsonOutput2 = nP.Tee();
    const wilkinsonLine1 = nP.Tlin(70.7, 0.025);
    const wilkinsonLine2 = nP.Tlin(70.7, 0.025);
    const wilkinsonR = nP.R(100);
    const wilkinson = nP.nodal(
        [wilkinsonInput, 1, 2, 3],
        [wilkinsonLine1, 2, 4],
        [wilkinsonLine2, 3, 5],
        [wilkinsonOutput1, 6, 4, 7],
        [wilkinsonOutput2, 8, 5, 9],
        [wilkinsonR, 6, 8],
        ['out', 1, 7, 9]
    );
    cases.push({id: 'wilkinson-divider', title: 'Wilkinson power divider', circuit: wilkinson});

    const coupledLine = nP.Tclin(100, 30, 0.0373);
    const coupled = nP.nodal(
        [coupledLine, 1, 2, 3, 4],
        ['out', 1, 2, 3, 4]
    );
    cases.push({id: 'coupled-line', title: 'Four-port coupled line', circuit: coupled});

    const fixtureCoupler = nP.Coupler180();
    const fixtureR = nP.R(50);
    const fixtureLoad1 = nP.Load();
    const fixtureLoad2 = nP.Load();
    const fixture = nP.nodal(
        [fixtureCoupler, 1, 2, 3, 4],
        [fixtureR, 2, 5],
        [fixtureLoad1, 3],
        [fixtureLoad2, 4],
        ['out', 1, 5]
    );
    cases.push({id: 'coupler-fixture', title: 'Coupler with two terminations', circuit: fixture});

    const highPassC = nP.C(1e-12);
    const highPassTee = nP.Tee();
    const highPassR = nP.R(50);
    const highPassShort = nP.Short();
    const rcHighPass = nP.nodal(
        [highPassC, 1, 2],
        [highPassTee, 3, 2, 4],
        [highPassR, 3, 5],
        [highPassShort, 5],
        ['out', 1, 4]
    );
    cases.push({id: 'rc-high-pass', title: 'RC high-pass with a shunt branch', circuit: rcHighPass});

    const rlR = nP.R(50);
    const rlTee = nP.Tee();
    const rlL = nP.L(5e-9);
    const rlShort = nP.Short();
    const rlShunt = nP.nodal(
        [rlR, 1, 2],
        [rlTee, 3, 2, 4],
        [rlL, 3, 5],
        [rlShort, 5],
        ['out', 1, 4]
    );
    cases.push({id: 'rl-shunt', title: 'Series R with a shunt inductor', circuit: rlShunt});

    const ladderR1 = nP.R(20);
    const ladderTee1 = nP.Tee();
    const ladderC1 = nP.C(1e-12);
    const ladderShort1 = nP.Short();
    const ladderL = nP.L(5e-9);
    const ladderTee2 = nP.Tee();
    const ladderC2 = nP.C(2e-12);
    const ladderShort2 = nP.Short();
    const ladderR2 = nP.R(20);
    const twoShuntLadder = nP.nodal(
        [ladderR1, 1, 2],
        [ladderTee1, 3, 2, 4],
        [ladderC1, 3, 5],
        [ladderShort1, 5],
        [ladderL, 4, 6],
        [ladderTee2, 7, 6, 8],
        [ladderC2, 7, 9],
        [ladderShort2, 9],
        [ladderR2, 8, 10],
        ['out', 1, 10]
    );
    cases.push({id: 'two-shunt-ladder', title: 'Two-shunt L-C ladder', circuit: twoShuntLadder});

    const tR1 = nP.R(25);
    const tTee = nP.Tee();
    const tShuntR = nP.R(100);
    const tShort = nP.Short();
    const tR2 = nP.R(25);
    const tAttenuator = nP.nodal(
        [tR1, 1, 2],
        [tTee, 3, 2, 4],
        [tShuntR, 3, 5],
        [tShort, 5],
        [tR2, 4, 6],
        ['out', 1, 6]
    );
    cases.push({id: 't-attenuator', title: 'Resistive T attenuator', circuit: tAttenuator});

    const padTee1 = nP.Tee();
    const padTee2 = nP.Tee();
    const padShunt1 = nP.R(100);
    const padSeries = nP.R(25);
    const padShunt2 = nP.R(100);
    const padShort1 = nP.Short();
    const padShort2 = nP.Short();
    const piAttenuator = nP.nodal(
        [padTee1, 2, 1, 3],
        [padShunt1, 2, 4],
        [padShort1, 4],
        [padSeries, 3, 5],
        [padTee2, 6, 5, 7],
        [padShunt2, 6, 8],
        [padShort2, 8],
        ['out', 1, 7]
    );
    cases.push({id: 'pi-attenuator', title: 'Resistive pi attenuator', circuit: piAttenuator});

    const star4 = nP.Tee4();
    const star4R1 = nP.R(25);
    const star4R2 = nP.R(50);
    const star4R3 = nP.R(75);
    const fourPortStar = nP.nodal(
        [star4, 1, 2, 3, 4],
        [star4R1, 2, 5],
        [star4R2, 3, 6],
        [star4R3, 4, 7],
        ['out', 1, 5, 6, 7]
    );
    cases.push({id: 'four-port-star', title: 'Four-port resistor star', circuit: fourPortStar});

    const star5 = nP.Tee5();
    const star5R1 = nP.R(25);
    const star5R2 = nP.R(50);
    const star5R3 = nP.R(75);
    const star5R4 = nP.R(100);
    const fivePortStar = nP.nodal(
        [star5, 1, 2, 3, 4, 5],
        [star5R1, 2, 6],
        [star5R2, 3, 7],
        [star5R3, 4, 8],
        [star5R4, 5, 9],
        ['out', 1, 6, 7, 8, 9]
    );
    cases.push({id: 'five-port-star', title: 'Five-port resistor star', circuit: fivePortStar});

    const twoCoupler1 = nP.Coupler180();
    const twoCoupler2 = nP.Coupler180();
    const twoCouplerLoad1 = nP.Load();
    const twoCouplerLoad2 = nP.Load();
    const twoCouplerLoad3 = nP.Load();
    const twoCouplerLoad4 = nP.Load();
    const twoCouplerFixture = nP.nodal(
        [twoCoupler1, 1, 2, 3, 4],
        [twoCoupler2, 2, 5, 6, 7],
        [twoCouplerLoad1, 3],
        [twoCouplerLoad2, 4],
        [twoCouplerLoad3, 6],
        [twoCouplerLoad4, 7],
        ['out', 1, 5]
    );
    cases.push({id: 'two-coupler-fixture', title: 'Two couplers and four loads', circuit: twoCouplerFixture});

    const lineTee = nP.Tee();
    const line1 = nP.Tlin(35, 0.02);
    const line2 = nP.Tlin(50, 0.04);
    const line3 = nP.Tlin(75, 0.06);
    const lineStar = nP.nodal(
        [lineTee, 1, 2, 3],
        [line1, 2, 4],
        [line2, 3, 5],
        [line3, 4, 6],
        ['out', 1, 5, 6]
    );
    cases.push({id: 'unequal-line-star', title: 'Unequal transmission-line star', circuit: lineStar});

    return cases;
}
