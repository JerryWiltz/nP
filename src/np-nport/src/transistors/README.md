<!-- Modified: 2026-11-19 -->
# Transistor models

`NPN()` implements the **2N3904** (default) and **BFR93A** through a shared modified Gummel–Poon engine. `PNP()` implements the **2N3906**, reusing that engine. `NJF()` and `PJF()` implement onsemi MMBF5457LT1 and MMBFJ175LT1 through a shared level-1 JFET engine. `NMOS()` and `PMOS()` add sourced level-1 MOSFETs with optional independent body. `MESFET()` adds a Statz/MES1 SPICE reference profile; commercial MESFET records, HEMT and advanced MOS families remain future work.

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
│   ├── bjtRf.js        Compatibility entry to shared three-terminal RF
│   └── README.md
├── threeTerminalRf.js  Compatibility entry to shared deviceRf solver
└── fet/
    ├── NJF.js / PJF.js Public JFET entries
    ├── NMOS.js / PMOS.js Public MOSFET entries
    ├── mosfetConstructor.js / mosfetEquations.js / mosfetModels.js / mosfetDc.js
    ├── jfetConstructor.js Validation, curves and RF setup
    ├── jfetModels.js   Manufacturer parameter records
    ├── jfetEquations.js Shared current/charge engine
    ├── jfetDc.js       Network DC adapter
    └── README.md
```

Public constructor names follow SPICE device types: `NPN`, `PNP`, `NJF`, `PJF`, `NMOS`, `PMOS`, and `MESFET`. A `model` option selects a supported part parameter set, such as `2N3904`. Material, device structure, equation family, and package coverage belong to that model record.

`NPN().ivTable()` and `PNP().ivTable()` return DC curve-tracer tables. The explicit `qPoint` supplies frequency-dependent S-parameters, active noise covariance and weak nonlinear coefficients. External `nodal()` connections select common emitter, base or collector for RF; the DC `configuration` does not terminate a port. `V()` and the shared network DC solver determine external bias before RF in supply-driven networks. JFETs use the same ordering with their own current/charge law and G/D/S terminal order. See [MOSFET models](../../../../developmentDocs/mosfetModels.md), [JFET models](../../../../developmentDocs/jfetModels.md) and [the bipolar model note](../../../../developmentDocs/transistorModels.md).

See [bjt/README.md](bjt/README.md), [fet/README.md](fet/README.md), and [AGENTS.md](AGENTS.md). Existing diode models remain in [../diodes/](../diodes/). Keep detailed model equations and engineering notes in [developmentDocs/](../../../../developmentDocs/).

MESFET details: [reference profile, differential capacitance and limits](../../../../developmentDocs/mesfetModels.md). No material label or shared drawing geometry selects HEMT physics.
