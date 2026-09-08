import {nPort} from '../nPort';
import {matrix} from '../../../np-math/src/matrix';
import {dim} from '../../../np-math/src/matrix';
import {dup} from '../../../np-math/src/matrix';
import {complex} from '../../../np-math/src/complex';

// Modified: 2026-09-08
var conjugate = function (value) { return complex(value.getR(), -value.getI()); };


export function nodal( ... nPortsAndNodes) { //nPortsAndNodes = [[nPort1, n1, n2 ...], [nPort2, n1, n2 ...], ... ['out', n1, nn2, ...] ]
	var i = 0, j = 0, k = 0, m = 0, row = 0, col = 0, nPortCount = 0, offset = 0, base = 0;
	var spars = function () { // creates spars table with frequencies only [ [freq1], [freq2], ... [freqN] ]
		var sparsLength = nPortsAndNodes[0][0].global.fList.length; // use the first nPort for global data
		var sparsArray = dim(sparsLength,1,1)
		for (i = 0; i< sparsLength; i++) {
			sparsArray[i][0] = nPortsAndNodes[0][0].global.fList[i];
		}
		return sparsArray;
	}();
	var numOfFreqs = nPortsAndNodes[0][0].spars.length; //determine the number of iterations based on number of frequencies
	var numOfnPorts = nPortsAndNodes.length;
	var numOfComponents = numOfnPorts - 1;
	var rowCol = function (nPortsAndNodes) { //determine the number of rows and columns
		var size = 0;
		for (i = 0; i < numOfnPorts; i++) { 
			//size += Math.sqrt(nPortsAndNodes[i][0].spars[0].length -1);
			size += nPortsAndNodes[i].length -1;
		}
		//return size + nPortsAndNodes[numOfnPorts-1].length - 1;
		return size;
	}(nPortsAndNodes);	
	var outputPortCount = nPortsAndNodes[numOfnPorts - 1].length - 1;
	var componentPortCount = rowCol - outputPortCount;
	var zeroArray = function () { return dim(rowCol, rowCol, complex(0,0)); }();
	const gammaArray = function () {
		var outArray = dim(rowCol, rowCol, complex(0,0));
		var outArrayReal = dim(rowCol, rowCol, 0); // for testing hookup
		var expanded = dim(rowCol, 3, 0);
		for (row = 0; row < rowCol; row++) {//put the b's here in the first column 
			expanded[row][0] = row + 1;
		};	
		for(i = 0, offset = 0; i < numOfnPorts; i++) {//put the nodes here in the second column
			for( col = 0; col < nPortsAndNodes[i].length -1; col++) {
				expanded[offset][1] = nPortsAndNodes[i][col + 1];
				offset++;
			};
		};
		for (i = 0; i < rowCol; i++) {
			for (row = 0; row < rowCol; row++) { // put the a's in the 3rd column
				if ( !(i === row) && (expanded[i][1] === expanded[row][1])   ) { //pivot row is not counted
					expanded[row][2] = expanded[i][0];
				};
			};
		};
		for (row = 0; row < rowCol; row++) { // put 1's for the interconnects
			outArray[row][expanded[row][2]-1] = complex(1,0);
			outArrayReal[row][expanded[row][2]-1] = 1;
		};	
		return outArray;
	}();
	var gammaMatrix = matrix(gammaArray);
	var nodalOut = new nPort();
	var noiseCovariance = [];
	for ( i = 0; i < numOfFreqs; i++) { // i is number of frequencies
		offset = 0;
		gammaMatrix.m = dup(gammaArray);
		for ( j = 0; j < nPortsAndNodes.length - 1; j++) { // j is the number of the current nPort except the last one
			for ( k = 0; k < (nPortsAndNodes[j].length - 1)**2; k++){ // k is the the port number squared
				base = nPortsAndNodes[j].length - 1;
				gammaMatrix.m[offset + Math.floor(k/base)][offset + k % base] = nPortsAndNodes[j][0].spars[i][1 + k].neg();
			}
			offset += base;
		};
		var solvedMatrix = gammaMatrix.invertCplx();
		for ( j = 0; j < outputPortCount; j++) { //
			for ( k = 0; k < outputPortCount; k++) {
				spars[i].push(solvedMatrix.m[componentPortCount +j][componentPortCount + k]);
			};
		};

		// Each component noise-wave entry is a source column in the same
		// linear system.  Keep this propagation internal to nodal().
		var componentCovariance = dim(componentPortCount, componentPortCount, complex(0, 0));
		var covarianceOffset = 0;
		for (var component = 0; component < numOfComponents; component++) {
			var componentPorts = nPortsAndNodes[component].length - 1;
			var componentNoise = nPortsAndNodes[component][0].noise;
			if (componentNoise && componentNoise[i] && componentNoise[i].C) {
				for (var covarianceRow = 0; covarianceRow < componentPorts; covarianceRow++) {
					for (var covarianceCol = 0; covarianceCol < componentPorts; covarianceCol++) {
						componentCovariance[covarianceOffset + covarianceRow][covarianceOffset + covarianceCol] = componentNoise[i].C[covarianceRow][covarianceCol];
					}
				}
			}
			covarianceOffset += componentPorts;
		}
		var outputNoise = [];
		for (j = 0; j < outputPortCount; j++) {
			outputNoise[j] = [];
			for (k = 0; k < outputPortCount; k++) {
				var sum = complex(0, 0);
				for (var sourceRow = 0; sourceRow < componentPortCount; sourceRow++) {
					for (var sourceCol = 0; sourceCol < componentPortCount; sourceCol++) {
						var transfer = solvedMatrix.m[componentPortCount +j][sourceRow];
						var transferConjugate = conjugate(solvedMatrix.m[componentPortCount +k][sourceCol]);
						sum = sum.add(transfer.mul(componentCovariance[sourceRow][sourceCol]).mul(transferConjugate));
					}
				}
				outputNoise[j][k] = sum;
			};
		};
		noiseCovariance[i] = {frequency: spars[i][0], C: outputNoise};

	};
	nodalOut.setspars(spars);
	nodalOut.setglobal(nPortsAndNodes[0][0].global); // use the first nPort for global data
	nodalOut.noise = {covariance: noiseCovariance};
	return nodalOut;
};
