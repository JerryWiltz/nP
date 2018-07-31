import {nPort} from '../nPort';
import {matrix} from '../../../np-math/src/matrix';
import {dim} from '../../../np-math/src/matrix';
import {complex} from '../../../np-math/src/complex';


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
	var rowCol = function (nPortsAndNodes) { //determine the number of rows and columns
		var size = 0;
		for (i = 0; i < numOfnPorts; i++) { 
			//size += Math.sqrt(nPortsAndNodes[i][0].spars[0].length -1);
			size += nPortsAndNodes[i].length -1;
		}
		//return size + nPortsAndNodes[numOfnPorts-1].length - 1;
		return size;
	}(nPortsAndNodes);	
	var zeroArray = function () { return dim(rowCol, rowCol, complex(0,0)); }();
	var gammaArray = function () {
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
	var abcArray = function () { return dim(rowCol, 1, complex(0,0)); }();
	var aMatrix = matrix(abcArray);
	var bMatrix = matrix(abcArray);
	var cMatrix = matrix(abcArray);
	var gammaMatrix = matrix(gammaArray);
	var nodalOut = new nPort();
	for ( i = 0; i < 1; i++) { // i is number of frequencies
		offset = 0;
		gammaMatrix.m = gammaArray;
		for ( j = 0; j < nPortsAndNodes.length - 1; j++) { // j is the number of the current nPort except the last one
			for ( k = 0; k < (nPortsAndNodes[j].length - 1)**2; k++){ // k is the the port number squared
				base = nPortsAndNodes[j].length - 1;
				gammaMatrix.m[offset + Math.floor(k/base)][offset + k % base] = nPortsAndNodes[j][0].spars[i][1 + k].neg();
			}
			offset += base;
		};

	};
	gammaMatrix = gammaMatrix.invertCplx();
	nodalOut.setspars(spars);
	nodalOut.setglobal(nPortsAndNodes[0][0].global); // use the first nPort for global data
	return gammaMatrix;
};
/*
//nodal ... this one takes nPorts and cascades nodally, this is the BIG ONE!!
		var nodal = function nodal() {           //this moves all the nports into the nodal function
			var nPortInputsMatrix = myArgs[1],   //the matrix containing the nPorts with their nodes
				expandednPortInputsMatrix = [],  //the matrix that has b's, nodes, and a's in 3 columns
				connectionScatteringMatrix = [], //the matrix that must be solved, having negative spars and connections
				resultMatrix = [],               //the matrix containing the resulting final spars
				outSpars = [],                   //the lower right corner of resultMatrix with spars that are put into the spars array
				row = 0, col = 0, offset = 0, nPortCount = 0,
				connectionScatteringMatrixRows = 0, connectionScatteringMatrixCols = 0, connectionScatteringMatrixRowCount = 0,
				outSparsRowsCols = 0;

//get dimensions for BOTH the expanded input matrix and the connection scattering matrix
			for (row = 0; row < nPortInputsMatrix.length; row++) { //get the size off all the spars
				connectionScatteringMatrixRows += nPortInputsMatrix[row].length - 1; // -1 for don't count the nPort object, just include the node list items
				connectionScatteringMatrixCols = connectionScatteringMatrixRows;
			};

// build and populate the expanded input matrix
			expandednPortInputsMatrix = matrix.dimension(connectionScatteringMatrixRows, connectionScatteringMatrixCols, 0 );//fill expanded input matrix with 0's
			for (row = 0; row < connectionScatteringMatrixRows; row++) {//put the b's here in the first column 
				expandednPortInputsMatrix[row][col] = row + 1;
			};  //showTable(expandednPortInputsMatrix);	
			for( nPortCount = 0, offset = 0; nPortCount < nPortInputsMatrix.length; nPortCount++) {//put the nodes here in the second colum
				for( col = 0; col < nPortInputsMatrix[nPortCount].length -1; col++) {
					expandednPortInputsMatrix[offset][1] = nPortInputsMatrix[nPortCount][col + 1];
					offset++;
				};
			};  //showTable(expandednPortInputsMatrix);
			for (connectionScatteringMatrixRowCount = 0; connectionScatteringMatrixRowCount < connectionScatteringMatrixRows; connectionScatteringMatrixRowCount++) {
				for (row = 0; row < connectionScatteringMatrixRows; row++) {
//the if statement makes sure the pivot row is not counted
					if ( !(connectionScatteringMatrixRowCount === row) && (expandednPortInputsMatrix[connectionScatteringMatrixRowCount][1] === expandednPortInputsMatrix[row][1])   ) {
						expandednPortInputsMatrix[row][2] = expandednPortInputsMatrix[connectionScatteringMatrixRowCount][0]; //put the a's in the 3rd column
					};
				};
			};  //showTable(expandednPortInputsMatrix);

//build and populate the connection scattering matrix
			connectionScatteringMatrix = matrix.dimension(connectionScatteringMatrixRows, connectionScatteringMatrixCols, complex(0, 0) );//fill connection scattering matrix with complex 0's
			for (connectionScatteringMatrixRowCount = 0; connectionScatteringMatrixRowCount < connectionScatteringMatrixRows; connectionScatteringMatrixRowCount++) {
				connectionScatteringMatrix[ expandednPortInputsMatrix[connectionScatteringMatrixRowCount][0] - 1 ]
							  [ expandednPortInputsMatrix[connectionScatteringMatrixRowCount][2] - 1 ] = complex(1, 0); //put in one's to form the connections
			}; //showTable(connectionScatteringMatrix);

//fill the connection scattering matrix with the negative of the spars of all the nPorts
//this puts in the submatrices of the nPorts along the diagonal of the connection scattering matrix
//each subsequent submatrix is [row][col] offset as shown below
			for(nPortCount = 0, offset = 0; nPortCount < nPortInputsMatrix.length - 1; nPortCount++) {
				for (row = 0 + offset; row < nPortInputsMatrix[nPortCount].length - 1 + offset; row++) { //[0].sparsSize
					for(col = 0 + offset ; col < nPortInputsMatrix[nPortCount].length - 1 + offset; col++) {  //[0].sparsSize
//console.log(row + ' ' + col);
						connectionScatteringMatrix[row][col] = nPortInputsMatrix[nPortCount][0].getSpars()[row - offset][col - offset].neg();
					};
				};
				offset += nPortInputsMatrix[nPortCount][0].sparsSize;
			}; //showTable(connectionScatteringMatrix);

			resultMatrix = matrix.invertCmplx(connectionScatteringMatrix); //this does the magic!
//showTable(resultMatrix);
//create the outSpars matrix
			outSparsRowsCols = nPortInputsMatrix[nPortInputsMatrix.length-1].length-1
			outSpars = matrix.dimension(outSparsRowsCols, outSparsRowsCols, complex(0,0) )			
			for (row = 0; row < outSparsRowsCols; row++) {
				for (col = 0; col < outSparsRowsCols; col++) {
					outSpars[row][col] = resultMatrix[connectionScatteringMatrixRows - outSparsRowsCols + row]
									 [connectionScatteringMatrixRows - outSparsRowsCols + col]; //resultMatrix[row][col];
				};
			};

			spars = outSpars;
//showTable(spars);

		};  //end of nodal
*/
