// Modified: 2026-11-21
import {complex} from '../../../np-math/src/complex';

export function diodeTerminalCapacitance(point, seriesResistance, packageParameters) {
    const contact = 1 + seriesResistance * point.conductance;
    const conductance = point.conductance / contact;
    // lim Im(Yport)/omega includes contact voltage division and the lead
    // contribution when appreciable DC conductance flows through it.
    return point.totalCapacitance / contact ** 2 + packageParameters.parallelCapacitance -
        packageParameters.seriesInductance * conductance ** 2;
}

// Floating two-terminal package: L in series with [CP || (RS + junction)].
// Leakage remains across the public terminals. The same transfer factors
// propagate RF, internal noise and nonlinear sources at each frequency.
export function diodeLinearResponse(model, frequency) {
    const omega = 2 * Math.PI * frequency, pkg = model.packageParameters;
    const junction = complex(model.conductance, omega * model.capacitance);
    const contact = complex(1, 0).add(junction.mul(complex(model.seriesResistance, 0)));
    const middle = junction.div(contact).add(complex(0, omega * (pkg?.parallelCapacitance ?? 0)));
    const lead = complex(1, 0).add(middle.mul(complex(0, omega * (pkg?.seriesInductance ?? 0))));
    const port = middle.div(lead).add(complex(model.externalConductance, 0));
    const junctionFactor = contact.mul(lead);
    const productDenominator = junctionFactor.mul(complex(1 + 2 * model.referenceImpedance * model.externalConductance, 0))
        .add(contact.mul(middle).mul(complex(2 * model.referenceImpedance, 0)));
    return {junction, port, junctionFactor, productDenominator};
}
