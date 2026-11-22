<!-- Modified: 2026-11-21 -->
# Semiconductor models

Current and charge laws, parameter records, RF/noise/nonlinearity assumptions and device validation. Start with the sources index to distinguish published equations, fitted parameters and numerical checks.

| Note | Contents |
| --- | --- |
| [Sources of truth](semiconductorSources.md) | Overview tables of equation sources, parameter provenance, implementation and evidence. |
| [Custom model records](customModels.md) | User-supplied parts, defaults, units, validation and package coverage for all catalog-based semiconductor constructors. |
| [Bipolar transistors](transistorModels.md) | NPN/PNP modified Gummel–Poon models and parameter records. |
| [JFETs](jfetModels.md) | NJF/PJF level-1 models, noise and external bias. |
| [MOSFETs](mosfetModels.md) | NMOS/PMOS level-1 models, body connections and limits. |
| [MESFETs](mesfetModels.md) | Statz/MES1 reference and NE760 records. |
| [Floating MESFET derivation](mesfetVoltageCurrentNoise.md) | Voltage/current representation and noise covariance. |
| [HEMTs](hemtModels.md) | ATF35143 die/package adaptation, static charges and correlated noise. |
| [HEMT accuracy audit](hemtAccuracyAudit.md) | Measured-data discrepancies, sensitivity checks and unresolved reference questions. |
| [SPICE-style diodes](diodeModels.md) | D() records, current/charge equations and verification. |
| [Varactor models](varactorModels.md) | Hyperabrupt/M=1 charge, SMV1231-079LF package, C–V output and independent checks. |
| [Schottky diodes](schottkyModels.md) | SMS7621/SMS7630 per-junction cards, package limits and independent checks. |
| [Legacy diode](diodes/README.md) | diode1N4148() empirical model, datasheet anchors and limitations. |

[Development documentation](../README.md)
