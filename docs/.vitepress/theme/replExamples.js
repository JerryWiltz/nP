// Modified: 2026-10-19
// Add an example with a unique id, title, category, and code. Array order sets
// sidebar order within a category; stable ids preserve links and browser drafts.
// Sidebar categories and their section order are listed in config.js.
// REPL example authoring rules are in docs/AGENTS.md under "REPL Examples".
export const examples = [
  { id: 'hello-nport', title: 'Hello, nPort!', category: 'getting-started', code: `nP.log('Hello, nPort!');` },
  { id: 'frequency-sweep', title: 'Frequency sweep', category: 'getting-started', code: `nP.global.fList = nP.global.fGen(1e9, 3e9, 5);

var r1 = nP.R(25);

nP.log(r1.out('s11dB', 's21dB'));` },
  { id: 'rc-low-pass', title: 'RC low-pass', category: 'getting-started', code: `var g = nP.global;
g.fList = g.fGen(1e6, 1e9, 51);

var tee = nP.Tee();
var short = nP.Short();
var r1 = nP.R(50);
var c1 = nP.C(3.17e-12);

var lowPass = nP.nodal(
  [r1, 1, 2],
  [tee, 4, 2, 3],
  [c1, 4, 5],
  [short, 5],
  ['out', 1, 3]
);
nP.log(lowPass.out('s11dB', 's21dB'));` },
  { id: 'rlc-ladder', title: 'RLC ladder', category: 'rf-circuits', code: `var g = nP.global;
g.fList = g.fGen(10e6, 2e9, 51);

var tee = nP.Tee();
var short = nP.Short();
var l1 = nP.L(9.57e-9);
var c1 = nP.C(3.17e-12);
var l2 = nP.L(9.57e-9);

var ladder = nP.nodal(
  [l1, 1, 2],
  [tee, 4, 2, 3],
  [c1, 4, 5],
  [short, 5],
  [l2, 3, 6],
  ['out', 1, 6]
);
nP.log(ladder.out('s11dB', 's21dB'));` },
  { id: 'three-section-stepped-line', title: 'Three-section stepped line', category: 'rf-circuits', code: `var g = nP.global;
g.fList = g.fGen(1e9, 9e9, 41);

// A quarter-wave section at 5 GHz (free-space velocity).
var quarterWave = 299792458 / (4 * 5e9);
var line50a = nP.Tlin(50, quarterWave);
var line70 = nP.Tlin(70, quarterWave);
var line50b = nP.Tlin(50, quarterWave);

var threeSection = nP.cascade(line50a, line70, line50b);` },
  { id: 'cascaded-lines', title: 'Cascaded lines', category: 'rf-circuits', code: `var g = nP.global;
g.fList = g.fGen(1e9, 5e9, 21);

var line1 = nP.Tlin(50, 0.0127);
var line2 = nP.Tlin(60, 0.0254);

var network = nP.cascade(line1, line2);
nP.log(network.out('s11dB', 's21dB'));` },
  { id: 'tee-power-divider', title: 'Tee power divider', category: 'rf-circuits', code: `var g = nP.global;
g.fList = g.fGen(1e9, 3e9, 21);

var tee = nP.Tee();
var branch1 = nP.Tlin(50, 0.0254);
var branch2 = nP.Tlin(50, 0.0254);

var divider = nP.nodal(
  [tee, 1, 2, 3],
  [branch1, 2, 4],
  [branch2, 3, 5],
  ['out', 1, 4, 5]
);
nP.log(divider.out('s11dB', 's21dB', 's31dB'));` },
  { id: 'series-stub', title: 'Series branch with seriesTee', category: 'rf-circuits', code: `nP.global.fList = nP.global.fGen(1e9, 3e9, 21);

var line = nP.Tlin(50, 0.0254);
var seriesJunction = nP.seriesTee();
var open = nP.Open();

var network = nP.nodal(
  [seriesJunction, 1, 2, 3],
  [line, 3, 4],
  [open, 4],
  ['out', 1, 2]
);

nP.lineChart({
  inputTable: [network.out('s11dB', 's21dB')],
  title: 'Open series stub'
});` },
  { id: 'coupled-line', title: 'Ideal coupled line', category: 'rf-circuits', code: `nP.global.fList = nP.global.fGen(1e9, 3e9, 21);

var coupler = nP.Tclin(100, 30, 0.0373);

nP.lineChart({
  inputTable: [coupler.out('s21dB', 's41dB')],
  title: 'Through and coupled ports'
});` },
  { id: 'line-chart', title: 'Line chart', category: 'charts-tables', code: `var g = nP.global;
g.fList = g.fGen(1e9, 5e9, 41);

var line1 = nP.Tlin(50, 0.0127);
var line2 = nP.Tlin(60, 0.0254);

var network = nP.cascade(line1, line2);

var table = network.out('s21dB');

nP.lineChart({
  inputTable: [table],
  title: 'Cascaded transmission',
  metricPrefix: 'giga',
  showPoints: false
});` },
  { id: 'series-rc-smith-chart', title: 'Series RC Smith chart', category: 'charts-tables', code: `var g = nP.global;
g.fList = g.fGen(1e6, 10e9, 41);

var r1 = nP.R(50);
var c1 = nP.C(3.17e-12);

var seriesRC = nP.nodal(
  [r1, 1, 2],
  [c1, 2, 3],
  ['out', 1, 3]
);` },
  { id: 'line-table', title: 'Line table', category: 'charts-tables', code: `nP.global.fList = nP.global.fGen(1e9, 3e9, 11);

var line = nP.Tlin(60, 0.0254);

var table = line.out('s11dB', 's21dB');

nP.lineTable({
  inputTable: [table],
  title: 'Transmission line data'
});` },
  { id: 'complex-arithmetic', title: 'Complex arithmetic', category: 'math', code: `var a = nP.complex(3, 4);
var b = nP.complex(2, -1);

nP.log(a.mul(b));

nP.log(a.div(b));

nP.log(a.mag());

nP.log(a.ang());` },
  { id: 'matrix-arithmetic', title: 'Matrix arithmetic', category: 'math', code: `var m1 = nP.matrix([[1, 2], [3, 4]]);
var m2 = nP.matrix([[4, 3], [2, 1]]);

nP.log(m1.add(m2).m);

nP.log(m1.mul(m2).m);` },
  { id: 'fft-round-trip', title: 'FFT and inverse FFT', category: 'math', code: `var samples = [1, 0, -1, 0];
var spectrum = nP.FFT(samples);
var recovered = nP.invFFT(spectrum);

nP.log(spectrum.map(value => value.mag()));

nP.log(recovered.map(value => value.getR()));` },
  { id: 'chebyshev-prototype', title: 'Chebyshev prototype', category: 'filters', code: `var gk = nP.chebyLPgk(3, 0.1);
var values = nP.chebyLPLCs(gk, 200e6, 50);

nP.log('Normalized g values:');

nP.log(gk);

nP.log('Terminations, capacitors, and inductor (SI units):');

nP.log(values);` },
  { id: 'chebyshev-ladder', title: 'Chebyshev filter ladder', category: 'filters', code: `nP.global.fList = nP.global.fGen(10e6, 500e6, 51);

var values = nP.chebyLPLCs(nP.chebyLPgk(3, 0.1), 200e6, 50);

var tee = nP.Tee();
var short = nP.Short();
var c1 = nP.C(values[1]);
var l1 = nP.L(values[2]);
var c2 = nP.C(values[3]);

var filter = nP.nodal(
  [tee, 1, 2, 3],
  [c1, 1, 4],
  [short, 4],
  [l1, 3, 5],
  [tee, 6, 5, 7],
  [c2, 6, 8],
  [short, 8],
  ['out', 2, 7]
);

nP.lineChart({
  inputTable: [filter.out('s11dB', 's21dB')],
  title: 'Chebyshev low-pass'
});` },
  { id: 'lpf-gen', title: 'lpfGen shortcut', category: 'filters', code: `nP.global.fList = nP.global.fGen(10e6, 500e6, 51);

var values = nP.chebyLPLCs(nP.chebyLPgk(3, 0.1), 200e6, 50);

var filter = nP.lpfGen(values.slice()); // lpfGen consumes its input array.

nP.lineChart({
  inputTable: [filter.out('s11dB', 's21dB')],
  title: 'lpfGen response'
});` },
  { id: 'microstrip-line', title: 'Microstrip line', category: 'microstrip', code: `var g = nP.global;
g.fList = g.fGen(1e9, 10e9, 21);

var line = nP.mlin({
  width: 0.5842e-3,
  height: 0.635e-3,
  length: 12.7e-3,
  thickness: 25.4e-6,
  relativePermittivity: 10,
  resistivity: 1.72e-8,
  lossTangent: 0.001,
  roughnessRms: 0
});
nP.log(line.out('s11dB', 's21dB'));` },
  { id: 'microstrip-coupler', title: 'Microstrip coupled line', category: 'microstrip', code: `nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var coupler = nP.mclin();

nP.lineChart({
  inputTable: [coupler.out('s21dB', 's41dB')],
  title: 'Microstrip coupled line'
});` },
  { id: 'microstrip-tee', title: 'Microstrip Tee', category: 'microstrip', code: `nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var tee = nP.mtee();

nP.lineChart({
  inputTable: [tee.out('s21dB', 's31dB')],
  title: 'Microstrip Tee branches'
});` },
  { id: 'microstrip-layout', title: 'Step, bend, and via', category: 'microstrip', code: `nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var step = nP.mstep();
var bend = nP.mbend();
var via = nP.mvia();

var path = nP.cascade(step, bend, via);

nP.lineChart({
  inputTable: [path.out('s11dB', 's21dB')],
  title: 'Microstrip layout path'
});` },
  { id: 'microstrip-film-resistor', title: 'Thin-film resistor', category: 'microstrip', code: `nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var resistor = nP.mtfr({
  ohmsPerSquare: 50,
  width: 0.25e-3,
  length: 0.5e-3,
  sections: 3
});

nP.log('DC resistance: ' + resistor.filmResistor.resistance.toFixed(1) + ' ohms');

nP.lineChart({
  inputTable: [resistor.out('s11dB', 's21dB')],
  title: 'Thin-film resistor'
});` },
  { id: 'amplifier-noise', title: 'Amplifier noise figure', category: 'noise', code: `nP.global.fList = nP.global.fGen(1e9, 2e9, 11);
nP.global.Temp = 290;

var amp = nP.Amp(20, 4);
var attenuator = nP.Attn(3);

var chain = nP.nodal(
  [amp, 1, 2],
  [attenuator, 2, 3],
  ['out', 1, 3]
);

nP.lineTable({
  inputTable: [chain.out('s21dB', 'NF21dB', 'noiseFloor')],
  title: 'Gain and noise'
});` },
  { id: 'noise-order', title: 'Amplifier versus attenuator order', category: 'noise', code: `nP.global.fList = [1e9];

var amp = nP.Amp(20, 4);
var attenuator = nP.Attn(3);

var ampFirst = nP.cascade(amp, attenuator);
var attenuatorFirst = nP.cascade(attenuator, amp);

nP.log('Amplifier first:');
nP.log(ampFirst.out('s21dB', 'NF21dB'));

nP.log('Attenuator first:');
nP.log(attenuatorFirst.out('s21dB', 'NF21dB'));` },
  { id: 'two-tone-ip3', title: 'Two-tone IM3 and OIP3', category: 'intermodulation', code: `nP.global.fList = nP.global.fGen(1e9, 1.1e9, 5);
nP.global.twoTone = {
  spacingHz: 1e6,
  p1dBm: -30,
  p2dBm: -30
};

var amp = nP.Amp({
  gainDb: 20,
  oip3dBm: 30
});
var attenuator = nP.Attn(3);

var chain = nP.nodal(
  [amp, 1, 2],
  [attenuator, 2, 3],
  ['out', 1, 3]
);

nP.lineTable({
  inputTable: [chain.out('IM3lower21dBm', 'OIP3lower21dBm')],
  title: 'Two-tone products'
});` },
  { id: 'diode-dc-rf', title: '1N4148 DC and RF', category: 'nonlinear', code: `nP.global.fList = nP.global.fGen(1e6, 1e9, 21);

var diode = nP.diode1N4148({
  biasVoltage: 0.5
});

nP.log(diode.out('s11dB', 's21dB'));

nP.lineChart({
  inputTable: [diode.ivTable(0, 0.9, 41)],
  title: '1N4148 I-V curve',
  xAxisTitle: 'Voltage (V)',
  yAxisTitle: 'Current (A)',
  metricPrefix: 'none'
});` },
  { id: 'am-envelope', title: 'AM sidebands and envelope', category: 'analog-modulation', code: `var tx = nP.mod({
  mode: 'AM',
  carrierHz: 200e6,
  toneHz: 300,
  modulationIndex: 0.5
});

var attenuator = nP.Attn(3);

var chain = nP.cascade(attenuator, {
  signal: tx
});

var rx = nP.demod(chain, {
  noise: false
});

nP.log(tx.out('tones'));
nP.lineChart({
  inputTable: [rx.out('envelope')],
  title: 'AM envelope',
  xAxisTitle: 'Time (ms)',
  yAxisTitle: 'V',
  metricPrefix: 'milli'
});` },
  { id: 'fm-pm-sidebands', title: 'FM and PM sidebands', category: 'analog-modulation', code: `var fm = nP.mod({
  mode: 'FM',
  carrierHz: 200e6,
  toneHz: 300,
  beta: 1
});

var pm = nP.mod({
  mode: 'PM',
  carrierHz: 200e6,
  toneHz: 300,
  beta: 1
});

nP.log('FM tones:');
nP.log(fm.out('tones'));

nP.log('PM tones:');
nP.log(pm.out('tones'));` },
  { id: 'ssb-dsb-sidebands', title: 'SSB versus DSB-SC', category: 'analog-modulation', code: `var ssb = nP.mod({
  mode: 'SSB',
  sideband: 'USB',
  carrierHz: 200e6,
  toneHz: 300
});

var dsb = nP.mod({
  mode: 'DSB-SC',
  carrierHz: 200e6,
  toneHz: 300
});

nP.log('SSB occupied tones:');
nP.log(ssb.out('tones'));

nP.log('DSB-SC occupied tones:');
nP.log(dsb.out('tones'));` },
  { id: 'ascii-through-circuit', title: 'ASCII through a circuit', category: 'digital-signals', code: `var context = nP.global();
context.fList = [];

var tx = nP.mod({
  mode: 'ASCII',
  message: 'hello'
});

var attenuator = nP.Attn(3);

var chain = nP.cascade(attenuator, {
  signal: tx
});

var rx = nP.demod(chain, {
  noise: false
});

nP.log('Received: ' + rx.out('ASCII text'));

nP.lineChart({
  inputTable: [rx.out('waveform')],
  title: 'Received waveform',
  xAxisTitle: 'Time (ns)',
  yAxisTitle: 'V',
  metricPrefix: 'none'
});` },
  { id: 'pn7-waveform', title: 'PN7 clocked waveform', category: 'digital-signals', code: `var context = nP.global();
context.tList = context.tGen(0, 126e-9, 127);

var pn = nP.PN({
  stages: 7,
  time: context.tList
});

nP.log('First 16 bits: ' + pn.out('bits').slice(0, 16).join(''));

nP.lineChart({
  inputTable: [pn.out('waveform')],
  title: 'PN7 waveform',
  xAxisTitle: 'Time (ns)',
  yAxisTitle: 'V',
  metricPrefix: 'none'
});` },
  { id: 'psk-receiver', title: 'PSK receiver', category: 'digital-signals', code: `var tx = nP.mod({
  mode: 'PSK',
  carrierHz: 200e6,
  bitRate: 10e6,
  samplesPerBit: 64,
  bits: '01011010'
});

var attenuator = nP.Attn(3, 0);

var chain = nP.cascade(attenuator, {
  signal: tx
});

var rx = nP.demod(chain, {
  noise: false
});

nP.log('Sent: ' + tx.bits.join(''));

nP.log('Received: ' + rx.out('bits').join(''));` },
  { id: 'ber-attenuation', title: 'BER through an attenuator', category: 'digital-signals', code: `var tx = nP.mod({
  mode: 'ASCII',
  message: 'Hi',
  bitRate: 1e9,
  samplesPerBit: 8,
  highVolts: 1e-3
});

var attenuator = nP.Attn(17.6, 290);

var chain = nP.cascade(attenuator, {
  signal: tx
});

var ber = nP.bitErrorRate(tx, chain, {
  receptions: 50
});

nP.log('Measured BER: ' + ber.toExponential(2));` },
  { id: 'qam-ofdm', title: 'QAM and OFDM reception', category: 'digital-signals', code: `var qam = nP.mod({
  mode: 'QAM',
  order: 16,
  carrierHz: 200e6,
  bitRate: 10e6,
  samplesPerBit: 64,
  bits: '1010011010110010'
});

var qamThru = nP.Thru();
var qamChain = nP.cascade(qamThru, {
  signal: qam
});
var qamRx = nP.demod(qamChain, {
  noise: false
});

nP.log('QAM bits: ' + qamRx.out('bits').join(''));

var ofdm = nP.mod({
  mode: 'OFDM',
  carrierHz: 200e6,
  subcarrierCount: 8,
  fftSize: 128,
  symbolRate: 5e6,
  bits: '1010011010110010'
});

var ofdmThru = nP.Thru();
var ofdmChain = nP.cascade(ofdmThru, {
  signal: ofdm
});
var ofdmRx = nP.demod(ofdmChain, {
  noise: false
});

nP.log('OFDM bits: ' + ofdmRx.out('bits').join(''));` },
];

function addLineChart(example, networkName, fields, title) {
  example.code = example.code.replace(/\nnP\.log\([^;]+;/g, '');
  example.code += `\n\nvar chartTable = ${networkName}.out(${fields});\n\nnP.lineChart({\n  inputTable: [chartTable],\n  title: '${title}',\n  metricPrefix: 'giga',\n  showPoints: false\n});`;
}

function addSmithChart(example, networkName, title) {
  example.code += `\n\nvar smithTable = ${networkName}.out('s11Re', 's11Im');\n\nnP.smithChart({\n  inputTable: [smithTable],\n  title: '${title}',\n  metricPrefix: 'giga',\n  margin: {\n    top: 35,\n    right: 35,\n    bottom: 35,\n    left: 35\n  },\n  showPoints: false\n});`;
}

const exampleById = Object.fromEntries(examples.map(example => [example.id, example]));

addSmithChart(exampleById['series-rc-smith-chart'], 'seriesRC', 'Series RC reflection');
exampleById['series-rc-smith-chart'].code = exampleById['series-rc-smith-chart'].code.replace('showPoints: false', 'showPoints: true');
addLineChart(exampleById['rc-low-pass'], 'lowPass', "'s11dB', 's21dB'", 'RC low-pass');
addLineChart(exampleById['rlc-ladder'], 'ladder', "'s11dB', 's21dB'", 'RLC ladder');
addLineChart(exampleById['three-section-stepped-line'], 'threeSection', "'s11dB', 's21dB'", 'Three-section stepped line');
addLineChart(exampleById['cascaded-lines'], 'network', "'s11dB', 's21dB'", 'Cascaded lines');
addLineChart(exampleById['tee-power-divider'], 'divider', "'s11dB', 's21dB', 's31dB'", 'Tee power divider');
addLineChart(exampleById['microstrip-line'], 'line', "'s11dB', 's21dB'", 'Microstrip line');
