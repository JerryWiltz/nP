// matrix.js
define([], function(){
//define(['app/complex'], function(complex){
"use strict";
	var matrix = {
		
		//seeMe
		seeMe : function() {
			console.log('I am here in matrix');
		},
		
		//dimension
		dimension : function dimension(tableRow, tableCol, initial) {
			var row, col, analysisRow = [], analysisTable = [];
			for (row = 0; row < tableRow; row++) {
			analysisRow = [];
				for (col = 0; col < tableCol; col++) {
					analysisRow[col] = initial;
				};
			analysisTable[row] = analysisRow;
			};
			return analysisTable;	
		},
		
		//duplicate
		duplicate : function duplicate(matrixA) {
			var row, col;
			var matrixB = matrix.dimension(matrixA.length, matrixA[0].length, 0);
			for (row = 0; row < matrixA.length; row++) {
				for (col = 0; col < matrixA[0].length; col++) {
					matrixB[row][col] = matrixA[row][col];
				};
			};
			return matrixB;	
		},
		
		//addition for real numbers
		add : function add (matrixA, matrixB) { //this works
			var C = matrix.dimension(matrixA.length, matrixA[0].length,0), numRows = matrixA.length, numCols = matrixA[0].length,
				row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
				C[row][col] = matrixA[row][col] + matrixB[row][col];
				};
			};
			return C;
		},
		
		//addition for complex numbers
		addCmplx : function addCmplx (matrixA, matrixB) { //this works
			var C = matrix.dimension(matrixA.length, matrixA[0].length, complex(0,0)), numRows = matrixA.length, numCols = matrixA[0].length,
				row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
				C[row][col] = matrixA[row][col].add(matrixB[row][col]);
				};
			};
			return C;
		},
				
		//subtraction for real numbers
		sub : function sub (matrixA, matrixB) { //this works
			var C = matrix.dimension(matrixA.length, matrixA[0].length,0), numRows = matrixA.length, numCols = matrixA[0].length,
				row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
				C[row][col] = matrixA[row][col] - matrixB[row][col];
				};
			};
			return C;
		},
		
		//subtraction for complex numbers
		subCmplx : function subCmplx (matrixA, matrixB) { //this works
			var C = matrix.dimension(matrixA.length, matrixA[0].length,complex(0,0)), numRows = matrixA.length, numCols = matrixA[0].length,
				row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
				C[row][col] = matrixA[row][col].sub(matrixB[row][col]);
				};
			};
			return C;
		},
				
		//multiplication for real numbers
		mul : function mul (matrixA, matrixB) { //this works  n = matrixB[0].length
			var C = matrix.dimension(matrixA.length, matrixB[0].length,0), numRows = matrixA[0].length, numCols = matrixB.length,
				row = 0, col = 0, n = 0;			
			for(row = 0; row < matrixA.length; row++) {
				for(col = 0; col < matrixB[0].length; col++) {
					for(n = 0; n < matrixB.length; n++) {
						C[row][col] += matrixA[row][n] * matrixB[n][col];
					};
				};
			};	
			return C;
		},
		
		//multiplication for complex numbers
		mulCmplx : function mulCmplx (matrixA, matrixB) { //this works  n = matrixB[0].length
			var C = matrix.dimension(matrixA.length, matrixB[0].length,complex(0,0)), numRows = matrixA[0].length, numCols = matrixB.length,
				row = 0, col = 0, n = 0;			
			for(row = 0; row < matrixA.length; row++) {
				for(col = 0; col < matrixB[0].length; col++) {
					for(n = 0; n < matrixB.length; n++) {
						C[row][col] = C[row][col].add(matrixA[row][n].mul(matrixB[n][col]));
					};
				};
			};	
			return C;
		},
		
		//swapRowsL for maximizing the lower triangle pivot numbers
		swapRowsL : function swapRowsL(matrix, pivotNum) {
			var rowNum = matrix.length, rowCol = matrix[0].length,
			newMax = matrix[pivotNum][pivotNum], tempRow = pivotNum , swapRow = pivotNum,
			row = 0;
			for(row = pivotNum + 1; row < rowNum; row++) {
				if(newMax < matrix[row][pivotNum]) {
					newMax = matrix[row][pivotNum];
					swapRow = row;
				};
			};
			tempRow = matrix[pivotNum];
			matrix[pivotNum] = matrix[swapRow];
			matrix[swapRow] = tempRow;
		},
		
		
		//swapRowsLCmplx for the lower triangle pivot numbers
		swapRowsLCmplx : function swapRowsLCmplx(matrix, pivotNum) {
			var rowNum = matrix.length, rowCol = matrix[0].length,
				newMax = matrix[pivotNum][pivotNum].mag(), tempRow = pivotNum , swapRow = pivotNum,
				row = 0;
			for(row = pivotNum + 1; row < rowNum; row++) {
				if(newMax < matrix[row][pivotNum].mag()) {
					newMax = matrix[row][pivotNum].mag();
					swapRow = row;
				};
			};
			tempRow = matrix[pivotNum];
			matrix[pivotNum] = matrix[swapRow];
			matrix[swapRow] = tempRow;
		//showTable([['jerry']]);
			//showTable(matrix);
		},		

		//swapRows for maximizing the upper triangle pivot numbers
		swapRowsU : function swapRows(matrix, pivotNum) {
		var rowNum = matrix.length, rowCol = matrix[0].length,
			newMax = matrix[pivotNum][pivotNum], tempRow = pivotNum , swapRow = pivotNum,
			row = 0;
			for(row = pivotNum - 1; row > 0; row--) {
				if(newMax < matrix[row][pivotNum]) {
					newMax = matrix[row][pivotNum];
					swapRow = row;
				};
			};
			tempRow = matrix[pivotNum];
			matrix[pivotNum] = matrix[swapRow];
			matrix[swapRow] = tempRow;
		},

		//swapRows for maximizing the upper triangle pivot numbers
		swapRowsUCmplx : function swapRowsCmplx(matrix, pivotNum) {
		var rowNum = matrix.length, rowCol = matrix[0].length,
			newMax = matrix[pivotNum][pivotNum].mag(), tempRow = pivotNum , swapRow = pivotNum,
			row = 0;
			for(row = pivotNum - 1; row > 0; row--) {
				if(newMax < matrix[row][pivotNum].mag()) {
					newMax = matrix[row][pivotNum].mag();
					swapRow = row;
				};
			};
			tempRow = matrix[pivotNum];
			matrix[pivotNum] = matrix[swapRow];
			matrix[swapRow] = tempRow;
		},		

		//gaussFwdBkElimination for real numbers
		solve : function solve(Matrix) { //this works
			var A = Matrix, a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0, accum = 0, B = [];
			// Real variable forward Elimination routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				for(row = constRow+1; row < numRows; row++) { // this row moves down
					a = -A[row][constRow]/A[constRow][constRow]; // this computes "a"
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col] + a*A[constRow][col];
					};
				};
			};     
			// Real back substitution routine
			for(row = numRows -1; row > -1; row--) {
				accum = 0;
				for(col = numRows -1; col > row; col--) {
					accum = accum + A[row][col]*A[col][numCols -1];
				}
				A[row][numCols -1] = (1/A[row][row]) * (A[row][numCols -1] - accum);
			}
			//get the right column of Matrix, A
			B = matrix.dimension(numRows, 1, 0);
			for(row = 0; row < numRows; row++) {				
				B[row][0] = A[row][numRows];				
			};			
			return B;
		},

		//gaussFwdBkEliminationCmplx for complex numbers
		solveCmplx : function solveCmplx(Matrix) { // this works 12/9/16 and now on 6/24/17
			var A = Matrix, a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0, accum = complex(0, 0), B = [];
				
					// Complex variable forward Elimination routine
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				for(row = constRow+1; row < numRows; row++) { // this row moves down
					a = A[row][constRow].div(A[constRow][constRow]).neg();
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));
					};
				};
			};			
					// Complex back substitution routine
			for(row = numRows -1; row > -1; row--) {
				for(col = numRows -1; col > row; col--) { 
					accum = accum.add(  A[row][col].mul( A[col][numCols -1]));
				};
				A[row][numCols -1] =  (complex(1, 0)).div(A[row][row]).mul( A[row][numCols -1].sub (accum));          
			};
			//get the right column of Matrix, A
			B = matrix.dimension(numRows, 1, complex(0, 0));
			for(row = 0; row < numRows; row++) {				
				B[row][0] = A[row][numRows];				
			};			
			return B;
		},
		
		//gaussJordenElimination (use for matrix inversion with real numbers)
		invert : function invert(Matrix) { //this works
			var A = Matrix, a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0, count = 0, B = [];
			//append a 0 Matrix to Matrix, A
			for(row = 0; row < numRows; row++) {
				for(col = numRows; col < 2*numRows; col++) {
				A[row][col] = 0;
				};
			};
			//update numCols since Matrix, A is now wider;
			numCols = A[0].length
			//add diagonal 1's to appened array, A
			for(row = 0; row < numRows; row++) {
				A[row][row + numRows] = 1;
			};			
			// Real variable forward lower Elimination routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
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
			//get the right half of Matrix, A
			B = matrix.dimension(numRows, numRows, 0);
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numRows; col++) {
				B[row][col] = A[row][col + numRows];
				};				
			};			
			return B;
		},
		
		//gaussJordenEliminationCmplx (use for matrix inversion for complex numbers)
		invertCmplx : function invertCmplx(Matrix) { //this works
			var A = Matrix, a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
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
			}; //showTable(A);			
			// Real variable forward lower Elimination routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
			//matrix.swapRowsLCmplx(A, constRow);
				for(row = constRow + 1; row < numRows; row++) { // this row moves down
				a = A[row][constRow].div(A[constRow][constRow]).neg();
				//console.log(a);
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));
					};
				};
			}; //showTable(A)
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
			//countBconstRow++;
			//matrix.swapRowsUCmplx(A, constRow);
				for(row = 0; row < constRow; row++) { // 0, 1  this row moves down
				
				a = A[row][constRow].div(A[constRow][constRow]).neg();				
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
					//countBCol++;
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));						
					};
				};	
			};
			
			//showTable(A);
			//get the right half of Matrix, A
			B = matrix.dimension(numRows, numRows, complex(0, 0));
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numRows; col++) {
				B[row][col] = A[row][col + numRows];
				};				
			};			
			return B;
		},						
	};	
	return matrix;
});

