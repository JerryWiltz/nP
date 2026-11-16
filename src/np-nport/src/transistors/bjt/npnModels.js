// Modified: 2026-11-15
// SPICE Gummel–Poon parameters in SI units. Provenance and omissions are
// documented in developmentDocs/transistorModels.md. No part-wide NF/IP fits.
import {bjtModel} from './bjtModel';

const records = {
    '2N3904': {
        manufacturer: 'Fairchild Semiconductor', material: 'silicon', structure: 'NPN bipolar',
        mathematicalModel: 'SPICE modified Gummel–Poon', modelVersion: 'SPICE level 1',
        source: 'https://media.digikey.com/pdf/Data%20Sheets/Fairchild%20PDFs/2N3904.pdf',
        leakageSource: 'https://learninglink.oup.com/protected/files/content/file/1574079180264-SedraSmith8e_SPICE_Problem_Guide_AppendixB.pdf',
        package: 'Terminal resistances included; no explicit TO-92 lead inductance or package capacitance',
        parameters: {IS: 6.734e-15, BF: 416.4, VAF: 74.03, IKF: 0.06678,
            NE: 1.259, ISE: 6.734e-15, XTB: 1.5, BR: 0.7371,
            RC: 1, RB: 10, CJC: 3.638e-12, MJC: 0.3085,
            CJE: 4.493e-12, MJE: 0.2593, TR: 239.5e-9, TF: 301.2e-12,
            ITF: 0.4, VTF: 4, XTF: 2},
        inductors: [], capacitors: []
    },
    BFR93A: {
        manufacturer: 'Philips Semiconductors / NXP', material: 'silicon', structure: 'NPN bipolar',
        mathematicalModel: 'SPICE modified Gummel–Poon', modelVersion: 'BFR91A 1.0, February 1992; BFR93A September 1995',
        source: 'https://www.nxp.com/downloads/en/spice-model/BFR93A_SPICE.prm',
        package: 'Published SOT23 L/C network around the BFR91A die model',
        parameters: {IS: 1.32873e-15, BF: 102, NF: 1.00025, VAF: 51.9033,
            IKF: 8.15511, ISE: 1.39029e-14, NE: 1.51292, BR: 17.6953,
            NR: 0.994038, VAR: 3.28032, IKR: 10, ISC: 1.04297e-15, NC: 1.18993,
            RB: 10, RE: 0.763636, RC: 9, CJE: 2.03216e-12, VJE: 0.6,
            MJE: 0.290076, TF: 6.5579e-12, XTF: 38.9752, VTF: 10.9308,
            ITF: 0.521078, CJC: 1.00353e-12, VJC: 0.340808, MJC: 0.194223},
        // External B,C,E: 0,1,2; contacts: 3,4,5; intrinsic: 6,7,8;
        // outer package base and emitter: 9,10. Port order is NOT SPICE C,B,E.
        inductors: [[0, 9, 0.35e-9], [9, 3, 0.4e-9], [1, 4, 0.17e-9],
            [2, 10, 0.35e-9], [10, 5, 0.83e-9]],
        capacitors: [[9, 4, 71e-15], [9, 10, 2e-15], [4, 10, 71e-15]]
    }
};

export function npnModel(name) {
    return bjtModel(records, name, '2N3904', 'NPN');
}
