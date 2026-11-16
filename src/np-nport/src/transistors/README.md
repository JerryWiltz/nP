<!-- Modified: 2026-11-15 -->
# Transistor models

`NPN()` implements the **2N3904** (default) and **BFR93A** through a shared modified Gummel–Poon engine. `PNP()` implements the **2N3906**, reusing that engine. FET constructors remain future work.

```text
transistors/
├── AGENTS.md       Shared implementation instructions
├── README.md       Scope and status
├── bjt/
│   ├── NPN.js          Public NPN entry
│   ├── PNP.js          Public PNP entry
│   ├── bjtConstructor.js Shared validation, polarity, curves and RF setup
│   ├── bjtModel.js     Shared SPICE defaults and model lookup
│   ├── npnModels.js    NPN parameters and package networks
│   ├── pnpModels.js    PNP parameters and package coverage
│   ├── gummelPoon.js   DC currents, charges and bias solver
│   ├── taylor.js       Derivatives through third order
│   ├── bjtRf.js        RF, noise and nonlinear sources
│   └── README.md
└── fet/
    └── README.md   Field-effect-device plan
```

Public constructor names follow SPICE device types: `NPN`, `PNP`, `NJF`, `PJF`, `NMOS`, and `PMOS`. A `model` option selects a supported part parameter set, such as `2N3904`. Material, device structure, equation family, and package coverage belong to that model record.

`NPN().ivTable()` and `PNP().ivTable()` return DC curve-tracer tables. The explicit `qPoint` supplies frequency-dependent S-parameters, active noise covariance and weak nonlinear coefficients. External `nodal()` connections select common emitter, base or collector for RF; the DC `configuration` does not terminate a port. Independent DC sources and a general DC network solver remain future work. See [the model note](../../../../developmentDocs/transistorModels.md).

See [bjt/README.md](bjt/README.md), [fet/README.md](fet/README.md), and [AGENTS.md](AGENTS.md). Existing diode models remain in [../diodes/](../diodes/). Keep detailed model equations and engineering notes in [developmentDocs/](../../../../developmentDocs/).
