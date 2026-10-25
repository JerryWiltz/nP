// Modified: 2026-10-25
'use strict';

function key(point) {
  return `${point[0]},${point[1]}`;
}

function connect(graph, first, second) {
  if (!graph.has(first)) graph.set(first, new Set());
  if (!graph.has(second)) graph.set(second, new Set());
  graph.get(first).add(second);
  graph.get(second).add(first);
}

function validateRfConnectivity(circuit, fail) {
  const nodes = new Map();
  for (const component of circuit.components) {
    for (const connection of component.connections) {
      const points = nodes.get(connection.node) || [];
      points.push(connection.at);
      nodes.set(connection.node, points);
    }
  }
  for (const [index, terminal] of (circuit.terminals || []).entries()) {
    if (!Number.isInteger(terminal.node) || !nodes.has(terminal.node)) {
      fail(`RF terminal ${index + 1} needs a known node`);
    }
    nodes.get(terminal.node).push(terminal.at);
  }

  const occupied = new Map();
  for (const [node, endpoints] of nodes) {
    for (const point of endpoints) {
      const prior = occupied.get(key(point));
      if (prior !== undefined && prior !== node) {
        fail(`RF nodes ${prior} and ${node} share terminal coordinate ${key(point)}`);
      }
      occupied.set(key(point), node);
    }
  }

  const graphs = new Map([...nodes.keys()].map(node => [node, new Map()]));
  for (const [index, wire] of (circuit.wires || []).entries()) {
    if (!Number.isInteger(wire.node) || !nodes.has(wire.node)) {
      fail(`RF wire ${index + 1} needs a known node`);
    }
    const graph = graphs.get(wire.node);
    for (let pointIndex = 1; pointIndex < wire.points.length; pointIndex += 1) {
      const start = wire.points[pointIndex - 1];
      const end = wire.points[pointIndex];
      const dx = Math.sign(end[0] - start[0]) * 20;
      const dy = Math.sign(end[1] - start[1]) * 20;
      const steps = (Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1])) / 20;
      if (!steps) fail(`RF wire ${index + 1} has a zero-length segment`);
      for (let step = 0; step < steps; step += 1) {
        const first = [start[0] + dx * step, start[1] + dy * step];
        const second = [first[0] + dx, first[1] + dy];
        connect(graph, key(first), key(second));
      }
    }
  }

  for (const [node, endpoints] of nodes) {
    const graph = graphs.get(node);
    for (const point of graph.keys()) {
      const prior = occupied.get(point);
      if (prior !== undefined && prior !== node) {
        fail(`RF node ${node} wire crosses node ${prior} terminal at ${point}`);
      }
    }
    const required = new Set(endpoints.map(key));
    if (required.size > 1 && !graph.size) fail(`RF node ${node} has no wire between its ports`);
    for (const point of required) {
      if (graph.size && !graph.has(point)) fail(`RF node ${node} does not reach ${point}`);
    }
    if (!graph.size) continue;
    const [first] = graph.keys();
    const visited = new Set([first]);
    const pending = [first];
    while (pending.length) {
      for (const neighbor of graph.get(pending.pop())) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          pending.push(neighbor);
        }
      }
    }
    if (visited.size !== graph.size) fail(`RF node ${node} has disconnected wires`);
    for (const [point, neighbors] of graph) {
      if (neighbors.size === 1 && !required.has(point)) {
        fail(`RF node ${node} has a dangling wire at ${point}`);
      }
    }
  }
}

module.exports = {validateRfConnectivity};
