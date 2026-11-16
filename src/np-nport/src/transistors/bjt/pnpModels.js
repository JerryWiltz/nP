// Modified: 2026-11-15
import {bjtModel} from './bjtModel';

const records = {
    '2N3906': {
        manufacturer: 'Fairchild Semiconductor', material: 'silicon', structure: 'PNP bipolar',
        mathematicalModel: 'SPICE modified Gummel–Poon', modelVersion: 'SPICE level 1',
        source: 'https://www2.ensc.sfu.ca/reference/data-sheets/2N3906.PDF',
        package: 'Terminal resistances included; no explicit TO-92 lead inductance or package capacitance',
        parameters: {IS: 1.41e-15, VAF: 18.7, BF: 180.7, NE: 1.5, ISE: 0,
            IKF: 0.08, XTB: 1.5, BR: 4.977, NC: 2, ISC: 0,
            RC: 2.5, CJC: 9.728e-12, MJC: 0.5776, VJC: 0.75, FC: 0.5,
            CJE: 8.063e-12, MJE: 0.3677, VJE: 0.75,
            TR: 33.42e-9, TF: 179.3e-12, ITF: 0.4, VTF: 4, XTF: 6, RB: 10},
        inductors: [], capacitors: []
    }
};

export function pnpModel(name) {
    return bjtModel(records, name, '2N3906', 'PNP');
}
