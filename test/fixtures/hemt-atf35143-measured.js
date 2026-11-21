// Modified: 2026-11-20
// Manufacturer datasheet p.8; VDS=2 V, IDS=15 mA, TA=25 C.
// Input/output lead reference planes include the specified alumina-board
// source vias. Package model p.16 excludes those test-board vias.
export const atf35143Measured = {
    source: 'https://sites.units.it/carrato/didatt/corsi_old/E2_web/modulo_carrato/doc/datasheet_discreti/HEMT_ATF35143.pdf',
    vds: 2, id: .015,
    // GHz, S11 mag/deg, S21 mag/deg, S12 mag/deg, S22 mag/deg.
    rows: [
        [.5, .99, -19.75, 7.10, 164.04, .023, 77.60, .57, -14.99],
        [1, .95, -40.15, 6.83, 147.18, .044, 64.80, .54, -27.61],
        [2, .84, -74.93, 6.02, 118.41, .077, 44.36, .48, -53.06],
        [3, .73, -107.08, 5.21, 93.08, .100, 26.85, .41, -75.32],
        [4, .64, -139.07, 4.51, 70.17, .113, 11.15, .35, -94.59],
        [5, .59, -169.70, 3.93, 49.03, .122, -2.96, .29, -113.89],
        [6, .56, 161.74, 3.47, 29.27, .129, -16.43, .23, -134.46]
    ]
};
