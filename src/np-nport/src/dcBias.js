// Modified: 2026-11-17
import {solveDC} from './dcSolver';
import {connectionOperatingPoints} from './operatingPointHandoff';

function capabilities(model) {
    if (model.kind === 'connection') return model.definition.components.reduce((result, child) => {
        const next = capabilities(child.model);
        return {source: result.source || next.source, nonlinear: result.nonlinear || next.nonlinear};
    }, {source: false, nonlinear: false});
    return {source: model.definition.modelId === 'voltage-source', nonlinear: model.kind === 'nonlinear'};
}

// An explicit DC supply selects externally determined network bias. Ordinary
// fixed-Q RF networks without a supply retain their existing composition path.
export function prepareDcBias(model, components) {
    const available = capabilities(model);
    if (!available.source || !available.nonlinear) return null;
    const operatingPoint = solveDC(model);
    return {operatingPoint, components: connectionOperatingPoints(model, components, operatingPoint.operatingPoints)};
}

export function retainDcBias(network, prepared) {
    if (prepared) {
        network.operatingPoint = prepared.operatingPoint;
        network._operatingPoints = prepared.operatingPoint.operatingPoints;
    }
    return network;
}
