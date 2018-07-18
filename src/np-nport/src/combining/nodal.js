import {nPort} from '../nPort';
import {matrix} from '../../../np-math/src/matrix';
import {dim} from '../../../np-math/src/matrix';
import {complex} from '../../../np-math/src/complex';


export function nodal( ... nPortsAndNodes) { //nPortsAndNodes = [[nPort1, n1, n2 ...], [nPort2, n1, n2 ...], ... ['out', n1, nn2, ...] ]
	var i = 0, j = 0, k = 0, m = 0;
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
		for (i = 0; i < numOfnPorts - 1; i++) { 
			size += Math.sqrt(nPortsAndNodes[i][0].spars[0].length -1);
		}
		return size + nPortsAndNodes[numOfnPorts-1].length - 1;
	}(nPortsAndNodes);	
	var zeroArray = function () { return dim(rowCol, rowCol, complex(0,0)); }();
	var gammaArray = function () {}();
	var abcArray = function () { return dim(rowCol, 1, complex(0,0)); }();
	var aMatrix = matrix(abcArray);
	var bMatrix = matrix(abcArray);
	var cMatrix = matrix(abcArray);
	var gammaMatrix = matrix(zeroArray);
	var nodalOut = new nPort();
	for ( i = 0; i < numOfnPorts -1; i++) {
		for ( j = 0; j < numOfFreqs; j++) {
		};
	};
	nodalOut.setspars(spars);
	nodalOut.setglobal(nPortsAndNodes[0][0].global); // use the first nPort for global data
	return nodalOut;
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
