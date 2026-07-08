// Modified: 2026-07-03
import test from 'node:test';
import assert from 'node:assert/strict';

import { global } from '../src/np-global/index.js';
import { seR, Open, Short, Load, Shift90, Tlin, Tclin, cascade, trf, mlin, mclin, mtee, mcross, mstep, mbend, mtfr, mvgnd, mvia } from '../src/np-nport/index.js';

const closeTo = (actual, expected, tolerance = 1e-12) => {
	assert.ok(
		Math.abs(actual - expected) <= tolerance,
		`${actual} not within ${tolerance} of ${expected}`
	);
};

const withGlobal = (settings, fn) => {
	const previous = {
		fList: global.fList,
		Ro: global.Ro,
		Temp: global.Temp
	};

	global.fList = settings.fList ?? previous.fList;
	global.Ro = settings.Ro ?? previous.Ro;
	global.Temp = settings.Temp ?? previous.Temp;

	try {
		return fn();
	} finally {
		global.fList = previous.fList;
		global.Ro = previous.Ro;
		global.Temp = previous.Temp;
	}
};

test('Open, Short, and Load create expected one-port reflection coefficients', () => {
	withGlobal({ fList: [1e9], Ro: 50 }, () => {
		closeTo(Open().getspars()[0][1].getR(), 1);
		closeTo(Open().getspars()[0][1].getI(), 0);

		closeTo(Short().getspars()[0][1].getR(), -1);
		closeTo(Short().getspars()[0][1].getI(), 0);

		closeTo(Load().getspars()[0][1].getR(), 0);
		closeTo(Load().getspars()[0][1].getI(), 0);
	});
});

test('Shift90 creates a matched lossless two-port with +90 degree through phase', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const spars = Shift90().getspars();

		assert.equal(spars.length, 2);

		for (const row of spars) {
			assert.equal(row.length, 5);

			closeTo(row[1].getR(), 0);
			closeTo(row[1].getI(), 0);
			closeTo(row[2].getR(), 0);
			closeTo(row[2].getI(), 1);
			closeTo(row[3].getR(), 0);
			closeTo(row[3].getI(), 1);
			closeTo(row[4].getR(), 0);
			closeTo(row[4].getI(), 0);
		}
	});
});

test('Tlin and Tclin expose ideal transmission line constructors', () => {
	withGlobal({ fList: [1e9], Ro: 50 }, () => {
		assert.equal(Tlin().getspars()[0].length, 5);
		assert.equal(Tclin().getspars()[0].length, 17);
	});
});

test('series resistor at 50 ohms has expected two-port S-parameters with 50 ohm reference', () => {
	withGlobal({ fList: [1e9], Ro: 50 }, () => {
		const spars = seR(50).getspars()[0];

		assert.equal(spars[0], 1e9);
		closeTo(spars[1].getR(), 1 / 3);
		closeTo(spars[1].getI(), 0);
		closeTo(spars[2].getR(), 2 / 3);
		closeTo(spars[2].getI(), 0);
		closeTo(spars[3].getR(), 2 / 3);
		closeTo(spars[3].getI(), 0);
		closeTo(spars[4].getR(), 1 / 3);
		closeTo(spars[4].getI(), 0);
	});
});

test('method cascade and cascade helper agree for simple two-port chains', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const r1 = seR(25);
		const r2 = seR(75);

		const method = r1.cas(r2).getspars();
		const helper = cascade(seR(25), seR(75)).getspars();

		assert.equal(method.length, helper.length);

		for (let row = 0; row < method.length; row++) {
			assert.equal(method[row][0], helper[row][0]);
			for (let col = 1; col < method[row].length; col++) {
				closeTo(method[row][col].getR(), helper[row][col].getR());
				closeTo(method[row][col].getI(), helper[row][col].getI());
			}
		}
	});
});

test('inverse ideal transformers cascade to a matched lossless through', () => {
	withGlobal({ fList: [1e9], Ro: 50 }, () => {
		const ratioHL = Math.sqrt(70.7 / 50);
		const ratioLH = Math.sqrt(50 / 70.7);
		const spars = cascade(trf(ratioHL), trf(ratioLH)).getspars()[0];

		closeTo(spars[1].getR(), 0);
		closeTo(spars[1].getI(), 0);
		closeTo(spars[2].getR(), 1);
		closeTo(spars[2].getI(), 0);
		closeTo(spars[3].getR(), 1);
		closeTo(spars[3].getI(), 0);
		closeTo(spars[4].getR(), 0);
		closeTo(spars[4].getI(), 0);
	});
});

test('mclin creates a finite reciprocal four-port coupled microstrip line', () => {
	withGlobal({ fList: [2e9, 10e9, 18e9], Ro: 50 }, () => {
		const coupledLine = mclin(
			0.020 * 0.0254,
			0.0025 * 0.0254,
			0.025 * 0.0254,
			0.0 * 0.0254,
			0.300 * 0.0254,
			9.9,
			1,
			0.001
		);
		const spars = coupledLine.getspars();

		assert.equal(spars.length, 3);
		assert.equal(spars[0].length, 17);

		for (const row of spars) {
			for (let col = 1; col < row.length; col++) {
				assert.ok(Number.isFinite(row[col].getR()));
				assert.ok(Number.isFinite(row[col].getI()));
			}

			closeTo(row[2].getR(), row[5].getR());
			closeTo(row[2].getI(), row[5].getI());
			closeTo(row[4].getR(), row[13].getR());
			closeTo(row[4].getI(), row[13].getI());
		}

		const out = coupledLine.out('s21dB', 's41dB', 's11dB', 's31dB');
		closeTo(out[1][1], -0.5176381460041771);
		closeTo(out[1][2], -9.637289796048867);
		closeTo(out[2][1], -0.8721613492986204);
		closeTo(out[2][2], -9.537713381356786);

		assert.ok(Number.isFinite(coupledLine.microstrip.Zoe));
		assert.ok(Number.isFinite(coupledLine.microstrip.Zoo));
		assert.ok(Number.isFinite(coupledLine.microstrip.ereoe));
		assert.ok(Number.isFinite(coupledLine.microstrip.ereoo));
		assert.ok(coupledLine.microstrip.Zoe > coupledLine.microstrip.Zoo);
		assert.equal(coupledLine.microstrip.dispersion.length, 3);
		assert.equal(coupledLine.microstrip.dispersion[0].frequency, 2e9);
		assert.equal(coupledLine.microstrip.dispersion[2].frequency, 18e9);
		assert.ok(coupledLine.microstrip.dispersion[2].Zoe > coupledLine.microstrip.dispersion[0].Zoe);
		assert.ok(coupledLine.microstrip.dispersion[2].ereoe > coupledLine.microstrip.dispersion[0].ereoe);
	});
});

test('mclin default geometry matches a known coupled microstrip calculator case', () => {
	withGlobal({ fList: [1.8e9], Ro: 50 }, () => {
		const coupledLine = mclin();

		closeTo(coupledLine.microstrip.Zoe, 72.25036995770157);
		closeTo(coupledLine.microstrip.Zoo, 34.59185454255114);
		closeTo(coupledLine.microstrip.ereoe, 7.112784879904657);
		closeTo(coupledLine.microstrip.ereoo, 5.672289633106345);
	});
});

test('mclin loss parameters reduce through magnitude', () => {
	withGlobal({ fList: [10e9], Ro: 50 }, () => {
		const lossless = mclin(
			0.020 * 0.0254,
			0.0025 * 0.0254,
			0.025 * 0.0254,
			1.0e-3 * 0.0254,
			0.300 * 0.0254,
			9.9,
			0,
			0
		);
		const lossy = mclin(
			0.020 * 0.0254,
			0.0025 * 0.0254,
			0.025 * 0.0254,
			1.0e-3 * 0.0254,
			0.300 * 0.0254,
			9.9,
			1,
			0.001
		);

		const losslessOut = lossless.out('s21dB');
		const lossyOut = lossy.out('s21dB');

		assert.ok(lossyOut[1][1] < losslessOut[1][1]);
	});
});

test('mlin roughness increases conductor loss', () => {
	withGlobal({ fList: [10e9], Ro: 50 }, () => {
		const smooth = mlin(
			0.023 * 0.0254,
			0.025 * 0.0254,
			0.5 * 0.0254,
			1.0e-3 * 0.0254,
			10,
			1,
			0.001,
			0
		);
		const rough = mlin(
			0.023 * 0.0254,
			0.025 * 0.0254,
			0.5 * 0.0254,
			1.0e-3 * 0.0254,
			10,
			1,
			0.001,
			2.0e-6
		);

		assert.equal(smooth.microstrip.roughnessRms, 0);
		closeTo(rough.microstrip.roughnessRms, 2.0e-6);
		assert.ok(rough.microstrip.analysis[0].conductorLossDbPerMeter > smooth.microstrip.analysis[0].conductorLossDbPerMeter);
		assert.ok(rough.out('s21dB')[1][1] < smooth.out('s21dB')[1][1]);
	});
});

test('mlin default geometry exposes Hammerstad Jensen style diagnostics', () => {
	withGlobal({ fList: [10e9], Ro: 50 }, () => {
		const line = mlin();

		closeTo(line.microstrip.Z, 51.26004376289776);
		closeTo(line.microstrip.ere, 7.009861180706938);
		closeTo(line.microstrip.ZQuasiStatic, 50.80674831133571);
		closeTo(line.microstrip.ereQuasiStatic, 6.66084124751819);
		assert.equal(line.microstrip.analysis.length, 1);
		closeTo(line.microstrip.analysis[0].frequency, 10e9);
		assert.ok(line.microstrip.analysis[0].conductorLossDbPerMeter > 0);
		assert.ok(line.microstrip.analysis[0].dielectricLossDbPerMeter > 0);
	});
});

test('default microstrip constructors create finite n-port objects', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const line = mlin();
		const coupledLine = mclin();
		const tee = mtee();

		assert.equal(line.getspars().length, 2);
		assert.equal(line.getspars()[0].length, 5);
		assert.equal(line.microstrip.roughnessRms, 0);

		assert.equal(coupledLine.getspars().length, 2);
		assert.equal(coupledLine.getspars()[0].length, 17);
		closeTo(coupledLine.microstrip.Width, 19.1155 * 0.001 * 0.0254);
		closeTo(coupledLine.microstrip.Space, 5.82185 * 0.001 * 0.0254);
		closeTo(coupledLine.microstrip.Height, 25 * 0.001 * 0.0254);
		closeTo(coupledLine.microstrip.Thickness, 0.0000125 * 0.0254);
		closeTo(coupledLine.microstrip.Length, 719.794 * 0.001 * 0.0254);
		assert.equal(coupledLine.microstrip.er, 10);
		assert.equal(coupledLine.microstrip.rho, 1);
		assert.equal(coupledLine.microstrip.tand, 0.001);

		assert.equal(tee.getspars().length, 2);
		assert.equal(tee.getspars()[0].length, 10);
		assert.ok(Number.isFinite(tee.Ct));
		closeTo(tee.microstrip.commonWidth, 0.023 * 0.0254);
		closeTo(tee.microstrip.branch1Width, 0.023 * 0.0254);
		closeTo(tee.microstrip.branch2Width, 0.023 * 0.0254);
		closeTo(tee.microstrip.Height, 0.025 * 0.0254);
		closeTo(tee.microstrip.Thickness, 0.0000125 * 0.0254);
		assert.equal(tee.microstrip.er, 10);
		assert.equal(tee.microstrip.rho, 1);
		assert.equal(tee.microstrip.tand, 0.001);
		assert.equal(tee.microstrip.roughnessRms, 0);
		assert.equal(tee.microstrip.analysis.length, 2);
		closeTo(tee.microstrip.commonArm.Z, 50.80674831133571);
		closeTo(tee.microstrip.commonArm.ere, 6.66084124751819);
		closeTo(tee.microstrip.Ct, tee.Ct);
		closeTo(tee.microstrip.analysis[0].R, 1);
		closeTo(tee.microstrip.analysis[0].Q, 0.0009763030970527234);
		closeTo(tee.microstrip.analysis[0].da, 0.00010021500592968646);
		closeTo(tee.microstrip.analysis[0].db, 0.00010021500592968646);
		closeTo(tee.microstrip.analysis[0].d2, 0.000563084028445046);
		closeTo(tee.microstrip.analysis[0].Ta2, 0.9996318411080485);
		closeTo(tee.microstrip.analysis[0].Tb2, 0.9996318411080485);
		closeTo(tee.microstrip.analysis[0].na, 0.9998159036082835);
		closeTo(tee.microstrip.analysis[0].nb, 0.9998159036082835);
		closeTo(tee.microstrip.analysis[0].BT, -0.00006255957028808236);
		assert.match(tee.microstrip.source, /Edwards\/Steer section 9\.6\.1/);
		assert.match(tee.microstrip.validity.limitations, /impedance ratio exceeds about 2/);

		for (const network of [line, coupledLine, tee]) {
			for (const row of network.getspars()) {
				for (let col = 1; col < row.length; col++) {
					assert.ok(Number.isFinite(row[col].getR()));
					assert.ok(Number.isFinite(row[col].getI()));
				}
			}
		}
	});
});

test('mtee accepts power-divider-style width names', () => {
	withGlobal({ fList: [1e9], Ro: 50 }, () => {
		const tee = mtee({
			commonWidth: 0.030 * 0.0254,
			branch1Width: 0.020 * 0.0254,
			branch2Width: 0.025 * 0.0254,
			Height: 0.025 * 0.0254,
			Thickness: 0.0000125 * 0.0254,
			er: 10,
			rho: 0,
			tand: 0
		});

		assert.equal(tee.getspars()[0].length, 10);
		closeTo(tee.microstrip.commonWidth, 0.030 * 0.0254);
		closeTo(tee.microstrip.branch1Width, 0.020 * 0.0254);
		closeTo(tee.microstrip.branch2Width, 0.025 * 0.0254);

		for (let col = 1; col < tee.getspars()[0].length; col++) {
			assert.ok(Number.isFinite(tee.getspars()[0][col].getR()));
			assert.ok(Number.isFinite(tee.getspars()[0][col].getI()));
		}
	});
});

test('mcross matches pinned QUCS microstrip cross equation outputs', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const cross = mcross();

		assert.equal(cross.getspars().length, 2);
		assert.equal(cross.getspars()[0].length, 17);
		closeTo(cross.microstrip.leftWidth, 0.023 * 0.0254);
		closeTo(cross.microstrip.topWidth, 0.023 * 0.0254);
		closeTo(cross.microstrip.rightWidth, 0.023 * 0.0254);
		closeTo(cross.microstrip.bottomWidth, 0.023 * 0.0254);
		closeTo(cross.microstrip.Height, 0.025 * 0.0254);
		closeTo(cross.microstrip.Thickness, 0.0000125 * 0.0254);
		assert.equal(cross.microstrip.er, 10);
		assert.equal(cross.microstrip.rho, 1);
		assert.equal(cross.microstrip.tand, 0.001);
		assert.equal(cross.microstrip.roughnessRms, 0);
		assert.equal(cross.microstrip.analysis.length, 2);
		closeTo(cross.microstrip.leftArm.Z, 50.80674831133571);
		closeTo(cross.microstrip.leftArm.ere, 6.66084124751819);
		closeTo(cross.microstrip.Ct, cross.Ct);
		assert.equal(cross.microstrip.armCaps.length, 4);
		assert.equal(cross.microstrip.armInds.length, 4);
		closeTo(cross.microstrip.Ct, -2.889780775500356e-14);
		closeTo(cross.microstrip.Lcenter, -1.74771255961485e-10);
		closeTo(cross.microstrip.armCaps[0], -7.22445193875089e-15);
		closeTo(cross.microstrip.armInds[0], 9.503576111752356e-11);
		assert.match(cross.microstrip.source, /Edwards\/Steer section 9\.6\.3/);
		assert.match(cross.microstrip.validity.limitations, /weak theory\/experiment agreement/);
		assert.ok(cross.microstrip.analysis[0].armCaps.every(Number.isFinite));
		assert.ok(cross.microstrip.analysis[0].armInds.every(Number.isFinite));
		assert.ok(Number.isFinite(cross.microstrip.analysis[0].Lcenter));

		for (const row of cross.getspars()) {
			for (let col = 1; col < row.length; col++) {
				assert.ok(Number.isFinite(row[col].getR()));
				assert.ok(Number.isFinite(row[col].getI()));
			}
		}
	});
});

test('mstep matches pinned QUCS impedance step equation outputs', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const step = mstep();

		assert.equal(step.getspars().length, 2);
		assert.equal(step.getspars()[0].length, 5);
		closeTo(step.microstrip.width1, 0.046 * 0.0254);
		closeTo(step.microstrip.width2, 0.023 * 0.0254);
		closeTo(step.microstrip.Height, 0.025 * 0.0254);
		closeTo(step.microstrip.Thickness, 0.0000125 * 0.0254);
		assert.equal(step.microstrip.er, 10);
		assert.equal(step.microstrip.rho, 1);
		assert.equal(step.microstrip.tand, 0.001);
		assert.equal(step.microstrip.roughnessRms, 0);
		assert.equal(step.microstrip.analysis.length, 2);
		closeTo(step.microstrip.CsPf, 0.007510008588927712);
		closeTo(step.microstrip.capacitancePerRootWidth, 9.09);
		assert.equal(step.microstrip.capacitanceEquation, 'Edwards/Steer 9.32, Garg/Bahl slight step capacitance');
		closeTo(step.microstrip.LsNh, 0.011507946456502898);
		closeTo(step.microstrip.L1Nh, 0.004783294294823262);
		closeTo(step.microstrip.L2Nh, 0.006724652161679638);
		assert.match(step.microstrip.validity.source, /Edwards\/Steer section 9\.4/);

		for (const row of step.getspars()) {
			for (let col = 1; col < row.length; col++) {
				assert.ok(Number.isFinite(row[col].getR()));
				assert.ok(Number.isFinite(row[col].getI()));
			}
		}
	});
});

test('mstep uses Edwards/Steer large step capacitance branch for er 9.6', () => {
	withGlobal({ fList: [1e9], Ro: 50 }, () => {
		const step = mstep({
			width1: 0.092 * 0.0254,
			width2: 0.023 * 0.0254,
			er: 9.6
		});

		closeTo(step.microstrip.CsPf, 0.040038496202786863);
		closeTo(step.microstrip.capacitancePerRootWidth, 34.26779887263511);
		assert.equal(step.microstrip.capacitanceEquation, 'Edwards/Steer 9.33, Garg/Bahl large step capacitance');
		assert.match(step.microstrip.validity.capacitanceRatio, /3\.5 <=/);
	});
});

test('mbend matches pinned Edwards/Steer bend equation outputs', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const bend = mbend();

		assert.equal(bend.getspars().length, 2);
		assert.equal(bend.getspars()[0].length, 5);
		closeTo(bend.microstrip.Width, 0.023 * 0.0254);
		closeTo(bend.microstrip.Height, 0.025 * 0.0254);
		closeTo(bend.microstrip.Thickness, 0.0000125 * 0.0254);
		closeTo(bend.microstrip.miterLength, 0);
		closeTo(bend.microstrip.miterFraction, 0);
		closeTo(bend.microstrip.recommendedMiterLength, 0.0004957101378830173);
		closeTo(bend.microstrip.recommendedMiterFraction, 0.6);
		assert.equal(bend.microstrip.er, 10);
		assert.equal(bend.microstrip.rho, 1);
		assert.equal(bend.microstrip.tand, 0.001);
		assert.equal(bend.microstrip.roughnessRms, 0);
		assert.equal(bend.microstrip.analysis.length, 2);
		closeTo(bend.microstrip.CpF, 0.07567702247999389);
		closeTo(bend.microstrip.LnH, -0.023706758615713867);
		closeTo(bend.microstrip.equivalent.CpF, bend.microstrip.CpF);
		closeTo(bend.microstrip.equivalent.LnH, bend.microstrip.LnH);

		for (const row of bend.getspars()) {
			for (let col = 1; col < row.length; col++) {
				assert.ok(Number.isFinite(row[col].getR()));
				assert.ok(Number.isFinite(row[col].getI()));
			}
		}
	});

	withGlobal({ fList: [10e9], Ro: 50 }, () => {
		const bend = mbend({ Width: 0.75e-3, Height: 0.5e-3, er: 9.9 });

		closeTo(bend.microstrip.CpF, 0.1510725);
		closeTo(bend.microstrip.LnH, 0.03444897427831779);
	});
});

test('mtfr creates a distributed finite two-port film resistor from sheet resistance', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50, Temp: 25 }, () => {
		const resistor = mtfr();

		assert.equal(resistor.getspars().length, 2);
		assert.equal(resistor.getspars()[0].length, 5);
		assert.equal(resistor.filmResistor.ohmsPerSquare, 50);
		closeTo(resistor.filmResistor.Width, 10 * 0.001 * 0.0254);
		closeTo(resistor.filmResistor.Length, 10 * 0.001 * 0.0254);
		closeTo(resistor.filmResistor.squares, 1);
		closeTo(resistor.filmResistor.resistanceAtReference, 50);
		closeTo(resistor.filmResistor.resistance, 50);
		assert.equal(resistor.filmResistor.sections, 10);
		assert.equal(resistor.filmResistor.automaticSections, 10);
		closeTo(resistor.filmResistor.resistancePerSection, 5);
		closeTo(resistor.filmResistor.halfLineLength, 0.5 * 0.001 * 0.0254);
		assert.match(resistor.filmResistor.model, /distributed/);

		const longResistor = mtfr({
			Width: 10 * 0.001 * 0.0254,
			Length: 50 * 0.001 * 0.0254
		});
		assert.equal(longResistor.filmResistor.squares, 5);
		assert.equal(longResistor.filmResistor.sections, 50);
		assert.equal(longResistor.filmResistor.automaticSections, 50);

		const overrideResistor = mtfr({
			Width: 10 * 0.001 * 0.0254,
			Length: 50 * 0.001 * 0.0254,
			sections: 12
		});
		assert.equal(overrideResistor.filmResistor.sections, 12);
		assert.equal(overrideResistor.filmResistor.automaticSections, 50);

		for (const row of resistor.getspars()) {
			for (let col = 1; col < row.length; col++) {
				assert.ok(Number.isFinite(row[col].getR()));
				assert.ok(Number.isFinite(row[col].getI()));
			}
		}
	});
});

test('mvgnd matches pinned QUCS Goldfarb/Pucel via equation outputs', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const via = mvgnd();

		assert.equal(via.getspars().length, 2);
		assert.equal(via.getspars()[0].length, 2);
		closeTo(via.microstrip.Diameter, 100e-6);
		closeTo(via.microstrip.Height, 0.025 * 0.0254);
		closeTo(via.microstrip.Thickness, 0.0000125 * 0.0254);
		closeTo(via.microstrip.rho, 1.72e-8);
		closeTo(via.microstrip.Rdc, 0.10984736623502148);
		closeTo(via.microstrip.L, 2.349199007351922e-10);
		closeTo(via.microstrip.fdelta, 43219650533.77667);
		closeTo(via.microstrip.analysis[0].R, 0.11111090272099025);
		closeTo(via.microstrip.analysis[0].X, 1.4760452686634467);

		for (const row of via.getspars()) {
			assert.ok(Number.isFinite(row[1].getR()));
			assert.ok(Number.isFinite(row[1].getI()));
		}
	});
});

test('mvia creates a finite two-port multilayer via barrel', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const via = mvia();

		assert.equal(via.getspars().length, 2);
		assert.equal(via.getspars()[0].length, 5);
		closeTo(via.microstrip.Diameter, 100e-6);
		closeTo(via.microstrip.connectionHeight, 0.025 * 0.0254);
		closeTo(via.microstrip.Thickness, 0.0000125 * 0.0254);
		closeTo(via.microstrip.rho, 1.72e-8);
		closeTo(via.microstrip.er, 10);
		closeTo(via.microstrip.Rdc, 0.10984736623502148);
		closeTo(via.microstrip.Lbarrel, 2.349199007351922e-10);
		closeTo(via.microstrip.fdelta, 43219650533.77667);
		closeTo(via.microstrip.analysis[0].R, 0.11111090272099025);
		closeTo(via.microstrip.analysis[0].X, 1.4760452686634467);
		closeTo(via.out('s11Re', 's21Re')[1][1], 0.0013269749786874842);
		closeTo(via.out('s11Re', 's21Re')[1][2], 0.9986730250213127);

		const multilayer = mvia({
			padDiameter: 200e-6,
			antipadDiameter: 500e-6,
			topPadHeight: 0.1e-3,
			bottomPadHeight: 0.1e-3,
			topStubLength: 0.2e-3
		});
		closeTo(multilayer.microstrip.topPadCapacitance, 6.071490288349174e-14);
		closeTo(multilayer.microstrip.bottomPadCapacitance, 6.071490288349174e-14);
		closeTo(multilayer.microstrip.topStubCapacitance, 6.913283497173839e-14);
		closeTo(multilayer.microstrip.bottomStubCapacitance, 0);

		for (const network of [via, multilayer]) {
			for (const row of network.getspars()) {
				for (let col = 1; col < row.length; col++) {
					assert.ok(Number.isFinite(row[col].getR()));
					assert.ok(Number.isFinite(row[col].getI()));
				}
			}
		}
	});
});
