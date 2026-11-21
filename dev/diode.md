<!-- Modified: 2026-11-21 -->
# 1N4148 curve tracer and RF

This matches `dev/diode.html`. `D()` selects the archived NXP SPICE 1N4148 card. The I–V sweep and RF operating point are separate: changing the displayed sweep does not change the 0.6 V Q point. Tables go directly into the charts, in volts and amperes.

Port 1 is the anode and port 2 the cathode. The noise and direct weak nonlinear estimates belong to the fixed Q point. They include neither large-signal switching nor compression. The older `diode1N4148()` remains available with its original datasheet-fit parameters and positional I–V API; its numerical results differ.

See [Diode models](../developmentDocs/semiconductors/diodeModels.md) for equations, provenance, limits and the independent ngspice comparisons.

```npjs
// 1N4148 curve tracer and RF at a fixed Q point
var g = nP.global;
g.fList = g.fGen(10e6, 1e9, 51);
g.twoTone = {spacingHz: 1e6, p1dBm: -70, p2dBm: -70};

var d1 = nP.D({
    model: '1N4148',
    bias: {
        vd: {start: 0, stop: 0.8, points: 201}
    },
    qPoint: {vd: 0.6},
    temperature: g.Temp
});

var curves = d1.ivTable();
var fixedBias = d1.bias;
var response = d1.out('s11dB', 's21dB');
var noise = d1.out('NF21dB');
var intercepts = d1.out('OIP2sum21dBm', 'OIP3lower21dBm');

nP.log(fixedBias);
nP.schematic(d1);
nP.lineChart({
    inputTable: [curves],
    title: '1N4148 DC I-V curve',
    xAxisTitle: 'Anode-to-cathode voltage (V)',
    yAxisTitle: 'Anode current (A)',
    metricPrefix: 'none'
});
nP.lineChart({
    inputTable: [response],
    title: '1N4148 RF at VD = 0.6 V',
    xAxisTitle: 'Frequency (MHz)',
    yAxisTitle: 'S-parameters (dB)',
    metricPrefix: 'mega'
});
nP.lineChart({
    inputTable: [noise],
    title: '1N4148 noise at the fixed Q point',
    xAxisTitle: 'Frequency (MHz)',
    yAxisTitle: 'Noise figure (dB)',
    metricPrefix: 'mega'
});
nP.lineChart({
    inputTable: [intercepts],
    title: '1N4148 direct weak-signal intercept estimates',
    xAxisTitle: 'First-tone frequency (MHz)',
    yAxisTitle: 'Output intercept (dBm)',
    metricPrefix: 'mega'
});
```
