// Modified: 2026-10-16
export const examples = [
  { title: 'Series RC Smith chart', code: `var g = nP.global;\ng.fList = g.fGen(1e6, 10e9, 41);\n\nvar r1 = nP.R(50);\nvar c1 = nP.C(3.17e-12);\nvar seriesRC = nP.nodal(\n  [r1, 1, 2],\n  [c1, 2, 3],\n  ['out', 1, 3]\n);` },
  { title: 'RC low-pass', code: `var g = nP.global;\ng.fList = g.fGen(1e6, 1e9, 51);\n\nvar tee = nP.Tee();\nvar short = nP.Short();\nvar r1 = nP.R(50);\nvar c1 = nP.C(3.17e-12);\nvar lowPass = nP.nodal(\n  [r1, 1, 2],\n  [tee, 4, 2, 3],\n  [c1, 4, 5],\n  [short, 5],\n  ['out', 1, 3]\n);\nnP.log(lowPass.out('s11dB', 's21dB'));` },
  { title: 'RLC ladder', code: `var g = nP.global;\ng.fList = g.fGen(10e6, 2e9, 51);\n\nvar tee = nP.Tee();\nvar short = nP.Short();\nvar ladder = nP.nodal(\n  [nP.L(9.57e-9), 1, 2],\n  [tee, 4, 2, 3],\n  [nP.C(3.17e-12), 4, 5],\n  [short, 5],\n  [nP.L(9.57e-9), 3, 6],\n  ['out', 1, 6]\n);\nnP.log(ladder.out('s11dB', 's21dB'));` },
  { title: 'Three-section stepped line', code: `var g = nP.global;\ng.fList = g.fGen(1e9, 9e9, 41);\n\n// A quarter-wave section at 5 GHz (free-space velocity).\nvar quarterWave = 299792458 / (4 * 5e9);\nvar line50a = nP.Tlin(50, quarterWave);\nvar line70 = nP.Tlin(70, quarterWave);\nvar line50b = nP.Tlin(50, quarterWave);\nvar threeSection = nP.cascade(line50a, line70, line50b);` },
  { title: 'Cascaded lines', code: `var g = nP.global;\ng.fList = g.fGen(1e9, 5e9, 21);\n\nvar line1 = nP.Tlin(50, 0.0127);\nvar line2 = nP.Tlin(60, 0.0254);\nvar network = nP.cascade(line1, line2);\nnP.log(network.out('s11dB', 's21dB'));` },
  { title: 'Tee power divider', code: `var g = nP.global;\ng.fList = g.fGen(1e9, 3e9, 21);\n\nvar tee = nP.Tee();\nvar divider = nP.nodal(\n  [tee, 1, 2, 3],\n  [nP.Tlin(50, 0.0254), 2, 4],\n  [nP.Tlin(50, 0.0254), 3, 5],\n  ['out', 1, 4, 5]\n);\nnP.log(divider.out('s11dB', 's21dB', 's31dB'));` },
  { title: 'Microstrip line', code: `var g = nP.global;\ng.fList = g.fGen(1e9, 10e9, 21);\n\nvar line = nP.mlin({\n  width: 0.5842e-3,\n  height: 0.635e-3,\n  length: 12.7e-3,\n  thickness: 25.4e-6,\n  relativePermittivity: 10,\n  resistivity: 1.72e-8,\n  lossTangent: 0.001,\n  roughnessRms: 0\n});\nnP.log(line.out('s11dB', 's21dB'));` },
  { title: 'Complex arithmetic', code: `var a = nP.complex(3, 4);\nvar b = nP.complex(2, -1);\nnP.log(a.mul(b));\nnP.log(a.div(b));\nnP.log(a.mag());\nnP.log(a.ang());` },
  { title: 'Matrix arithmetic', code: `var m1 = nP.matrix([[1, 2], [3, 4]]);\nvar m2 = nP.matrix([[4, 3], [2, 1]]);\nnP.log(m1.add(m2).m);\nnP.log(m1.mul(m2).m);` },
  { title: 'Line chart', code: `var g = nP.global;\ng.fList = g.fGen(1e9, 5e9, 41);\nvar line1 = nP.Tlin(50, 0.0127);\nvar line2 = nP.Tlin(60, 0.0254);\nvar network = nP.cascade(line1, line2);\nvar table = network.out('s21dB');\nvar mount = document.createElement('div');\ndocument.body.appendChild(mount);\nnP.lineChart({\n  inputTable: [table],\n  mount: mount,\n  title: 'Cascaded transmission',\n  metricPrefix: 'giga',\n  showPoints: false\n});` }
];

function addLineChart(example, networkName, fields, title) {
  example.code += `\n\nvar chartTable = ${networkName}.out(${fields});\nvar chartMount = document.createElement('div');\ndocument.body.appendChild(chartMount);\nnP.lineChart({\n  inputTable: [chartTable],\n  mount: chartMount,\n  title: '${title}',\n  metricPrefix: 'giga',\n  showPoints: false\n});`;
}

function addSmithChart(example, networkName, title) {
  example.code += `\n\nvar smithTable = ${networkName}.out('s11Re', 's11Im');\nvar smithMount = document.createElement('div');\ndocument.body.appendChild(smithMount);\nnP.smithChart({\n  inputTable: [smithTable],\n  mount: smithMount,\n  title: '${title}',\n  metricPrefix: 'giga',\n  margin: { top: 35, right: 35, bottom: 35, left: 35 },\n  showPoints: false\n});`;
}

addSmithChart(examples[0], 'seriesRC', 'Series RC reflection');
examples[0].code = examples[0].code.replace('showPoints: false', 'showPoints: true');
addLineChart(examples[1], 'lowPass', "'s11dB', 's21dB'", 'RC low-pass');
addLineChart(examples[2], 'ladder', "'s11dB', 's21dB'", 'RLC ladder');
addLineChart(examples[3], 'threeSection', "'s11dB', 's21dB'", 'Three-section stepped line');
addLineChart(examples[4], 'network', "'s11dB', 's21dB'", 'Cascaded lines');
addLineChart(examples[5], 'divider', "'s11dB', 's21dB', 's31dB'", 'Tee power divider');
addLineChart(examples[6], 'line', "'s11dB', 's21dB'", 'Microstrip line');

// RF examples use charts/tables as their output; retain nP.log only for
// the two deliberately console-oriented math examples.
examples.forEach((example, index) => {
  if (index !== 7 && index !== 8) {
    example.code = example.code.replace(/\nnP\.log\([^;]+;/g, '');
  }
});
