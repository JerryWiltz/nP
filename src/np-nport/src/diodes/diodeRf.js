// Modified: 2026-11-15
import {complex} from '../../../np-math/src/complex';
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../physicalConstants';

export function seriesTwoPortFromImpedance(frequency, impedance, ro) {
    const denominator = impedance.add(complex(2 * ro, 0));
    const reflection = impedance.div(denominator);
    const transmission = complex(2 * ro, 0).div(denominator);
    return [frequency, reflection, transmission, transmission, reflection];
}

export function diodeFrequencyRow(p, point, frequency, ro, temperature, leakageResistance) {
    const admittance = complex(point.conductance, 2 * Math.PI * frequency * point.totalCapacitance);
    const junctionImpedance = admittance.inv();
    const seriesImpedance = junctionImpedance.add(complex(p.RS, 0));
    const externalConductance = 1 / leakageResistance;
    const portAdmittance = admittance.div(complex(1, 0).add(admittance.mul(complex(p.RS, 0))))
        .add(complex(externalConductance, 0));
    const spars = seriesTwoPortFromImpedance(frequency, portAdmittance.inv(), ro);
    const denominator = seriesImpedance.mul(complex(1 + 2 * ro * externalConductance, 0))
        .add(complex(2 * ro, 0));
    const shotDensity = 2 * ELEMENTARY_CHARGE * Math.abs(point.junctionCurrent);
    const flickerDensity = p.KF && frequency > 0 ? p.KF * Math.abs(point.junctionCurrent) ** p.AF / frequency : 0;
    let noise = (4 * BOLTZMANN * temperature * p.RS +
        (shotDensity + flickerDensity) * junctionImpedance.mag() ** 2) * ro / denominator.mag() ** 2;
    const externalTransfer = complex(1, 0).add(portAdmittance.mul(complex(2 * ro, 0)));
    noise += 4 * BOLTZMANN * temperature * externalConductance * ro / externalTransfer.mag() ** 2;
    return {spars, noise: {frequency, C: [[complex(noise, 0), complex(-noise, 0)],
        [complex(-noise, 0), complex(noise, 0)]]}};
}
