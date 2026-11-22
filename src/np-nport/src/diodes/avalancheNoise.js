// Modified: 2026-11-22
import {complex} from '../../../np-math/src/complex';
import {BOLTZMANN, ELEMENTARY_CHARGE} from '../physicalConstants';

function sinc(value) {
    // Analytic series avoids cancellation of 1-sinc(theta) at small angles.
    if (Math.abs(value) < 1e-3) return 1 - value ** 2 / 6 + value ** 4 / 120 - value ** 6 / 5040;
    return Math.sin(value) / value;
}
function oneMinusSinc(value) {
    if (Math.abs(value) < 1e-3) return value ** 2 / 6 - value ** 4 / 120 + value ** 6 / 5040;
    return 1 - sinc(value);
}

export function avalancheNoisePoint(record, frequency) {
    const p = record.parameters, fit = record.noiseFit;
    if (!Number.isFinite(frequency) || frequency < fit.minFrequency || frequency > fit.maxFrequency) {
        throw new RangeError('NoiseDiode frequency is outside the characterized noiseFit interval; supply a fit covering every analysis frequency.');
    }
    const omega = 2 * Math.PI * frequency, ratio = frequency / p.avalancheFrequency, theta = omega * p.transitTime;
    const a = p.driftResistance * sinc(theta / 2) ** 2;
    const b = (oneMinusSinc(theta) - ratio ** 2 * (1 + p.avalancheLengthRatio)) / (omega * p.driftCapacitance);
    // Zd=(a-jb)/(1-ratio²), Za=-jb/(1-ratio²). Cancel the
    // common pole before evaluating Zi and the avalanche transfer at fa.
    const numerator = complex(a, -b);
    const denominator = numerator.add(complex((1 - ratio ** 2) * p.depletionResistance, 0));
    const intrinsic = numerator.mul(complex(p.depletionResistance, 0)).div(denominator);
    const sourceTransfer = complex(0, -b * p.depletionResistance).div(denominator);
    const contact = intrinsic.add(complex(p.seriesResistance, 0));
    const packageFactor = complex(1, 0).add(contact.mul(complex(0, omega * p.packageCapacitance)));
    const impedance = contact.div(packageFactor).add(complex(0, omega * p.leadInductance));
    const [c0, c1, c2] = fit.coefficientsDb;
    const multiplierDb = c0 + c1 * Math.log(frequency / fit.referenceFrequency) +
        c2 * Math.max(Math.log(frequency / fit.kneeFrequency), 0) ** 2;
    const multiplierSquared = 10 ** (multiplierDb / 10);
    const avalancheCurrentDensity = 2 * ELEMENTARY_CHARGE * p.biasCurrent * multiplierSquared;
    const voltageDensity = (avalancheCurrentDensity * sourceTransfer.mag() ** 2 +
        4 * BOLTZMANN * record.referenceTemperature * p.seriesResistance) / packageFactor.mag() ** 2;
    if (!(impedance.x > 0) || ![impedance.x, impedance.y, multiplierSquared, voltageDensity].every(Number.isFinite) ||
        multiplierSquared <= 0 || voltageDensity < 0) {
        throw new RangeError('NoiseDiode fit produces nonfinite noise or nonpositive terminal resistance in the requested band.');
    }
    return {impedance, multiplierSquared, avalancheCurrentDensity, voltageDensity,
        noiseTemperature: voltageDensity / (4 * BOLTZMANN * impedance.x)};
}
