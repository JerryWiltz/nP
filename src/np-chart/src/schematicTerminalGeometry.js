// Modified: 2026-11-22
// A continuous canonical lead can serve both endpoint terminals.
export function terminalLeadPoint(symbol, portNumber) {
    const terminal = symbol.ports[portNumber - 1];
    const same = point => point?.every((value, axis) => value === terminal[axis]);
    for (const lead of symbol.leads || []) {
        if (same(lead[0])) return lead.find(point => !same(point));
        if (same(lead.at(-1))) return lead.slice().reverse().find(point => !same(point));
    }
    return undefined;
}
