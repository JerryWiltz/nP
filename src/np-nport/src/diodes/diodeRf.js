// Modified: 2026-11-21
import {complex} from '../../../np-math/src/complex';
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../physicalConstants';
import {diodeLinearResponse} from './diodeLinear';

export function seriesTwoPortFromImpedance(frequency, impedance, ro) {
    const denominator = impedance.add(complex(2 * ro, 0));
    const reflection = impedance.div(denominator);
    const transmission = complex(2 * ro, 0).div(denominator);
    return [frequency, reflection, transmission, transmission, reflection];
}

export function diodeFrequencyRow(p, point, frequency, ro, temperature, leakageResistance, packageParameters) {
    const externalConductance = 1 / leakageResistance;
    const response = diodeLinearResponse({conductance: point.conductance, capacitance: point.totalCapacitance,
        seriesResistance: p.RS, externalConductance, referenceImpedance: ro, packageParameters}, frequency);
    const spars = seriesTwoPortFromImpedance(frequency, response.port.inv(), ro);
    const shotDensity = 2 * ELEMENTARY_CHARGE * Math.abs(point.junctionCurrent);
    const flickerDensity = p.KF && frequency > 0 ? p.KF * Math.abs(point.junctionCurrent) ** p.AF / frequency : 0;
    let noise = (4 * BOLTZMANN * temperature * p.RS * response.junction.mag() ** 2 +
        shotDensity + flickerDensity) * ro / response.productDenominator.mag() ** 2;
    const externalTransfer = complex(1, 0).add(response.port.mul(complex(2 * ro, 0)));
    noise += 4 * BOLTZMANN * temperature * externalConductance * ro / externalTransfer.mag() ** 2;
    return {spars, noise: {frequency, C: [[complex(noise, 0), complex(-noise, 0)],
        [complex(-noise, 0), complex(noise, 0)]]}};
}
