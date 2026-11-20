// Modified: 2026-11-19
// Independent ngspice 39.3, companion MOSFET divider decks.
// ngspice @m[id]/@m[ib] are polarity-normalized; convert to signed physical currents.
export const mosfetDcReference = [
    {
        "name": "NMOS",
        "body": "source",
        "temperature": 300.15,
        "vg": 3.8367346938775513,
        "vd": 6.049116459681064,
        "vs": 2.704947063779742,
        "id": 0.0027049470637796865,
        "bodyCurrent": -8.455396448408594e-14
    },
    {
        "name": "NMOS",
        "body": "external",
        "temperature": 300.15,
        "vg": 3.8367346938775513,
        "vd": 8.00318696431239,
        "vs": 1.8167331978797099,
        "id": 0.0018167331980391706,
        "bodyCurrent": -1.6000981992016223e-13
    },
    {
        "name": "PMOS",
        "body": "source",
        "temperature": 300.15,
        "vg": -3.8367346938775513,
        "vd": -8.92329826929387,
        "vs": -1.3985007866833903,
        "id": -0.001398500786683366,
        "bodyCurrent": 8.4708371063306e-14
    },
    {
        "name": "PMOS",
        "body": "external",
        "temperature": 300.15,
        "vg": -3.8367346938775513,
        "vd": -10.538412072935198,
        "vs": -0.6643581485045433,
        "id": -0.0006643581486645952,
        "bodyCurrent": 1.6001120277022146e-13
    }
];
