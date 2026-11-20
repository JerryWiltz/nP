// Modified: 2026-11-19
// ngspice 39.3, 1 kOhm external bias resistor; companion .cir decks.
// Legacy references use a B-source implementation of its separate current law.
export const diodeNetworkDcReference = [
    {constructorName: 'D', temperature: 300.15, supply: 1, vd: 0.5675388582492391, id: 0.00043246114175076085},
    {constructorName: 'D', temperature: 300.15, supply: -5, vd: -4.999994789926948, id: -5.210073051806208e-9},
    {constructorName: 'D', temperature: 300.15, supply: -120, vd: -110.13042532500559, id: -0.0098695746749944},
    {constructorName: 'D', temperature: 338.15, supply: 1, vd: 0.4968644524386806, id: 0.0005031355475613195},
    {constructorName: 'diode1N4148', temperature: 293, supply: 1, vd: 0.7983683532016751, id: 0.00020163164679832494},
    {constructorName: 'diode1N4148', temperature: 293, supply: -5, vd: -4.999998722500948, id: -1.277499052723674e-9},
    {constructorName: 'diode1N4148', temperature: 293, supply: -120, vd: -109.35929118249125, id: -0.01064070881750874}
];
