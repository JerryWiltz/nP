<!-- Modified: 2026-11-22 -->
# BZX384-B4V7 Zener

Open [zener.html](zener.html) with the current browser bundle. A −8 V supply
and two 1 kΩ resistors set VD ≈ −4.67219 V and ID ≈ −1.66391 mA before RF.
The page logs the solved state, draws the Zener circuit, plots reverse I–V
in V/mA and S11/S21 from 1 MHz to 1 GHz. Coupling capacitors isolate the
external RF ports from DC. The I–V sweep does not change the network bias.

`D()` remains a two-port series device with port 1 anode and port 2 cathode.
Voltage/current are negative in reverse breakdown. Standalone defaults remain
VD=+0.6 V; specify a negative Q voltage when no supply sets the bias.

The named part uses an archived NXP/Philips-attributed single-junction card.
Named and user-supplied records share the same DC/RF/noise/weak nonlinear path.
Classical shot/thermal noise does not model measured avalanche excess noise;
there is no self-heating or large-signal clipping analysis. See
[parameters, provenance and independent verification](../developmentDocs/semiconductors/zenerModels.md).
