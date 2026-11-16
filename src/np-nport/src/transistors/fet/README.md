<!-- Modified: 2026-11-15 -->
# Field-effect transistor models

Reserved for the proposed `NJF()`, `PJF()`, `NMOS()`, and `PMOS()` constructors and their shared model engines. No executable models or exports are present yet.

Part parameter sets select their appropriate mathematical model. JFET, MOSFET, MESFET, and HEMT structures require suitable equations; a material label alone does not select a model. Define any additional public device-type names and the gate/drain/source/body port conventions before implementing those families.

Use the same device model for DC curves and bias-dependent RF, noise, and nonlinear calculations. Keep intrinsic-device behavior separate from documented package parasitics.

Follow [../AGENTS.md](../AGENTS.md). The shared scope and implementation status are in [../README.md](../README.md).
