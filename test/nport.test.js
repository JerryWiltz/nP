// Modified: 2026-06-30
import test from 'node:test';
import assert from 'node:assert/strict';

import { global } from '../src/np-global/index.js';
import { seR, Open, Short, Load, shift90, cascade, trf, mlin, mclin, mtee } from '../src/np-nport/index.js';

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

test('shift90 creates a matched lossless two-port with +90 degree through phase', () => {
	withGlobal({ fList: [1e9, 2e9], Ro: 50 }, () => {
		const spars = shift90().getspars();

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
		assert.equal(tee.microstrip.rho, 0);
		assert.equal(tee.microstrip.tand, 0);

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
