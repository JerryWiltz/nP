import {nPort} from '../nPort';
import {matrix} from '../../../np-math/src/matrix';
import {dim} from '../../../np-math/src/matrix';
import {dup} from '../../../np-math/src/matrix';
import {complex} from '../../../np-math/src/complex';
import {connectionModel} from '../intermod';
import {compatibleSignals, signalWithRows, applyInputSignal} from '../signal';

// Modified: 2026-10-26
var conjugate = function (value) { return complex(value.getR(), -value.getI()); };


export function nodal( ... componentConnections) { // componentConnections = [[nPort1, n1, n2 ...], ... ['out', n1, n2, ...] ]
	var signalOptions = !Array.isArray(componentConnections[componentConnections.length - 1]) ?
		componentConnections.pop() : undefined;
	var i = 0, j = 0, k = 0, row = 0, col = 0, offset = 0, base = 0;
	var networkSpars = componentConnections[0][0].spars.map(function (row) {
		return [row[0]];
	});
	var numOfFreqs = componentConnections[0][0].spars.length; // determine the number of frequency points
	var networkEntryCount = componentConnections.length;
	var m = networkEntryCount - 1; // Gupta's m: number of multiport components
	for (var componentIndex = 1; componentIndex < m; componentIndex++) {
		var componentSpars = componentConnections[componentIndex][0].spars;
		if (componentSpars.length !== numOfFreqs ||
			componentSpars.some(function (row, index) { return row[0] !== networkSpars[index][0]; })) {
			throw new RangeError('nodal components must have matching frequency rows.');
		}
	}
	var totalPortCount = function (connections) { // total component and external ports
		var size = 0;
		for (i = 0; i < networkEntryCount; i++) {
			size += connections[i].length - 1;
		}
		return size;
	}(componentConnections);
	var externalPortCount = componentConnections[networkEntryCount - 1].length - 1;
	var interconnectedPortCount = totalPortCount - externalPortCount;
	const GammaArray = function () {
		var connectionArray = dim(totalPortCount, totalPortCount, complex(0,0));
		var expanded = dim(totalPortCount, 3, 0);
		for (row = 0; row < totalPortCount; row++) {// put the b indices in the first column
			expanded[row][0] = row + 1;
		};	
		for(i = 0, offset = 0; i < networkEntryCount; i++) {// put node labels in the second column
			for( col = 0; col < componentConnections[i].length -1; col++) {
				expanded[offset][1] = componentConnections[i][col + 1];
				offset++;
			};
		};
		for (i = 0; i < totalPortCount; i++) {
			for (row = 0; row < totalPortCount; row++) { // put the connected a index in the third column
				if ( !(i === row) && (expanded[i][1] === expanded[row][1])   ) { //pivot row is not counted
					expanded[row][2] = expanded[i][0];
				};
			};
		};
		for (row = 0; row < totalPortCount; row++) { // put 1s for the interconnections
			connectionArray[row][expanded[row][2]-1] = complex(1,0);
		};	
		return connectionArray;
	}();
	var network = new nPort();
	var networkNoiseCovariance = [];
	var signalTemplate;
	for (var signalComponent = 0; signalComponent < m; signalComponent++) {
		signalTemplate = compatibleSignals(signalTemplate, componentConnections[signalComponent][0].signal);
	}
	var networkSignalRows = signalTemplate ? [] : undefined;
	for ( i = 0; i < numOfFreqs; i++) { // i is number of frequencies
		offset = 0;
		var WMatrix = matrix(dup(GammaArray));
		for ( j = 0; j < m; j++) { // insert each component's negative S-matrix into W
			for ( k = 0; k < (componentConnections[j].length - 1)**2; k++){
				base = componentConnections[j].length - 1;
				WMatrix.m[offset + Math.floor(k/base)][offset + k % base] = componentConnections[j][0].spars[i][1 + k].neg();
			}
			offset += base;
		};
		var Winverse = WMatrix.invertCplx();
		for ( j = 0; j < externalPortCount; j++) {
			for ( k = 0; k < externalPortCount; k++) {
				networkSpars[i].push(Winverse.m[interconnectedPortCount +j][interconnectedPortCount + k]);
			};
		};

		// Each component noise-wave entry is a source column in the same
		// linear system.  Keep this propagation internal to nodal().
		var Cnoise = dim(interconnectedPortCount, interconnectedPortCount, complex(0, 0));
		var covarianceOffset = 0;
		for (var component = 0; component < m; component++) {
			var componentPortCount = componentConnections[component].length - 1;
			var componentNoise = componentConnections[component][0].noise;
			if (componentNoise && componentNoise[i] && componentNoise[i].C) {
				for (var covarianceRow = 0; covarianceRow < componentPortCount; covarianceRow++) {
					for (var covarianceCol = 0; covarianceCol < componentPortCount; covarianceCol++) {
						Cnoise[covarianceOffset + covarianceRow][covarianceOffset + covarianceCol] = componentNoise[i].C[covarianceRow][covarianceCol];
					}
				}
			}
			covarianceOffset += componentPortCount;
		}
		var Cout = [];
		for (j = 0; j < externalPortCount; j++) {
			Cout[j] = [];
			for (k = 0; k < externalPortCount; k++) {
				var sum = complex(0, 0);
				for (var sourceRow = 0; sourceRow < interconnectedPortCount; sourceRow++) {
					for (var sourceCol = 0; sourceCol < interconnectedPortCount; sourceCol++) {
						var transfer = Winverse.m[interconnectedPortCount +j][sourceRow];
						var transferConjugate = conjugate(Winverse.m[interconnectedPortCount +k][sourceCol]);
						sum = sum.add(transfer.mul(Cnoise[sourceRow][sourceCol]).mul(transferConjugate));
					}
				}
				Cout[j][k] = sum;
			};
		};
		networkNoiseCovariance[i] = {frequency: networkSpars[i][0], C: Cout};
		if (networkSignalRows) {
			var componentWaves = Array.from({length: interconnectedPortCount}, function () {
				return complex(0, 0);
			});
			var signalOffset = 0;
			for (var signalChild = 0; signalChild < m; signalChild++) {
				var childPortCount = componentConnections[signalChild].length - 1;
				var childSignal = componentConnections[signalChild][0].signal;
				if (childSignal) {
					for (var childPort = 0; childPort < childPortCount; childPort++) {
						componentWaves[signalOffset + childPort] = childSignal.rows[i].waves[childPort];
					}
				}
				signalOffset += childPortCount;
			}
			var externalWaves = [];
			for (var externalPort = 0; externalPort < externalPortCount; externalPort++) {
				var totalWave = complex(0, 0);
				for (var sourcePort = 0; sourcePort < interconnectedPortCount; sourcePort++) {
					totalWave = totalWave.add(Winverse.m[interconnectedPortCount + externalPort][sourcePort]
						.mul(componentWaves[sourcePort]));
				}
				externalWaves[externalPort] = totalWave;
			}
			networkSignalRows[i] = {frequency: networkSpars[i][0], waves: externalWaves};
		}

	};
	network.setspars(networkSpars);
	network.setglobal(componentConnections[0][0].global); // use the first component for global data
	network.noise = networkNoiseCovariance;
	if (networkSignalRows) network.signal = signalWithRows(signalTemplate, networkSignalRows);
	var displayComponent = componentConnections.slice(0, m).find(function (entry) {
		return entry[0]._displayFrequencies;
	});
	network._displayFrequencies = displayComponent && displayComponent[0]._displayFrequencies;
	network._intermod = connectionModel(
		componentConnections.slice(0, m).map(function (entry) { return entry[0]; }),
		GammaArray.map(function (connectionRow) {
			return connectionRow.findIndex(function (value) { return value.getR() === 1; });
		})
	);
	network._schematic = {
		kind: 'nodal',
		components: componentConnections.slice(0, m).map(function (entry) {
			return {part: entry[0]._schematic, nodes: entry.slice(1)};
		}),
		externalNodes: componentConnections[m].slice(1)
	};
	return applyInputSignal(network, signalOptions);
};
