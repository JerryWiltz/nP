---
aside: false
---

<!-- Modified: 2026-11-22 -->

<script setup>
import CanonicalSymbols from './.vitepress/theme/CanonicalSymbols.vue'
</script>

# Symbol library

These are the canonical SVG symbols used by nP schematics. Each drawing shows its terminal or connector numbering. Names above a drawing identify the constructors or drawing names that share it. Select a symbol to open the original SVG at full size.

RF terminal numbers follow the constructor's public port order. Signal-block connectors describe signal flow and are not RF ports. Source and device artwork listed separately has no numerical constructor; selecting that artwork does not create an electrical model.

`NJF` and `PJF` are implemented JFET constructors and drawing names, with terminals **1 gate, 2 drain, 3 source**. These numbers describe the drawing, not a physical package pinout. They work in schematic descriptions without a frequency grid:

```js
var description = {
    paths: ['1 right J1=NJF[1,2,3] 1 2 3']
};

var drawing = nP.schematic(description);
```

Use `PJF` for the P-channel symbol. `nP.NJF()` and `nP.PJF()` provide level-1 DC, RF, approximate noise and weak nonlinear analysis. See [JFET models](./diodes-and-active-components#jfet-transistors). Schematic descriptions select artwork without executing a numerical constructor.

`MESFET` and `HEMT` share the N-channel FET artwork and the same **gate/drain/source** terminal order. For example, `'1 right Q1=HEMT(HEMT)[1,2,3] 1 2 3'` labels a HEMT drawing. `nP.MESFET()` supplies SPICE reference and NE760 Statz/MES1 records. `nP.HEMT()` supplies the nominal ATF35143_DIE pHEMT adaptation, with distinct static gate charges and correlated noise; `model: 'ATF35143'` adds the SC-70 network with both external source pins common at port 3. Shared geometry does not select device material or a numerical model.

MOSFET artwork uses the same **1 gate, 2 drain, 3 source** order. Four-terminal drawings add **4 body**:

| Drawing names | Mode | Body connection |
| --- | --- | --- |
| `NMOS`, `PMOS` | Enhancement; broken channel | Internally tied to source |
| `NMOS4`, `PMOS4` | Enhancement; broken channel | Separate terminal 4 |
| `NMOSD`, `PMOSD` | Depletion; continuous channel | Internally tied to source |
| `NMOSD4`, `PMOSD4` | Depletion; continuous channel | Separate terminal 4 |

For example, `'1 right M1=NMOS4[1,2,3,4] 1 2 3 4'` preserves the independent body connection. Use the three-terminal artwork only when the body is tied to source. `nP.NMOS()` and `nP.PMOS()` now provide numerical enhancement models. Set `body: 'external'` for their four-terminal forms; NMOS4/PMOS4 remain drawing aliases, not constructor names. Depletion names remain artwork only. See [MOSFET models](./diodes-and-active-components#mosfet-transistors).

The current description layout rejects direct self-connections made by assigning the same node to two terminals on one component. Use the three-terminal symbol for an internal body/source tie; other requested self-connections remain a layout limitation.

Specialized diode artwork uses **1 anode, 2 cathode**:

| Drawing name | Distinguishing mark |
| --- | --- |
| `Schottky` | Hooked cathode bar |
| `Zener` | Angled cathode-bar ends |
| `Varactor` | Two parallel cathode plates |

A description path such as `'1 right D1=Varactor 2'` draws the symbol. These drawing aliases do not select numerical models. `D({model: 'SMS7621'})` and `D({model: 'SMS7630'})` now supply Schottky DC/RF/noise/weak nonlinear behavior and select the hooked-cathode artwork automatically. `D({model: 'SMV1231-079LF', qPoint: {vd: -3}})` supplies the varactor model and selects its artwork. `D({model: 'BZX384-B4V7', qPoint: {vd: -4.7}})` supplies the archived single-junction Zener record and selects its artwork; it excludes avalanche excess-noise and fitted breakdown-temperature behavior. The 1N4148 and legacy records retain ordinary diode artwork.

`NoiseDiode()` has its own **noise-diode.svg** symbol and gallery entry, with
**1 anode, 2 cathode**. Its geometry matches the Zener drawing, but the files
and symbol identities are independent. Its separate
avalanche/drift RF/noise research model does not change the ordinary `D()`
Zener equations and supplies no DC I-V or deterministic nonlinear fit.

`PIN()` has its own **pin-diode.svg** symbol and gallery entry, using ordinary
diode geometry with **1 anode, 2 cathode**. Its numerical model is a selected-region
DC/small-signal RF equivalent; see [PIN diode](./diodes-and-active-components#pin-diode).

HBT drawings reuse existing geometry with an instance caption; older PIN captions remain valid: `'1 right Q1=NPN(HBT)[1,2,3] 1 2 3'` (or `PNP`) and `'1 right D1=D(PIN) 2'`. HBT terminal order remains **base, collector, emitter**. These description captions do not select an HBT or PIN numerical model.

See [Schematics](./schematics.md) for drawing circuits and [RF constructors](./rf-constructors.md) for numerical component behavior.

<CanonicalSymbols />
