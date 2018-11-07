'use strict';
import {complex} from './complex';

function Matrix () {}

export function dim(rows, cols, initial) {
	var row = 0, col = 0, a = [], A = [];
	for (row = 0; row < rows; row++) {
		a = [];
		for (col = 0; col < cols; col++) {
			a[col] = initial;
		};
		A[row] = a;
	};
	return A;	
};

export function dup(copied) {
	var row, col,
		B = dim(copied.length, copied[0].length, 0);
	for (row = 0; row < copied.length; row++) {
		for (col = 0; col < copied[0].length; col++) {
			B[row][col] = copied[row][col];
		};
	};
	return B;	
};

//pivotSort for maximizing the lower triangle pivot numbers
function pivotSort(array, pivot) {

	function maxKey (array, pivot) {
		var key = 0, i = 0;
		var current = 0, maximum = 0;
		for (i = pivot; i < array.length; i++) {
			current = Math.abs(array[i][pivot]);
			if (current > maximum){
				maximum = current;
				key = i; // will be row
			}
		}
		return key;
	}

	function swapNumbers (array, key, pivot) {
		// if Key === 0 do nothing
		// if key does not === 0, swap it with key = 0

		var temp0 = array[pivot];
		var temp1 = array[key];

		if ( key === pivot ) {}
		else {
			array[pivot] = temp1;
			array[key] = temp0;  
		}

	}
	swapNumbers (array, maxKey(array, pivot), pivot);

};

//pivotSortCplx for maximizing the lower triangle pivot numbers
function pivotSortCplx(array, pivot) {

	function maxKey (array, pivot) {
		var key = 0, i = 0;
		var current = 0, maximum = 0;
		for (i = pivot; i < array.length; i++) {
			current = array[i][pivot].mag();
			if (current > maximum){
				maximum = current;
				key = i; // will be row
			}
		}
		return key;
	}

	function swapNumbers (array, key, pivot) {
		// if Key === 0 do nothing
		// if key does not === 0, swap it with key = 0

		var temp0 = array[pivot];
		var temp1 = array[key];

		if ( key === pivot ) {}
		else {
			array[pivot] = temp1;
			array[key] = temp0;  
		}

	}
	swapNumbers (array, maxKey(array, pivot), pivot);

};



Matrix.prototype = {
	set : function (mat) {this.m = mat; return this;},
	dimension : function (tableRow, tableCol, initial) {
		return matrix(dim(tableRow, tableCol, initial));
	},

	duplicate : function duplicate(matrixA) {
		return matrix(dup(matrixA.m));	
	},

	add : function add (matrixB) {
		var A = this.m,
			B = matrixB.m,
			C = dim(A.length, A[0].length, 0),
			numRows = A.length,
			numCols = A[0].length,
			row = 0, col = 0;
		for(row = 0; row < numRows; row++) {
			for(col = 0; col < numCols; col++) {
				C[row][col] = A[row][col] + B[row][col];
			};
		};
		return matrix(C);
	},

	addCplx : function addCplx (matrixB) {
		var A = this.m,
			B = matrixB.m,
			C = dim(A.length, A[0].length, complex(0,0)),
			numRows = A.length,
			numCols = A[0].length,
			row = 0, col = 0;
		for(row = 0; row < numRows; row++) {
			for(col = 0; col < numCols; col++) {
				C[row][col] = A[row][col].add(B[row][col]);
			};
		};
		return matrix(C);
	},

	sub : function sub (matrixB) {
		var A = this.m,
			B = matrixB.m,
			matrixC = dim(A.length, A[0].length, 0),
			numRows = A.length,
			numCols = A[0].length,
			row = 0, col = 0;
		for(row = 0; row < numRows; row++) {
			for(col = 0; col < numCols; col++) {
				C[row][col] = A[row][col] - B[row][col];
			};
		};
		return matrix(C);
	},

	subCplx : function subCplx (matrixB) {
		var A = this.m,
			B = matrixB.m,
			C = dim(A.length, A[0].length, complex(0,0)),
			numRows = A.length,
			numCols = A[0].length,
			row = 0, col = 0;
		for(row = 0; row < numRows; row++) {
			for(col = 0; col < numCols; col++) {
				C[row][col] = A[row][col].sub(B[row][col]);
			};
		};
		return matrix(C);
	},

	mul : function mul (matrixB) {
		var A = this.m,
			B = matrixB.m,
			C = dim(A.length, B[0].length,0),
			numRows = A[0].length,
			numCols = B.length,
			row = 0, col = 0, n = 0;			
		for(row = 0; row < A.length; row++) {
			for(col = 0; col < B[0].length; col++) {
				for(n = 0; n < B.length; n++) {
					C[row][col] += A[row][n] * B[n][col];
				};
			};
		};	
		return matrix(C);
	},

	mulCplx : function mulCplx (matrixB) {
		var A = this.m,
			B = matrixB.m,
			C = dim(A.length, B[0].length, complex(0,0)),
			numRows = A[0].length,
			numCols = B.length,
			row = 0, col = 0, n = 0;			
		for(row = 0; row < A.length; row++) {
			for(col = 0; col < B[0].length; col++) {
				for(n = 0; n < B.length; n++) {
					C[row][col] = C[row][col].add(A[row][n].mul(B[n][col]));
				};
			};
		};	
		return matrix(C);
	},


	solveGaussFB : function solveGaussFB() { //this works
		var A = dup(this.m),
			a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
			row = 0, col = 0, accum = 0, B = [];

		for(constRow = 0; constRow < numRows; constRow++) { // FORWARD ELIMINAION - this row stays the same
			pivotSort(A, constRow);
			for(row = constRow+1; row < numRows; row++) { // this row moves down
				a = -A[row][constRow]/A[constRow][constRow]; // this computes "a"
				for(col = 0; col < numCols; col++) { // this sweeps across the columns
					A[row][col] = A[row][col] + a*A[constRow][col];
				};
			};
		};     

		for(row = numRows -1; row > -1; row--) { // BACK SUBSTITUTION
			accum = 0;
			for(col = numRows -1; col > row; col--) {
				accum = accum + A[row][col]*A[col][numCols -1];
			}
			A[row][numCols -1] = (1/A[row][row]) * (A[row][numCols -1] - accum);
		}

		for(row = 0; row < numRows; row++) { // get to the right column of A				
			for ( col = 0; col < numCols -1; col++) {
				A[row].shift();
			};				
		};
		return matrix(A);
	},


	solveGaussFBCplx : function solveGaussFBCplx() { // this works 12/9/16 and now on 6/24/17
		var A = dup(this.m),
			a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
			row = 0, col = 0, accum = complex(0, 0), B = [];

		for(constRow = 0; constRow < numRows; constRow++) { // FORWARD ELIMINATION - this row stays the same
			pivotSortCplx(A, constRow);
			for(row = constRow+1; row < numRows; row++) { // this row moves down
				a = A[row][constRow].div(A[constRow][constRow]).neg();
				for(col = 0; col < numCols; col++) { // this sweeps across the columns
					A[row][col] = A[row][col].add(a.mul(A[constRow][col]));
				};
			};
		};			

		for(row = numRows -1; row > -1; row--) { // BACK SUBSTITUTION
			accum = complex(0,0);
			for(col = numRows -1; col > row; col--) { 
				accum = accum.add(  A[row][col].mul( A[col][numCols -1]));
			};
			A[row][numCols -1] =  (complex(1, 0)).div(A[row][row]).mul( A[row][numCols -1].sub(accum));          
		};

		for(row = 0; row < numRows; row++) { // get to the right column of A				
			for ( col = 0; col < numCols -1; col++) {
				A[row].shift();
			};				
		};
		return matrix(A);
	},


	invert : function invert() { //this works
		var A = dup(this.m),
			a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
			row = 0, col = 0, count = 0;
		//append a 0 Matrix to Matrix, A
		for(row = 0; row < numRows; row++) {
			for(col = numRows; col < 2*numRows; col++) {
				A[row][col] = 0;
			};
		};
		//update numCols since Matrix, A is now wider;
		numCols = A[0].length
		//add diagonal 1's to append array, A
		for(row = 0; row < numRows; row++) {
			A[row][row + numRows] = 1;
		};			
		// Real variable forward lower Elimination routine  
		for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
			pivotSort(A, constRow);
			for(row = constRow+1; row < numRows; row++) { // this row moves down
				a = -A[row][constRow]/A[constRow][constRow]; // this computes "a"
				for(col = 0; col < numCols; col++) { // this sweeps across the columns
					A[row][col] = A[row][col] + a*A[constRow][col];
				};
			};
		};     
		// Real variable forward unity diagonal routine  
		for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
			a = 1/A[constRow][constRow];
			for(row = constRow; row < numRows; row++) { // this row moves down
				for(col = 0; col < numCols; col++) { // this sweeps across the columns
					A[row][col] = a*A[row][col];
				};
			};
		};
		// Real variable forward upper Elimination routine
		for(constRow = numRows - 1; constRow > 0 ; constRow--) { // 2 , 1, 0 this row stays the same			
			for(row = 0; row < constRow; row++) { // 0, 1  this row moves down
				a = -A[row][constRow]/A[constRow][constRow]				
				for(col = 0; col < numCols; col++) { // this sweeps across the columns	
					A[row][col] = A[row][col] + a*A[constRow][col];
				};	
			};	
		};
		for(row = 0; row < numRows; row++) { // get to the right column of A				
			for ( col = 0; col < numCols/2; col++) {
				A[row].shift();
			};				
		};
		return matrix(A);
	},

	invertCplx : function invertCplx() { //this works
		var A = dup(this.m),
			a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
			row = 0, col = 0, B = [], count = 0;
		var countAConstRow = 0, countARow = 0, countACol = 0, countBConstRow1 = 0, countBRow = 0, countBCol = 0;
		//append a 0 Matrix to Matrix, A
		for(row = 0; row < numRows; row++) {
			for(col = numRows; col < 2*numRows; col++) {
				A[row][col] = complex(0, 0);
			};
		};

		//update numCols since Matrix, A is now wider;
		numCols = A[0].length

		//add diagonal 1's to appened array, A
		for(row = 0; row < numRows; row++) {
			A[row][row + numRows] = complex(1, 0);
		};

		// Real variable forward lower Elimination routine  
		for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
			pivotSortCplx(A, constRow);
			for(row = constRow + 1; row < numRows; row++) { // this row moves down
				a = A[row][constRow].div(A[constRow][constRow]).neg();
				for(col = 0; col < numCols; col++) { // this sweeps across the columns
					A[row][col] = A[row][col].add(a.mul(A[constRow][col]));
				};
			};
		};

		// Real variable forward unity diagonal routine
		for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
			a = A[constRow][constRow].inv(); 
			for(row = constRow; row < numRows; row++) { // this row moves down
				for(col = 0; col < numCols; col++) { // this sweeps across the columns
					A[row][col] = a.mul(A[row][col]);
				};
			};
		};

		// Real variable forward upper Elimination routine
		for(constRow = numRows - 1; constRow > 0 ; constRow--) { // 2 , 1, 0 this row stays the same
			for(row = 0; row < constRow; row++) { // 0, 1  this row moves down
				a = A[row][constRow].div(A[constRow][constRow]).neg();
				for(col = 0; col < numCols; col++) { // this sweeps across the columns
					A[row][col] = A[row][col].add(a.mul(A[constRow][col]));						
				};
			};	
		};

		for(row = 0; row < numRows; row++) { // get to the right column of A				
			for ( col = 0; col < numCols/2; col++) {
				A[row].shift();
			};				
		};
		return matrix(A);
	},						
};


export function matrix(mat) {
	var matrix = new Matrix;
	matrix.set(mat)
	return matrix;
};
