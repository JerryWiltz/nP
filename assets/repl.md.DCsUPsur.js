import{p as U,v as Q,a1 as W,g as V,x as K,o as N,c as q,j as i,a as B,G as X}from"./chunks/framework.D0vMsDwd.js";const Y=[{id:"frequency-sweep",title:"Frequency sweep",category:"getting-started",code:`// Frequency sweep

nP.global.fList = nP.global.fGen(1e9, 3e9, 5);

var r1 = nP.R(25);

var response = r1.out('s11dB', 's21dB');

nP.log(response);

nP.schematic(r1);`},{id:"rc-low-pass",title:"RC low-pass",category:"getting-started",code:`// RC low-pass

var g = nP.global;
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

var chartTable = lowPass.out('s11dB', 's21dB');

nP.lineChart({
  inputTable: [chartTable],
  title: 'RC low-pass',
  metricPrefix: 'giga',
  showPoints: false
});

nP.schematic(lowPass);`},{id:"rlc-ladder",title:"RLC ladder",category:"rf-circuits",code:`// RLC ladder

var g = nP.global;
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

var chartTable = ladder.out('s11dB', 's21dB');

nP.lineChart({
  inputTable: [chartTable],
  title: 'RLC ladder',
  metricPrefix: 'giga',
  showPoints: false
});

nP.schematic(ladder);`},{id:"method-chaining-nport",title:"Method chaining in nPort",category:"rf-circuits",code:`// Method chaining in nPort

nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var line1 = nP.Tlin(50, 0.01);
var attenuator1 = nP.Attn(3);
var line2 = nP.Tlin(60, 0.02);
var attenuator2 = nP.Attn(6);
var line3 = nP.Tlin(50, 0.01);

var chain = line1
  .cas(attenuator1)
  .cas(line2)
  .cas(attenuator2)
  .cas(line3);

var response = chain.out('s11dB', 's21dB');

nP.lineChart({
  inputTable: [response],
  title: 'Five cascaded two-ports',
  metricPrefix: 'giga',
  showPoints: false
});

nP.schematic(chain);`},{id:"vna-port1",title:"VNA inductor S-parameters",category:"rf-circuits",code:`// VNA inductor S-parameters

var g = nP.global;
g.fList = g.fGen(1e9, 3e9, 101);

var tx = nP.mod({
  mode: 'VNA-frequency',
  fList: g.fList
});

var splitter = nP.Coupler180();
var inputCoupler = nP.Coupler180();
var outputCoupler = nP.Coupler180();
var l1 = nP.L(5e-9);
var load = nP.Load();

var circuit = nP.nodal(
  [splitter, 1, 2, 3, 4],
  [inputCoupler, 2, 5, 6, 7],
  [l1, 5, 8],
  [outputCoupler, 8, 9, 10, 11],
  [load, 3],
  [load, 7],
  [load, 9],
  [load, 10],
  ['out', 1, 4, 6, 11],
  {signal: tx, inputPort: 1}
);

var referenceRx = nP.demod(circuit, {
  outputPort: 2,
  referenceGain: 1,
  noise: false
});
var reflectionRx = nP.demod(circuit, {
  outputPort: 3,
  referenceReceiver: referenceRx,
  referenceGain: 2,
  noise: false
});
var transmissionRx = nP.demod(circuit, {
  outputPort: 4,
  referenceReceiver: referenceRx,
  referenceGain: 2,
  noise: false
});
var referenceTable = referenceRx.out('response magnitude');
var s11Table = reflectionRx.out('response dB');
var s21Table = transmissionRx.out('response dB');
var directTable = l1.out('s11dB', 's21dB');

nP.lineChart({
  inputTable: [s11Table],
  title: 'Measured inductor S11',
  xAxisTitle: 'Frequency (GHz)',
  yAxisTitle: 'S11 (dB)',
  metricPrefix: 'giga',
  showPoints: false
});

nP.lineChart({
  inputTable: [s21Table],
  title: 'Measured inductor S21',
  xAxisTitle: 'Frequency (GHz)',
  yAxisTitle: 'S21 (dB)',
  metricPrefix: 'giga',
  showPoints: false
});

nP.lineTable({
  inputTable: directTable,
  title: 'Direct L(5 nH) S-parameters'
});

nP.lineTable({
  inputTable: referenceTable,
  title: 'VNA reference receiver R'
});

nP.schematic(circuit);`},{id:"vna-inductor-time",title:"VNA inductor impulse response",category:"rf-circuits",code:`// VNA inductor impulse response

var g = nP.global();
// 4096 samples at 16 GHz are 62.5 ps apart: 0 to 255.9375 ns.
// VNA-time makes 2049 bins from DC to 8 GHz, spaced 3.90625 MHz.
// The 8 GHz Nyquist bin is zero so demod can make a real waveform.
g.tList = g.tGen(0, 4095 / 16e9, 4096);
g.fList = [];

var tx = nP.mod({
  mode: 'VNA-time'
});

var splitter = nP.Coupler180();
var inputCoupler = nP.Coupler180();
var outputCoupler = nP.Coupler180();
var l1 = nP.L(5e-9);
var load = nP.Load();

var circuit = nP.nodal(
  [splitter, 1, 2, 3, 4],
  [inputCoupler, 2, 5, 6, 7],
  [l1, 5, 8],
  [outputCoupler, 8, 9, 10, 11],
  [load, 3],
  [load, 7],
  [load, 9],
  [load, 10],
  ['out', 1, 4, 6, 11],
  {signal: tx, inputPort: 1}
);

var referenceRx = nP.demod(circuit, {
  outputPort: 2,
  referenceGain: 1,
  noise: false
});
var reflectionRx = nP.demod(circuit, {
  outputPort: 3,
  referenceReceiver: referenceRx,
  referenceGain: 2,
  noise: false
});
var transmissionRx = nP.demod(circuit, {
  outputPort: 4,
  referenceReceiver: referenceRx,
  referenceGain: 2,
  noise: false
});
// R is the source reference after the ideal splitter, in volts.
// A divided by R is the inductor's normalized S11 impulse response.
// B divided by R is its normalized S21 impulse response.
// The gain of 2 on A and B removes the ideal couplers' voltage split.
var referenceTable = referenceRx.out('waveform');
var reflectionTable = reflectionRx.out('waveform');
var transmissionTable = transmissionRx.out('waveform');
// Leave display space before and after the 256 ns periodic record.
var timePlotRangeNs = [-10, 266];

nP.lineChart({
  inputTable: [referenceTable],
  title: 'VNA reference receiver R',
  xAxisTitle: 'Time (ns)',
  xAxisPosition: 'origin',
  xRange: timePlotRangeNs,
  yAxisTitle: 'Receiver voltage (V)',
  metricPrefix: 'none',
  showPoints: false,
  showLabels: false
});

nP.lineChart({
  inputTable: [reflectionTable],
  title: 'Inductor reflection impulse response',
  xAxisTitle: 'Time (ns)',
  xAxisPosition: 'origin',
  xRange: timePlotRangeNs,
  yAxisTitle: 'Normalized reflection',
  metricPrefix: 'none',
  showPoints: false,
  showLabels: false
});

nP.lineChart({
  inputTable: [transmissionTable],
  title: 'Inductor transmission impulse response',
  xAxisTitle: 'Time (ns)',
  xAxisPosition: 'origin',
  xRange: timePlotRangeNs,
  yAxisTitle: 'Normalized transmission',
  metricPrefix: 'none',
  showPoints: false,
  showLabels: false
});

nP.schematic(circuit);`},{id:"vna-short-reflection",title:"VNA cable fault location",category:"rf-circuits",code:`// VNA cable fault location

var g = nP.global();
// Start at 0 s and sample at 250 MHz, giving 4 ns between points.
// Use 4096 points (2^12) for the VNA-time inverse FFT.
// The last point is sample 4095; dividing by 250 MHz gives its time in seconds.
g.tList = g.tGen(0, 4095 / 250e6, 4096);
g.fList = [];

var tx = nP.mod({
  mode: 'VNA-time'
});

// VNA fixture: splitter feeds R; input coupler samples the return at A.
// The output coupler and receiver B are dormant for this one-port DUT.
var splitter = nP.Coupler180();
var inputCoupler = nP.Coupler180();
var lineLengthMeters = 1000;
var line = nP.Tlin(50, lineLengthMeters);
var short = nP.Short();
var open = nP.Open();
var load = nP.Load();

var shortCircuit = nP.nodal(
  [splitter, 1, 2, 3, 4],
  [inputCoupler, 2, 5, 6, 7],
  [line, 5, 8],
  [short, 8],
  [load, 3],
  [load, 7],
  ['out', 1, 4, 6],
  {signal: tx, inputPort: 1}
);

var openCircuit = nP.nodal(
  [splitter, 1, 2, 3, 4],
  [inputCoupler, 2, 5, 6, 7],
  [line, 5, 8],
  [open, 8],
  [load, 3],
  [load, 7],
  ['out', 1, 4, 6],
  {signal: tx, inputPort: 1}
);

var referenceRx = nP.demod(shortCircuit, {
  outputPort: 2,
  referenceGain: 1,
  noise: false
});
var shortRx = nP.demod(shortCircuit, {
  outputPort: 3,
  referenceReceiver: referenceRx,
  referenceGain: 2,
  noise: false
});
var openRx = nP.demod(openCircuit, {
  outputPort: 3,
  referenceReceiver: referenceRx,
  referenceGain: 2,
  noise: false
});
var referenceTable = referenceRx.out('waveform');
var shortReturn = shortRx.out('waveform');
var openReturn = openRx.out('waveform');
// Leave display space before and after the 16,384 ns periodic record.
var timePlotRangeNs = [-500, 16884];

// Find the largest return in each measured waveform, independently.
var shortPeak = shortReturn[1];
var openPeak = openReturn[1];
for (var index = 2; index < shortReturn.length; index++) {
  if (Math.abs(shortReturn[index][1]) > Math.abs(shortPeak[1])) {
    shortPeak = shortReturn[index];
  }
  if (Math.abs(openReturn[index][1]) > Math.abs(openPeak[1])) {
    openPeak = openReturn[index];
  }
}

// A fault 1 km away gives a 2 km round trip at the modeled speed of light.
var speedOfLightMetersPerSecond = 299792458;
var expectedRoundTripNs = 2 * lineLengthMeters /
  speedOfLightMetersPerSecond * 1e9;
var transitTable = [
  ['Fault', 'Predicted (ns)', 'Measured (ns)', 'Inferred distance (m)'],
  ['Short', expectedRoundTripNs, shortPeak[0],
    shortPeak[0] * 1e-9 * speedOfLightMetersPerSecond / 2],
  ['Open', expectedRoundTripNs, openPeak[0],
    openPeak[0] * 1e-9 * speedOfLightMetersPerSecond / 2]
];

nP.lineChart({
  inputTable: [referenceTable],
  title: 'VNA reference receiver R',
  xAxisTitle: 'Time (ns)',
  xAxisPosition: 'origin',
  xRange: timePlotRangeNs,
  yAxisTitle: 'Receiver voltage (V)',
  metricPrefix: 'none',
  showPoints: false,
  showLabels: false
});

nP.lineChart({
  inputTable: [shortReturn],
  title: 'Short fault at 1 km: receiver A / R',
  xAxisTitle: 'Time (ns)',
  xAxisPosition: 'origin',
  xRange: timePlotRangeNs,
  yAxisTitle: 'Normalized reflection',
  metricPrefix: 'none',
  showPoints: false,
  showLabels: false
});

nP.lineChart({
  inputTable: [openReturn],
  title: 'Open fault at 1 km: receiver A / R',
  xAxisTitle: 'Time (ns)',
  xAxisPosition: 'origin',
  xRange: timePlotRangeNs,
  yAxisTitle: 'Normalized reflection',
  metricPrefix: 'none',
  showPoints: false,
  showLabels: false
});

nP.lineTable({
  inputTable: transitTable,
  title: 'Speed-of-light transit check: 2 km round trip',
  metricPrefix: 'none'
});

nP.schematic(shortCircuit);
nP.schematic(openCircuit);`},{id:"tee-power-divider",title:"Tee power divider",category:"rf-circuits",code:`// Tee power divider

var g = nP.global;
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

var chartTable = divider.out('s11dB', 's21dB', 's31dB');

nP.lineChart({
  inputTable: [chartTable],
  title: 'Tee power divider',
  metricPrefix: 'giga',
  showPoints: false
});

nP.schematic(divider);`},{id:"series-stub",title:"Series branch with seriesTee",category:"rf-circuits",code:`// Series branch with seriesTee

nP.global.fList = nP.global.fGen(1e9, 3e9, 21);

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
});

nP.schematic(network);`},{id:"coupled-line",title:"Ideal coupled line",category:"rf-circuits",code:`// Ideal coupled line

nP.global.fList = nP.global.fGen(1e9, 3e9, 21);

var coupler = nP.Tclin(100, 30, 0.0373);

nP.lineChart({
  inputTable: [coupler.out('s21dB', 's41dB')],
  title: 'Through and coupled ports'
});

nP.schematic(coupler);`},{id:"line-chart",title:"Line chart",category:"charts-tables",code:`// Line chart

var g = nP.global;
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
});

nP.schematic(network);`},{id:"series-rc-smith-chart",title:"Series RC Smith chart",category:"charts-tables",code:`// Series RC Smith chart

var g = nP.global;
g.fList = g.fGen(1e6, 10e9, 41);

var r1 = nP.R(50);
var c1 = nP.C(3.17e-12);

var seriesRC = nP.nodal(
  [r1, 1, 2],
  [c1, 2, 3],
  ['out', 1, 3]
);

var smithTable = seriesRC.out('s11Re', 's11Im');

nP.smithChart({
  inputTable: [smithTable],
  title: 'Series RC reflection',
  metricPrefix: 'giga',
  margin: {
    top: 35,
    right: 35,
    bottom: 35,
    left: 35
  },
  showPoints: true
});

nP.schematic(seriesRC);`},{id:"line-table",title:"Line table",category:"charts-tables",code:`// Line table

nP.global.fList = nP.global.fGen(1e9, 3e9, 11);

var line = nP.Tlin(60, 0.0254);

var table = line.out('s11dB', 's21dB');

nP.lineTable({
  inputTable: [table],
  title: 'Transmission line data'
});

nP.schematic(line);`},{id:"complex-arithmetic",title:"Complex arithmetic",category:"math",code:`// Complex arithmetic

var a = nP.complex(3, 4);
var b = nP.complex(2, -1);

var product = a.mul(b);
var quotient = a.div(b);
var magnitude = a.mag();
var angle = a.ang();

nP.log(product);

nP.log(quotient);

nP.log(magnitude);

nP.log(angle);`},{id:"matrix-arithmetic",title:"Matrix arithmetic",category:"math",code:`// Matrix arithmetic

var m1 = nP.matrix([[1, 2], [3, 4]]);
var m2 = nP.matrix([[4, 3], [2, 1]]);

var sum = m1.add(m2).m;
var product = m1.mul(m2).m;

nP.log(sum);

nP.log(product);`},{id:"math-method-chaining",title:"Method chaining with math objects",category:"math",code:`// Method chaining with math objects

var aRows = nP.dim(10, 10, nP.complex(0, 0));
var bRows = nP.dim(10, 10, nP.complex(0, 0));

for (var row = 0; row < 10; row++) {
  aRows[row][row] = nP.complex(12 + row, 1);
  bRows[row][row] = nP.complex(3, -0.5);
  if (row < 9) {
    aRows[row][row + 1] = nP.complex(-1, 0.25);
    aRows[row + 1][row] = nP.complex(-1, 0.25);
  }
}

var matrixA = nP.matrix(aRows);
var matrixB = nP.matrix(bRows);

var inverseSum = matrixA.addCplx(matrixB).invertCplx();
var identityCheck = matrixA.addCplx(matrixB).mulCplx(inverseSum);

nP.log('Inverse of the 10 by 10 complex matrix sum:');
nP.log(inverseSum);
nP.log('Sum multiplied by its inverse:');
nP.log(identityCheck);

var realA = nP.matrix([[4, 1], [2, 3]]);
var realB = nP.matrix([[1, 0], [0, 1]]);
var realResult = realA.add(realB).invert().mul(realA);

nP.log('Real matrix chain:');
nP.log(realResult);

var z1 = nP.complex(2, 3);
var z2 = nP.complex(1, -1);
var complexResult = z1.add(z2).mul(z2).inv();

nP.log('Complex number chain:');
nP.log(complexResult);`},{id:"full-wave-rectified-sine-fft",title:"Full-wave rectified sine and FFT",category:"math",code:`// Full-wave rectified sine and FFT

var g = nP.global;
var sampleCount = 256;
var period = 1e-3; // Original sine frequency: 1 kHz.
var periodsShown = 2;
g.tList = g.tGen(0, periodsShown * period * (sampleCount - 1) / sampleCount, sampleCount);
g.fList = [];

var rectified = nP.waveform({
  shape: 'rectifiedSine',
  period: period
});

nP.lineChart({
  inputTable: [rectified.out('waveform')],
  title: 'Full-wave rectified 1 kHz sine',
  metricPrefix: 'milli',
  xAxisTitle: 'Time (ms)',
  yAxisTitle: 'Voltage (V)',
  showPoints: false
});

var fft = nP.FFT(rectified.out('samples'));

nP.lineChart({
  inputTable: [fft.out('dBV')],
  title: 'DC and even harmonics of 1 kHz',
  plotType: 'bar',
  barWidth: 4,
  barBaseline: -80,
  yRange: [-80, 10],
  metricPrefix: 'kilo',
  xAxisTitle: 'Frequency (kHz)',
  yAxisTitle: 'Amplitude (dBV)'
});`},{id:"square-wave-fft",title:"Square wave and FFT",category:"math",code:`// Square wave and FFT

var g = nP.global;
var sampleCount = 256;
var period = 1e-3; // Fundamental frequency: 1 kHz.
var periodsShown = 2;
g.tList = g.tGen(0, periodsShown * period * (sampleCount - 1) / sampleCount, sampleCount);
g.fList = [];

var square = nP.waveform({
  shape: 'square',
  period: period
});

nP.lineChart({
  inputTable: [square.out('waveform')],
  title: 'Ideal square wave',
  metricPrefix: 'milli',
  xAxisTitle: 'Time (ms)',
  yAxisTitle: 'Voltage (V)',
  showPoints: false
});

var fft = nP.FFT(square.out('samples'));

nP.lineChart({
  inputTable: [fft.out('dBV')],
  title: 'Odd harmonics of 1 kHz',
  plotType: 'bar',
  barWidth: 4,
  barBaseline: -80,
  yRange: [-80, 10],
  metricPrefix: 'kilo',
  xAxisTitle: 'Frequency (kHz)',
  yAxisTitle: 'Amplitude (dBV)'
});`},{id:"trapezoid-fft-round-trip",title:"Trapezoid, FFT, and inverse FFT",category:"math",code:`// Trapezoid, FFT, and inverse FFT

var g = nP.global;
var period = 1e-3;
var sampleCount = 256;
g.tList = g.tGen(0, period * (sampleCount - 1) / sampleCount, sampleCount);
g.fList = [];

var trapezoid = nP.waveform({
  shape: 'custom',
  period: period,
  points: [
    [0, 0],
    [0.1e-3, 1],
    [0.6e-3, 1],
    [0.7e-3, 0],
    [period, 0]
  ]
});

nP.lineChart({
  inputTable: [trapezoid.out('waveform')],
  title: 'Sampled trapezoid',
  metricPrefix: 'milli',
  xAxisTitle: 'Time (ms)',
  yAxisTitle: 'Voltage (V)',
  showPoints: false
});

var fft = nP.FFT(trapezoid.out('samples'));

nP.lineChart({
  inputTable: [fft.out('dBV')],
  title: 'Trapezoid FFT',
  plotType: 'bar',
  barWidth: 4,
  barBaseline: -80,
  yRange: [-80, 10],
  metricPrefix: 'kilo',
  xAxisTitle: 'Frequency (kHz)',
  yAxisTitle: 'Amplitude (dBV)'
});

var reconstructed = nP.invFFT(fft);

nP.lineChart({
  inputTable: [reconstructed.out('real')],
  title: 'Reconstructed trapezoid samples',
  metricPrefix: 'milli',
  xAxisTitle: 'Time (ms)',
  yAxisTitle: 'Voltage (V)',
  showPoints: false
});`},{id:"chebyshev-ladder",title:"Chebyshev filter ladder",category:"filters",code:`// Chebyshev filter ladder

nP.global.fList = nP.global.fGen(10e6, 500e6, 51);

var gk = nP.chebyLPgk(3, 0.1);
var values = nP.chebyLPLCs(gk, 200e6, 50);

nP.log('Normalized g values:');
nP.log(gk);
nP.log('Terminations, capacitors, and inductor (SI units):');
nP.log(values);

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
});

nP.schematic(filter);`},{id:"microstrip-line",title:"Microstrip line",category:"microstrip",code:`// Microstrip line

var g = nP.global;
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

var chartTable = line.out('s11dB', 's21dB');

nP.lineChart({
  inputTable: [chartTable],
  title: 'Microstrip line',
  metricPrefix: 'giga',
  showPoints: false
});

nP.schematic(line);`},{id:"microstrip-coupler",title:"Microstrip coupled line",category:"microstrip",code:`// Microstrip coupled line

nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var coupler = nP.mclin();

nP.lineChart({
  inputTable: [coupler.out('s21dB', 's41dB')],
  title: 'Microstrip coupled line'
});

nP.schematic(coupler);`},{id:"microstrip-tee",title:"Microstrip Tee",category:"microstrip",code:`// Microstrip Tee

nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var tee = nP.mtee();

nP.lineChart({
  inputTable: [tee.out('s21dB', 's31dB')],
  title: 'Microstrip Tee branches'
});

nP.schematic(tee);`},{id:"microstrip-layout",title:"Step, bend, and via",category:"microstrip",code:`// Step, bend, and via

nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var step = nP.mstep();
var bend = nP.mbend();
var via = nP.mvia();

var path = nP.cascade(step, bend, via);

nP.lineChart({
  inputTable: [path.out('s11dB', 's21dB')],
  title: 'Microstrip layout path'
});

nP.schematic(path);`},{id:"microstrip-film-resistor",title:"Thin-film resistor",category:"microstrip",code:`// Thin-film resistor

nP.global.fList = nP.global.fGen(1e9, 5e9, 21);

var resistor = nP.mtfr({
  ohmsPerSquare: 50,
  width: 0.25e-3,
  length: 0.5e-3,
  sections: 3
});

var resistanceOhms = resistor.filmResistor.resistance;

nP.log('DC resistance (ohms):');
nP.log(resistanceOhms);

nP.lineChart({
  inputTable: [resistor.out('s11dB', 's21dB')],
  title: 'Thin-film resistor'
});

nP.schematic(resistor);`},{id:"amplifier-noise",title:"Amplifier noise figure",category:"noise",code:`// Amplifier noise figure

nP.global.fList = nP.global.fGen(1e9, 2e9, 11);
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
});

nP.schematic(chain);`},{id:"noise-order",title:"Amplifier versus attenuator order",category:"noise",code:`// Amplifier versus attenuator order

nP.global.fList = [1e9];

var amp = nP.Amp(20, 4);
var attenuator = nP.Attn(3);

var ampFirst = nP.cascade(amp, attenuator);
var attenuatorFirst = nP.cascade(attenuator, amp);

var ampFirstTable = ampFirst.out('s21dB', 'NF21dB');
var attenuatorFirstTable = attenuatorFirst.out('s21dB', 'NF21dB');

nP.log('Amplifier first:');
nP.log(ampFirstTable);

nP.log('Attenuator first:');
nP.log(attenuatorFirstTable);

nP.schematic(ampFirst);
nP.schematic(attenuatorFirst);`},{id:"two-tone-ip3",title:"Two-tone IM3 and OIP3",category:"intermodulation",code:`// Two-tone IM3 and OIP3

nP.global.fList = nP.global.fGen(1e9, 1.1e9, 5);
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
});

nP.schematic(chain);`},{id:"diode-dc-rf",title:"1N4148 DC and RF",category:"nonlinear",code:`// 1N4148 DC and RF

nP.global.fList = nP.global.fGen(1e6, 1e9, 21);

var diode = nP.diode1N4148({
  biasVoltage: 0.5
});

var rfTable = diode.out('s11dB', 's21dB');

nP.log(rfTable);

nP.lineChart({
  inputTable: [diode.ivTable(0, 0.9, 41)],
  title: '1N4148 I-V curve',
  xAxisTitle: 'Voltage (V)',
  yAxisTitle: 'Current (A)',
  metricPrefix: 'none'
});

nP.schematic(diode);`},{id:"am-envelope",title:"AM sidebands and envelope",category:"analog-modulation",code:`// AM sidebands and envelope

var g = nP.global;
g.tList = g.tGen(0, 1e-3, 2);
g.fList = [];

var tx = nP.mod({
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

var tones = tx.out('tones');

nP.log(tones);
nP.lineChart({
  inputTable: [rx.out('envelope')],
  title: 'AM envelope',
  xAxisTitle: 'Time (ms)',
  yAxisTitle: 'V',
  metricPrefix: 'milli'
});

nP.schematic({transmitter: tx, circuit: chain, receiver: rx});`},{id:"fm-pm-sidebands",title:"FM and PM sidebands",category:"analog-modulation",code:`// FM and PM sidebands

var g = nP.global;
g.tList = g.tGen(0, 1e-3, 2);
g.fList = [];

var fm = nP.mod({
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

var fmTones = fm.out('tones');
var pmTones = pm.out('tones');

nP.log('FM tones:');
nP.log(fmTones);

nP.log('PM tones:');
nP.log(pmTones);`},{id:"ssb-dsb-sidebands",title:"SSB versus DSB-SC",category:"analog-modulation",code:`// SSB versus DSB-SC

var g = nP.global;
g.tList = g.tGen(0, 1e-3, 2);
g.fList = [];

var ssb = nP.mod({
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

var ssbTones = ssb.out('tones');
var dsbTones = dsb.out('tones');

nP.log('SSB occupied tones:');
nP.log(ssbTones);

nP.log('DSB-SC occupied tones:');
nP.log(dsbTones);`},{id:"ascii-through-circuit",title:"ASCII through a circuit",category:"digital-signals",code:`// ASCII through a circuit

var context = nP.global();
context.tList = context.tGen(0, 319 / 8e9, 320); // 40 bits, 8 samples per bit.
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

var receivedText = rx.out('ASCII text');

nP.log('Received:');
nP.log(receivedText);

nP.lineChart({
  inputTable: [rx.out('waveform')],
  title: 'Received waveform',
  xAxisTitle: 'Time (ns)',
  yAxisTitle: 'V',
  metricPrefix: 'none'
});

nP.schematic({transmitter: tx, circuit: chain, receiver: rx});`},{id:"pn7-waveform",title:"PN7 clocked waveform",category:"digital-signals",code:`// PN7 clocked waveform

var context = nP.global();
context.tList = context.tGen(0, 126e-9, 127);

var pn = nP.PN({
  stages: 7,
  time: context.tList
});

var bits = pn.out('bit string');

nP.log('PN7 bits:');
nP.log(bits);

nP.lineChart({
  inputTable: [pn.out('waveform')],
  title: 'PN7 waveform',
  xAxisTitle: 'Time (ns)',
  yAxisTitle: 'V',
  metricPrefix: 'none'
});`},{id:"psk-receiver",title:"PSK receiver",category:"digital-signals",code:`// PSK receiver

var g = nP.global;
g.tList = g.tGen(0, 511 / 640e6, 512); // 8 bits, 64 samples per bit.
g.fList = [];

var tx = nP.mod({
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

var sentBits = tx.out('bit string');
var receivedBits = rx.out('bit string');

nP.log('Sent:');
nP.log(sentBits);

nP.log('Received:');
nP.log(receivedBits);

nP.schematic({transmitter: tx, circuit: chain, receiver: rx});`},{id:"ber-attenuation",title:"BER through an attenuator",category:"digital-signals",code:`// BER through an attenuator

var g = nP.global;
g.tList = g.tGen(0, 127 / 8e9, 128); // 16 bits, 8 samples per bit.
g.fList = [];

var tx = nP.mod({
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

nP.log('Measured BER:');
nP.log(ber);

nP.schematic({transmitter: tx, circuit: chain});`},{id:"qam-ofdm",title:"QAM and OFDM reception",category:"digital-signals",code:`// QAM and OFDM reception

var g = nP.global;
g.tList = g.tGen(0, 1279 / 640e6, 1280); // Four data symbols and one QAM pilot.
g.fList = [];

var qam = nP.mod({
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

var qamBits = qamRx.out('bit string');

nP.log('QAM bits:');
nP.log(qamBits);

g.tList = g.tGen(0, 127 / 640e6, 128); // One 128-sample OFDM block.
g.fList = [];

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

var ofdmBits = ofdmRx.out('bit string');

nP.log('OFDM bits:');
nP.log(ofdmBits);

nP.schematic({transmitter: qam, circuit: qamChain, receiver: qamRx});
nP.schematic({transmitter: ofdm, circuit: ofdmChain, receiver: ofdmRx});`}],F="np-repl-session-buffer",Z={__name:"Repl",setup(G){const T=U(null),P=Object.fromEntries(Y.map(e=>[e.id,e]));let n,w=!1,f,b,m,M,y;function k(e){var r;if(e.source!==(f==null?void 0:f.contentWindow)||((r=e.data)==null?void 0:r.type)!=="np-repl-chart-height")return;const t=Number(e.data.height);Number.isFinite(t)&&t>0&&(f.style.height=`${Math.max(360,t)}px`)}function A(e){return new Promise((t,r)=>{const s=document.createElement("script");s.src=e,s.onload=t,s.onerror=r,document.head.appendChild(s)})}function I(){return window.nP?Promise.resolve(window.nP):(y||(y=A(V("/nP.js")).then(()=>{if(!window.nP)throw new Error("The nP browser bundle did not expose its public API.");return window.nP}).catch(e=>{throw y=null,e})),y)}async function E(){if(window.CodeMirror)return!0;if(!document.querySelector("link[data-np-repl-codemirror]")){const e=document.createElement("link");e.rel="stylesheet",e.href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css",e.dataset.npReplCodemirror="",document.head.appendChild(e)}try{return await A("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"),await A("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js"),!0}catch{return!1}}function H(){try{const e=JSON.parse(sessionStorage.getItem(F)||"null");if(e&&typeof e.code=="string"){const t=P[e.activeId]?e.activeId:null,r=t?P[t].code:null,s=t==="trapezoid-fft-round-trip"?r.replace(`  shape: 'custom',
`,""):null;return{code:t&&(e.code===e.exampleCode||typeof e.exampleCode!="string"&&e.code===s)?r:e.code,activeId:t,exampleCode:r}}}catch{}return null}function O(){var t;const e=(t=location.hash.match(/^#example-([a-z0-9-]+)$/))==null?void 0:t[1];try{const r=JSON.parse(localStorage.getItem("np-repl-example-drafts")||"{}");if(localStorage.removeItem("np-repl-example-drafts"),e&&P[e]&&typeof(r==null?void 0:r[e])=="string"&&r[e].trim())return{code:r[e],activeId:e}}catch{try{localStorage.removeItem("np-repl-example-drafts")}catch{}}return null}return Q(async()=>{m=document.querySelector(".VPLocalNav .menu-text"),m&&(M=m.textContent,m.textContent="Code examples");const e=await E();if(w||!T.value)return;const t=T.value,r=t.querySelector("#code"),s=t.querySelector("#output");f=s,window.addEventListener("message",k);const c=t.querySelector("#status"),C=t.querySelector("#reset"),g=t.querySelector("#lint-results"),_=H(),D=O(),p=_||D;let d=(p==null?void 0:p.activeId)??null,x=(p==null?void 0:p.exampleCode)??(d?P[d].code:null),h=!1,R=0;n=e?window.CodeMirror.fromTextArea(r,{lineNumbers:!0,mode:"javascript",tabSize:2,lineWrapping:!0}):{getValue:()=>r.value,setValue:a=>{r.value=a},clearHistory:()=>{}};function L(){g.replaceChildren(),g.hidden=!0}function j(a,o){if(t.querySelector("#code-toolbar").scrollIntoView({behavior:"smooth",block:"start"}),n.setCursor)n.setCursor(a-1,o-1),n.focus();else{const u=r.value.split(`
`).slice(0,a-1).join(`
`).length+(a>1?1:0)+o-1;r.focus(),r.setSelectionRange(u,u)}}function $(a){if(L(),!!a.length){g.hidden=!1;for(const o of a){const l=document.createElement("p"),u=document.createElement("button");u.type="button",u.textContent=`Line ${o.line}`,u.addEventListener("click",()=>j(o.line,o.column)),l.append(u,document.createTextNode(`: ${o.message}`)),g.append(l)}}}function v(){if(!h){L();try{const a=n.getValue();!a&&d===null?sessionStorage.removeItem(F):sessionStorage.setItem(F,JSON.stringify({code:a,activeId:d,exampleCode:x}))}catch{}}}p&&(n.setValue(p.code),C.disabled=d===null,c.textContent="Editor restored",v()),b=()=>{const a=location.hash.match(/^#example-([a-z0-9-]+)$/);if(!a)return;const o=a[1],l=P[o];!l||o===d||(d=o,x=l.code,h=!0,n.setValue(l.code),h=!1,n.clearHistory(),C.disabled=!1,c.textContent="Example loaded",v())},window.addEventListener("hashchange",b),b(),e?n.on("change",v):r.addEventListener("input",v),C.addEventListener("click",()=>{x=P[d].code,h=!0,n.setValue(x),h=!1,n.clearHistory(),c.textContent="Example reset",v()}),t.querySelector("#clear").addEventListener("click",()=>{R++,h=!0,n.setValue(""),h=!1,d=null,x=null,C.disabled=!0,history.replaceState(history.state,"",location.pathname+location.search),s.onload=null,s.srcdoc="",s.style.height="",c.textContent="Editor and output cleared",v()}),t.querySelector("#view-output").addEventListener("click",()=>{t.querySelector("#output-heading").scrollIntoView({behavior:"smooth",block:"start"})}),t.querySelector("#view-code").addEventListener("click",()=>{t.querySelector("#code-toolbar").scrollIntoView({behavior:"smooth",block:"start"})}),t.querySelector("#run").addEventListener("click",async()=>{const a=++R,o=n.getValue();L(),c.textContent="Checking code…";let l=0;try{const[{lintCode:S},J]=await Promise.all([W(()=>import("./chunks/replLint.1jFEdaeU.js"),[]),I()]);if(w||a!==R)return;if(o!==n.getValue()){c.textContent="Code changed; press Run again";return}const z=S(o,J);l=z.length,$(z)}catch(S){if(w||a!==R)return;if(o!==n.getValue()){c.textContent="Code changed; press Run again";return}console.error("REPL lint check failed:",S),g.textContent="Lint check unavailable; running code.",g.hidden=!1}const u=JSON.stringify(`${o}
//# sourceURL=np-debug.js`).replace(/</g,"\\u003c");c.textContent="Running…",s.style.height="",s.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html{overflow-x:auto}body{min-width:720px;font:14px Arial,sans-serif;margin:1rem;color:#1f2937}pre{white-space:pre-wrap}.error{color:#b91c1c}svg{max-width:100%;height:auto}</style></head><body><div id="result"></div><script>const userSource=${u};function reportOutputHeight(){const body=document.body;const bottom=Array.from(body.children).reduce((height,child)=>Math.max(height,child.getBoundingClientRect().bottom),0);const margin=parseFloat(getComputedStyle(body).marginBottom)||0;parent.postMessage({type:'np-repl-chart-height',height:Math.ceil(bottom+margin+4)},'*');}function showError(error){document.getElementById('result').innerHTML='<pre class="error">'+String(error).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre>';requestAnimationFrame(reportOutputHeight);}window.onerror=function(message){showError(message);};function execute(){try{new Function(userSource)();}catch(error){console.error(error);showError(error.stack||error);}requestAnimationFrame(reportOutputHeight);new ResizeObserver(reportOutputHeight).observe(document.body);}<\/script><script src="${V("/nP.js")}" onload="execute()" onerror="showError('Unable to load the nP browser bundle.')"><\/script></body></html>`,s.onload=()=>{c.textContent=l?`Finished (${l} lint warning${l===1?"":"s"})`:"Finished"}})}),K(()=>{w=!0,(m==null?void 0:m.textContent)==="Code examples"&&(m.textContent=M),window.removeEventListener("message",k),b&&window.removeEventListener("hashchange",b),n!=null&&n.toTextArea&&n.toTextArea()}),(e,t)=>(N(),q("main",{ref_key:"root",ref:T,class:"np-repl"},t[0]||(t[0]=[i("h1",null,"nP RF REPL",-1),i("div",{class:"intro"},[i("p",null,[B("Choose an example or write JavaScript, then press Run. Set "),i("code",null,"nP.global.fList"),B(" for frequency-dependent circuits; use "),i("code",null,"nP.log(...)"),B(" to show values.")])],-1),i("div",{class:"workspace"},[i("section",null,[i("div",{id:"code-toolbar",class:"toolbar"},[i("h2",null,"JS Code"),i("button",{id:"run",type:"button"},"Run"),i("button",{id:"view-output",type:"button"},"View output"),i("button",{id:"clear",type:"button"},"Clear"),i("button",{id:"reset",type:"button",disabled:""},"Reset example"),i("span",{id:"status",class:"status",role:"status"},"Ready")]),i("div",{id:"lint-results",class:"lint-results",role:"status","aria-live":"polite",hidden:""}),i("textarea",{id:"code","aria-label":"JavaScript editor"}),i("div",{class:"output-heading-row"},[i("h2",{id:"output-heading"},"Output"),i("button",{id:"view-code",type:"button"},"View code")]),i("iframe",{id:"output",title:"REPL output",sandbox:"allow-scripts",allow:"clipboard-write"}),i("p",{class:"note"},"The editor survives refreshes in this tab and is normally cleared when the tab closes. Code runs in an isolated output frame.")])],-1)]),512))}},re=JSON.parse('{"title":"nP REPL","description":"","frontmatter":{"layout":"doc","title":"nP REPL","aside":false},"headers":[],"relativePath":"repl.md","filePath":"repl.md"}'),ee={name:"repl.md"},ie=Object.assign(ee,{setup(G){return(T,P)=>(N(),q("div",null,[X(Z)]))}});export{re as __pageData,ie as default};
