<!-- Modified: 2026-11-21 -->
# SMV1231-079LF varactor

Open [varactor.html](varactor.html) with the current browser bundle. The −3 V
source and 100 kΩ return/feed resistors determine reverse bias before RF
analysis. Input/output capacitors isolate the DC measurement ports. The page
shows the solved diode Q point, the canonical varactor symbol, C–V curves and
two-port S11/S21 from 10 MHz to 2 GHz.

`d1.cvTable({vr:{start:0,stop:15,points:31}})` returns reverse voltage in V,
junction depletion capacitance CJ in F and low-frequency total CT in F. CT
includes the junction response and fitted parallel package capacitance;
the separate lead inductance affects RF impedance. The curve does not move Q.
The example converts a separate display table to pF for readable chart ticks;
the API result stays in farads.

The source card has M=4.999, VJ=10.13 V, CJO=1.88 pF, RS=2.5 Ω, CP=.44 pF
and LS=.7 nH. It is a reverse C–V fit, not a characterized forward/leakage,
temperature/noise or large-signal VCO model. D's standalone default Q remains
VD=.6 V; choose a negative VD explicitly when no external supply sets it.

User-supplied records use `D({model: myModel})` through the same path. See
[model, equations, sources and verification](../developmentDocs/semiconductors/varactorModels.md).
