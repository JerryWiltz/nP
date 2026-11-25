<!-- Modified: 2026-11-25 -->
# Semiconductor sources of truth

This is the provenance index for the twelve implemented semiconductor constructors.
It separates **equation definitions**, **device parameter records**, **nP-derived
intermodulation**, and **validation evidence**. A manufacturer model card defines
a selected fit; agreement with another implementation of that card checks the
calculation, while measured device data check the fit's physical accuracy.

For Zener/avalanche RF noise sources, the implemented classical noise law is
insufficient. The [breakdown-noise investigation](zenerNoise.md) collects
primary references, numerical evidence, missing characterization and proposed
validation. No measured excess-noise fit has been added to the BZX384 record. The separate
[NoiseDiode research reference](noiseDiodeModels.md) implements plot-derived
avalanche noise, with calibration and reference-plane discrepancies disclosed.

## Equation overview

| Constructors | DC equation source | RF current/charge source | Noise equation source | Intermodulation equation source |
| --- | --- | --- | --- | --- |
| `NPN()`, `PNP()` | SPICE level-1 modified Gummel–Poon; [ngspice BJT current and temperature implementation][spice-bjt]. | Derivatives of the same currents; SPICE depletion and forward/reverse diffusion charge, including TF/XTF/VTF/ITF; [BJT implementation][spice-bjt]. | [ngspice BJT noise][noise-bjt]: base/collector shot noise, contact thermal noise and optional base flicker noise. | **Derived in nP** by Taylor-expanding those Gummel–Poon currents and terminal charges through degree three; [shared derivation below](#intermodulation-provenance). |
| `NJF()`, `PJF()` | SPICE level-1 Shichman–Hodges, B=1, including gate junction current and temperature laws; [ngspice JFET implementation][spice-jfet]. | Integrated gate-junction depletion charge and current derivatives from the same [level-1 model][spice-jfet]. | [ngspice JFET noise][noise-jfet], classical NLEV=1: channel `4kT(2/3) abs(gm)`, RD/RS thermal noise and optional flicker. Gate shot/induced-gate noise omitted. | **Derived in nP** from those current and static charge equations. |
| `NMOS()`, `PMOS()` | SPICE MOS1 Shichman–Hodges, including body effect, body junction currents and temperature laws; [ngspice MOS1 implementation][spice-mos1]. | Provided overlap and body depletion charge. The supplied cards omit TOX, so this implementation has no inversion/Meyer oxide charge; [MOSFET contract](mosfetModels.md). | [ngspice MOS1 noise][noise-mos1]: classical channel `4kT(2/3) abs(gm)`, contact thermal noise and the MOS1 flicker expression. Body shot/induced-gate noise omitted. | **Derived in nP** from those currents and supported charges, including body-voltage derivatives. |
| `MESFET()` | Berkeley SPICE3 Statz/MES1; [SPICE3f manual §3.4.10][spice3] and [ngspice MES1 implementation][spice-mes]. | MES1 total-gate-charge derivatives supply **differential capacitance branches**; not separate static Qgs/Qgd. See [MESFET contract](mesfetModels.md). | [ngspice MES1 noise][noise-mes]: classical channel `4kT(2/3) abs(gm)`, RD/RS thermal noise and optional flicker. No measured microwave noise fit. | **Derived in nP** from Statz current and the differential capacitance branches; includes nonlinear `C(V) dV/dt`. |
| `HEMT()` | Manufacturer Statz card, with current law documented in [ADS Statz_Model, pp.484–495][ads-statz]; nominal-temperature adaptation. | ADS Statz/Divekar **separate static Qgs/Qgd** partition, pp.489–491, plus the [manufacturer die/package network, p.16][atf35143]. Legacy DELTA translation remains an assumption. | [ADS Statz_Model noise, p.495][ads-statz]: correlated drain/induced-gate P/R/C sources, flicker and physical contact thermal noise. P/R/C values come from the [manufacturer card][atf35143]. | **Derived in nP** from the same Statz currents and partitioned static charges; the package propagates their generated products. |
| `D()` | SPICE junction/Schottky/Zener diode: forward current, reverse breakdown, RS and temperature laws; [ngspice diode model][spice-diode]. | SPICE depletion/diffusion charge and current derivatives; [diode contract](diodeModels.md). | [ngspice diode noise][noise-diode]: junction `2q abs(Ij)`, RS/leakage-resistor thermal noise and optional flicker. No added junction equilibrium-noise floor at zero current. | **Derived in nP** from diode-current and junction-charge derivatives. |
| `PIN()` charge storage | [Keysight ADS documented equivalent, pp. 361–367](https://edadownload.software.keysight.com/eedl/ads/2019update1/pdf/Nonlinear_Devices.pdf): two PN junctions, five-section storage reduction and controlled conductivity/lifetime. | Same dynamic ladder and integrated SPICE depletion charge; automatic bias state. | Independent PN shot/flicker and physical-resistor thermal sources; noiseless storage ladder. Not part-calibrated excess noise. | Cubic Volterra with local second-order feedback; validated against independent SPICE transient Fourier coefficients. No cross-device quadratic remixing or network transient engine. |
| `PIN()` SMP1307-011LF | Selected-region PN current, RS and VI/RR equivalent from [Skyworks 200313B Figure 8](https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/1-100/200313B.pdf). Region selected before solving. | Forward Ri=VI/ID and depletion C at VI; reverse RR/CMIN, published Cg/Cp/L package; [contract](pinModels.md). | **Approximation:** 4kT Re(Z) equivalent RF thermal noise; not calibrated PIN excess/shot noise. | Explicitly unavailable: selected-bias linear RF does not establish nonlinear carrier-storage dynamics. |
| `NoiseDiode()` | No DC I-V law supplied; fixed research bias, actionable requiresModel. | [Maya et al. Eq. 4](https://upcommons.upc.edu/server/api/core/bitstreams/01200fd7-3902-48b4-a987-161b9dd9a521/content), avalanche/drift impedance and Table 1. Missing transit time fitted from Figure 4. | Same paper Eq. 8: 2q abs(ID) M²; Figure 5 multiplier fitted at 16.7 mA; physical contact thermal noise. Figure 6 is a separate on-wafer plane, not imposed on the device. | Absent nonlinear current/charge fit; requests reject explicitly, rather than reporting infinite IP. |
| `D()` varactor extension | Same SPICE junction current law with generic current defaults. | [Skyworks varactor law][skyworks-varactor]: integrated depletion charge for finite nonnegative M, including the M=1 logarithmic limit; explicit RS/CP/LS package. | Same classical junction/contact noise through the package; no measured varactor-noise fit. | **Derived in nP** from the same charge/current derivatives, propagated through package loading at tones and products. |
| `diode1N4148()` | Shockley current plus **nP's empirical** leakage/soft-breakdown model, fitted to [Vishay][vishay-diode]/[onsemi][onsemi-diode] anchors; not the NXP card used by `D()`. | **nP approximation:** depletion capacitance, `TT × conductance` diffusion capacitance and a numerical forward-capacitance clamp; [legacy implementation](../../src/np-nport/src/diodes/diode1N4148.js). | **nP heuristic:** maximum of junction equilibrium-conductance noise and a weak shot estimate, plus leakage/RS thermal noise. No manufacturer noise-equation fit is cited. | **Derived in nP** from this legacy current law and capacitance derivatives; inherits its approximations. |

For JFET/MOS1/MES1, the classical channel-noise law is a saturation-oriented
approximation with an ohmic-region limitation. The supported records do not
provide fitted flicker coefficients: KF is zero. A noise implementation source
is not evidence that a device's measured NF has been reproduced.

## Device parameters and package sources

| Constructor / record | Parameter source actually used | Package coverage and source qualification |
| --- | --- | --- |
| `NPN`, `2N3904` | [Fairchild datasheet SPICE card][npn3904]; ISE units cross-checked with the [OUP/PSpice listing][oup3904]. | RB/RC retained; no explicit TO-92 lead L/C. |
| `NPN`, `BFR93A` | [Philips/NXP subcircuit][bfr93a], September 1995; underlying BFR91A die model v1.0, February 1992. | Published five-inductor/three-capacitor SOT23 network and contact resistances. |
| `PNP`, `2N3906` | [Fairchild datasheet SPICE card, archived by SFU][pnp3906]. | RB/RC and VTF retained; no explicit TO-92 lead L/C. |
| `NJF`, `MMBF5457LT1` | [onsemi model][njf], dated 2002-12-06. | RD/RS and junction capacitance; no explicit SOT23 lead L/C. |
| `PJF`, `MMBFJ175LT1` | [onsemi model][pjf], dated 1998-04-14. | RD/RS and junction capacitance; no explicit SOT23 lead L/C. |
| `NMOS`, `DMN55D0UT` | [Diodes Incorporated model][nmos]. | Discrete-device numerical geometry and RD/RS; no explicit package L/C or gate resistance. |
| `PMOS`, `DMP58D0SV` | [Diodes Incorporated model][pmos]. | One channel of the dual device; no inter-channel coupling or explicit package L/C. |
| `MESFET`, `SPICE3_REFERENCE` | Example-column values/defaults in [SPICE3f §3.4.10][spice3]. | Numerical reference profile, **not a commercial-device fit**. |
| `MESFET`, `NE760` | [Intusoft IsSpice4 User's Guide][intusoft], ch.8, printed pp.193–194. The [NEC/CEL datasheet][ne760] identifies the family. | NEC device family; Intusoft publishes the card. No package suffix or lead/bond-wire network; not a manufacturer-certified NE76000/NE76084 model. |
| `HEMT`, `ATF35143_DIE` / `ATF35143` | [Agilent/Avago ATF-35143 datasheet, p.16][atf35143], W=400 µm, plus explicit adaptation/default choices in [HEMT contract](hemtModels.md). | Die record retains die parasitics. ATF35143 adds the published SC-70 network with both external source pins common. Measured test-board source vias excluded. |
| `D`, `1N4148` | [Archived NXP PSPICE subcircuit preserved by PySpice][nxp-diode]. Original NXP URL is retained in model metadata. | RS and external 5.827 GΩ reverse-modeling resistor retained. No explicit package L/C. |
| `D`, `SMS7621` / `SMS7630` | [Skyworks 200041AH, Table 5, p.4][skyworks-schottky], June 13, 2024. | Per-junction Schottky cards with RS. No package L/C or added leakage resistor. TNOM=27 °C, NBV=1, KF=0 and AF=1 are classical defaults. |
| `PIN`, `CHARGE_STORAGE_REFERENCE` | Keysight documented five-section numerical reference, not a manufacturer-calibrated part. | Parameters/defaults and noise assumptions in [PIN contract](pinModels.md). Independent SPICE DC/RF/noise and transient IM references; mathematical correspondence is not measured-device validation. |
| `PIN`, `SMP1307-011LF` | [Skyworks 200313B Figure 8](pinModels.md), with DC/RF plots in Figures 9/10. | Figure IS/RR differ from the tables; figure values retained. Physical lifetime is a stored-charge diagnostic. Fixed nominal temperature and selected region, not a complete transient/SPICE PIN engine. |
| `NoiseDiode`, `NC406_REFERENCE` | [Maya et al. Table 1 and Figures 4/5](noiseDiodeModels.md); reproducible plot digitization/regression, not raw measurements. | Fixed 16.7 mA/300 K/2–40 GHz; diode package only. Unspecified transition, conflicting voltage captions, no DC/cold-state/bias interpolation. |
| `D`, `BZX384-B4V7` | [Pinned archived NXP/Philips-attributed card](https://raw.githubusercontent.com/kicad-spice-library/KiCad-Spice-Library/a8688952bcaab19f567bc4db237b60bde03ef310/Models/Diode/DIODE2.lib); [Zener note](zenerModels.md). | Original manufacturer-hosted model unavailable; [Nexperia datasheet](https://assets.nexperia.com/documents/data-sheet/BZX384_SER.pdf) checks part/pinning/bounds only. Generic omitted defaults, no explicit package, fitted temperature coefficient or avalanche excess noise. |
| `D`, `SMV1231-079LF` | [Skyworks 200058AB, Tables 1/5 and Figure 5][smv1231], May 7, 2026; [varactor note](varactorModels.md). | Single SC-79 LS=.7 nH; CP=.44 pF outside RS/junction. M=4.999, VJ=10.13 V; no measured forward/leakage, noise or temperature fit. |
| `diode1N4148` | [Vishay 1N4148 Rev.1.6, 07-Nov-2024][vishay-diode] and [onsemi 1N91x/1N4x48 Rev.6, September 2024][onsemi-diode]. | **nP-selected/fitted parameters**, not a published vendor SPICE card. These sources supply electrical anchors, not the legacy noise heuristic or a measured IP fit. |

The executable parameter records are in
[npnModels.js](../../src/np-nport/src/transistors/bjt/npnModels.js),
[pnpModels.js](../../src/np-nport/src/transistors/bjt/pnpModels.js),
[jfetModels.js](../../src/np-nport/src/transistors/fet/jfetModels.js),
[mosfetModels.js](../../src/np-nport/src/transistors/fet/mosfetModels.js),
[mesfetModels.js](../../src/np-nport/src/transistors/fet/mesfetModels.js),
[hemtModels.js](../../src/np-nport/src/transistors/fet/hemtModels.js),
[diodeModels.js](../../src/np-nport/src/diodes/diodeModels.js),
[noiseDiodeModels.js](../../src/np-nport/src/diodes/noiseDiodeModels.js),
[pinModels.js](../../src/np-nport/src/diodes/pinModels.js), and the legacy
[diode constructor](../../src/np-nport/src/diodes/diode1N4148.js).

All eleven catalog-based semiconductor constructors accept user-supplied records
with the same family parameter shape. See [custom models](customModels.md) for
required values, generic defaults and package limits.
Their provenance is supplied by the caller; a new part name is not a verified
manufacturer fit. Omitted optional parameters use the documented family defaults,
including nP's retained BJT ITF=Infinity compatibility choice. Each family's
existing equations serve both named and supplied records; source links are never
downloaded during analysis. Custom HEMTs require explicit core fit values.

## Intermodulation provenance

NoiseDiode and the selected-region SMP1307 PIN equivalent have no deterministic nonlinear fit; this section applies to the
current/charge-based devices.

There is **no separate manufacturer IM2/IM3 equation set or fixed intercept
number** in these device records. nP derives nonlinear sources by a local
Taylor expansion of each family's implemented current and charge laws around
its DC operating point. Second-/third-order terms mix the two fundamental
voltages; `dQ/dt` contributes charge current at each product frequency.

The implementation references are
[two-control Taylor algebra](../../src/np-nport/src/transistors/bjt/taylor.js),
[three-control Taylor algebra](../../src/np-nport/src/transistors/deviceTaylor.js),
[transistor product generation](../../src/np-nport/src/transistors/deviceRf.js), and
[diode products/network propagation](../../src/np-nport/src/intermod.js).
This is an **nP derivation and implementation**, not a copied manufacturer
distortion model or ngspice's complete distortion analysis. No separate
external source for these mixing formulas is identified in the implementation.

Only direct weak Taylor products are retained. Quadratic-product remixing into
third order, full Volterra feedback, harmonic balance, compression and
large-signal bias movement are omitted. Derivative, conservation, two-tone
slope and selected Fourier checks support the approximation; they do not
establish measured OIP3 or P1dB accuracy.

## Implementation and evidence map

| Family | nP current/charge implementation | Model-specific explanation and numerical checks |
| --- | --- | --- |
| BJT | [gummelPoon.js](../../src/np-nport/src/transistors/bjt/gummelPoon.js), [bjtModel.js](../../src/np-nport/src/transistors/bjt/bjtModel.js); noise in [bjtConstructor.js](../../src/np-nport/src/transistors/bjt/bjtConstructor.js). | [BJT note](transistorModels.md); [NPN tests](../../test/npn.test.js), [PNP tests](../../test/pnp.test.js), [linearization tests](../../test/bjt-linearization.test.js); `npn-*`/`pnp-*` fixtures. |
| JFET | [jfetEquations.js](../../src/np-nport/src/transistors/fet/jfetEquations.js); noise in [jfetConstructor.js](../../src/np-nport/src/transistors/fet/jfetConstructor.js). | [JFET note](jfetModels.md), [tests](../../test/jfet.test.js); `jfet-*` fixtures. |
| MOSFET | [mosfetEquations.js](../../src/np-nport/src/transistors/fet/mosfetEquations.js); noise in [mosfetConstructor.js](../../src/np-nport/src/transistors/fet/mosfetConstructor.js). | [MOSFET note](mosfetModels.md), [tests](../../test/mosfet.test.js); `mosfet-*` fixtures. |
| MESFET | [mesfetEquations.js](../../src/np-nport/src/transistors/fet/mesfetEquations.js); noise in [mesfetConstructor.js](../../src/np-nport/src/transistors/fet/mesfetConstructor.js). | [MESFET note](mesfetModels.md), [primitive tests](../../test/mesfet.test.js), [NE760 tests](../../test/mesfet-ne760.test.js); `mesfet-*` fixtures. |
| HEMT | [hemtEquations.js](../../src/np-nport/src/transistors/fet/hemtEquations.js), shared Statz channel in mesfetEquations.js; noise in [hemtConstructor.js](../../src/np-nport/src/transistors/fet/hemtConstructor.js), package in [hemtTopology.js](../../src/np-nport/src/transistors/fet/hemtTopology.js). | [HEMT contract](hemtModels.md), [accuracy audit](hemtAccuracyAudit.md), [die tests](../../test/hemt.test.js), [package tests](../../test/hemt-package.test.js); `hemt-atf35143*` fixtures. |
| `D()` | [junctionDiode.js](../../src/np-nport/src/diodes/junctionDiode.js); noise in [diodeRf.js](../../src/np-nport/src/diodes/diodeRf.js). | [Diode note](diodeModels.md), [tests](../../test/d-model.test.js); `diode-1n4148*` fixtures; [Zener tests](../../test/zener.test.js) and `zener-*` independent SPICE fixtures. Classical noise agreement excludes avalanche excess noise. |
| PIN charge storage | pinChargeModel.js, pinChargeEquations.js, pinChargeRf.js, pinChargeIntermod.js and pinCharge.js in the diode directory. | [Contract](pinModels.md), pin-charge.test.js, independent SPICE pin-charge-storage.cir / pin-charge-two-tone.cir. |
| PIN selected region | [pinEquations.js](../../src/np-nport/src/diodes/pinEquations.js), [PIN.js](../../src/np-nport/src/diodes/PIN.js), shared PN DC adapter. | [Selected-region contract](pinModels.md), [tests](../../test/pin.test.js), independent pin-smp1307.cir DC/RF/thermal reference; no measured noise/IM validation. |
| NoiseDiode | [avalancheNoise.js](../../src/np-nport/src/diodes/avalancheNoise.js), [constructor](../../src/np-nport/src/diodes/NoiseDiode.js). | [Curve fits and equations](noiseDiodeModels.md), [tests](../../test/noise-diode.test.js), independent `noise-diode-equivalent.cir` RF/noise network; implementation checks, not measured calibration. |
| Legacy diode | [legacyDiode.js](../../src/np-nport/src/diodes/legacyDiode.js), [diode1N4148.js](../../src/np-nport/src/diodes/diode1N4148.js). | [Legacy diode note](diodes/README.md), [tests](../../test/diodes.test.js); network DC reference in `legacy-diode-network-dc.cir`. |

Fixtures live under [test/fixtures](../../test/fixtures/). The cited numerical
reference decks were run in **ngspice 39.3**. They check selected operating
points, RF and noise calculations; coverage differs by family. See each
family's tests for actual conditions and tolerances. No blanket validation
against measured hardware is implied.

The separate [math.js equation audit](../analysis/equationAudit.md) compares
selected current/charge Taylor coefficients with symbolic derivatives and
checks explicit SI annotations. The Taylor polynomial issue is fixed; legacy
diode clamp derivatives still fail. It does not replace the physical references
above.

HEMT reference decks use ngspice's native channel law but separately encoded
gate/charge equations and noise-source responses. Agreement therefore does
not independently establish the old MDS parameter interpretation. The
manufacturer's [pulsed I–V curves, p.2; DC specifications, p.3; and measured
S/noise data, p.8][atf35143] are physical comparison sources. Existing checks
flag DC and RF discrepancies: at Vgs=−0.6 V/Vds=2 V, the plotted pulsed current
is about 7 mA versus the model's 13.3 mA. Pulsed data are not steady-state DC
measurements. The legacy DELTA mapping, electrical temperature behavior and
measured device fit remain unresolved; no original MDS/ADS reference run has
been obtained. See the [audit](hemtAccuracyAudit.md).

The shared RF/noise transfer is implemented in
[deviceRf.js](../../src/np-nport/src/transistors/deviceRf.js),
[diodeRf.js](../../src/np-nport/src/diodes/diodeRf.js), and the normal network
composition. [Gupta's connection-scattering derivation](../analysis/guptaConnectionScattering.md)
documents the network propagation method; it is not a source of semiconductor
current or noise-density equations. External-network bias uses
[dcSolver.js](../../src/np-nport/src/dcSolver.js) and the same device equations,
as described in [DC analysis](../analysis/dcAnalysis.md).

## Maintaining this index

When adding or changing a semiconductor model, update its equation row,
parameter source, implementation links and evidence status here. Record the
model version, nominal temperature, units, defaults, polarity/terminal order,
package boundary and any fitted or assumed values in the family's detailed
note. Distinguish an unavailable original source from an inspected archive.
Schottky, varactor and archived Zener cards use D() records; HBT, Zener, varactor and PIN drawing names alone do not establish
implemented numerical models.

[skyworks-schottky]: https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/201-300/Surface-Mount-Schottky-Diodes_200041AH.pdf
[spice-bjt]: https://github.com/ngspice/ngspice/tree/master/src/spicelib/devices/bjt
[spice-jfet]: https://github.com/ngspice/ngspice/tree/master/src/spicelib/devices/jfet
[spice-mos1]: https://github.com/ngspice/ngspice/tree/master/src/spicelib/devices/mos1
[spice-mes]: https://github.com/ngspice/ngspice/tree/master/src/spicelib/devices/mes
[spice-diode]: https://nmg.gitlab.io/ngspice-manual/diodes/diodemodel_d.html
[noise-bjt]: https://raw.githubusercontent.com/ngspice/ngspice/master/src/spicelib/devices/bjt/bjtnoise.c
[noise-jfet]: https://raw.githubusercontent.com/ngspice/ngspice/master/src/spicelib/devices/jfet/jfetnoi.c
[noise-mos1]: https://raw.githubusercontent.com/ngspice/ngspice/master/src/spicelib/devices/mos1/mos1noi.c
[noise-mes]: https://raw.githubusercontent.com/ngspice/ngspice/master/src/spicelib/devices/mes/mesnoise.c
[noise-diode]: https://raw.githubusercontent.com/ngspice/ngspice/master/src/spicelib/devices/dio/dionoise.c
[spice3]: https://pages.hmc.edu/harris/class/e158/07/spice3man.pdf
[ads-statz]: https://edadownload.software.keysight.com/eedl/ads/2019update1/pdf/Nonlinear_Devices.pdf
[atf35143]: https://sites.units.it/carrato/didatt/corsi_old/E2_web/modulo_carrato/doc/datasheet_discreti/HEMT_ATF35143.pdf
[npn3904]: https://media.digikey.com/pdf/Data%20Sheets/Fairchild%20PDFs/2N3904.pdf
[oup3904]: https://learninglink.oup.com/protected/files/content/file/1574079180264-SedraSmith8e_SPICE_Problem_Guide_AppendixB.pdf
[bfr93a]: https://www.nxp.com/downloads/en/spice-model/BFR93A_SPICE.prm
[pnp3906]: https://www2.ensc.sfu.ca/reference/data-sheets/2N3906.PDF
[njf]: https://www.onsemi.com/download/models/lib/mmbf5457lt1.lib
[pjf]: https://www.onsemi.com/download/models/lib/mmbfj175lt1.lib
[nmos]: https://www.diodes.com/spice/download/1842/DMN55D0UT.spice.txt
[pmos]: https://www.diodes.com/spice/download/2329/DMP58D0SV.spice.txt
[intusoft]: http://www.intusoft.com/lit/IsSpice4.pdf
[ne760]: https://homepages.uc.edu/~ferendam/Courses/EE_711/NE76000_data.pdf
[nxp-diode]: https://raw.githubusercontent.com/PySpice-org/PySpice/master/examples/libraries/diode/switching/1N4148.lib
[vishay-diode]: https://www.vishay.com/docs/81857/1n4148.pdf
[onsemi-diode]: https://www.onsemi.com/pdf/datasheet/1n914-d.pdf

[skyworks-varactor]: https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/1-100/Varactor_SPICE_Model_AN_200315C.pdf
[smv1231]: https://www.skyworksinc.com/-/media/F9C9BC1315644EB890723BD8C726746E.pdf

## RF-to-DC detector analysis

[Weak-signal rectification](../analysis/rectification.md) derives the average
quadratic current `0.5 * Isecond * Vrms^2` from the existing D() current law.
Its loaded RF excitation and shared DC Jacobian response are nP derivations;
[Skyworks detector theory](https://www.skyworksinc.com/-/media/SkyWorks/Documents/Products/1-100/200826A.pdf)
describes square-law detection and impedance dependence. The independent
`schottky-detector.cir` and `schottky-differential-detector.cir` transient decks
validate weak DC outputs under the same card/temperature/load conditions.
They do not validate high-power detection, self-heating or measured sensitivity.
