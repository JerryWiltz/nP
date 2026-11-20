<!-- Modified: 2026-11-19 -->
# Self-biased JFET common-source amplifier

Open `commonSource.html` against the rebuilt browser bundle. The NJF uses the
onsemi MMBF5457LT1 record at 300.15 K. A 12 V supply, 1 MΩ gate return and 2.2 kΩ
drain/source resistors set the operating point before RF composition. All four
external capacitors are 10 nF and open during DC. Expect Id ≈ 0.950882 mA,
Vgs ≈ −2.091939 V and Vds ≈ 7.816121 V.

The chart shows 50 Ω S-parameters from 1 to 100 MHz. Negative S21 is expected for
this high-impedance, low-transconductance stage in a 50 Ω system; voltage gain and
matched power gain are different quantities. The supply is RF-open and its
separate bypass capacitor supplies the RF return.

`commonSource` detects both JFET polarities, split R/C, combined `sePaRC`, or
unbypassed source resistance, with optional supply bypass. The shape states
engineering organization; the shared relational solver chooses U-turn direction,
clearance and related branch baselines. No example coordinates are supplied.
