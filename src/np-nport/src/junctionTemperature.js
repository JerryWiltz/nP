// Modified: 2026-11-15
import {BOLTZMANN, ELEMENTARY_CHARGE} from './physicalConstants';

function potentialCorrection(temperature) {
    const vt = BOLTZMANN * temperature / ELEMENTARY_CHARGE;
    const bandgap = 1.16 - 7.02e-4 * temperature ** 2 / (temperature + 1108);
    const reference = 300.15;
    return -2 * vt * (1.5 * Math.log(temperature / reference) -
        bandgap / (2 * vt) + 1.1150877 / (2 * BOLTZMANN * reference / ELEMENTARY_CHARGE));
}
// SPICE temperature scaling of junction potential and zero-bias capacitance.
export function temperatureJunction(capacitance, potential, grading, tnom, temperature) {
    const nominalCorrection = potentialCorrection(tnom), correction = potentialCorrection(temperature);
    const pbo = (potential - nominalCorrection) / (tnom / 300.15);
    const adjustedPotential = temperature / 300.15 * pbo + correction;
    const nominalFactor = 1 + grading * (4e-4 * (tnom - 300.15) - (potential - pbo) / pbo);
    const factor = 1 + grading * (4e-4 * (temperature - 300.15) - (adjustedPotential - pbo) / pbo);
    if (adjustedPotential <= 0 || factor <= 0) throw new RangeError('Temperature is outside the junction model range.');
    return [capacitance * factor / nominalFactor, adjustedPotential];
}
