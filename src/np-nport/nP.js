(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.nP = {})));
}(this, (function (exports) { 'use strict';

	function Complex() {}

	Complex.prototype = {
		constructor: Complex,
		set: function(real, imaginary) { this.x = real; this.y = imaginary; return this },
		getR: function () {return this.x;},	  
		getI: function () {return this.y;}, 
		setR: function (R) {this.x = R;},
		setI: function (I) {this.y = I;},	
		print: function() {console.log(this.x + " " + this.y);},
		add: function (c2) {return complex(this.x + c2.x, this.y + c2.y);},
		sub: function (c2) {return complex(this.x - c2.x, this.y - c2.y);},
		mul: function (c2) {return complex(this.x * c2.x -this.y * c2.y, this.x * c2.y + this.y * c2.x);},		
		div: function (c2) {return complex(
			(this.x * c2.x + this.y * c2.y)/(c2.x * c2.x + c2.y * c2.y),
			(c2.x * this.y - this.x * c2.y)/(c2.x * c2.x + c2.y * c2.y));},	
		inv: function () {return complex((1 * this.x + 0 * this.y)/(this.x * this.x + this.y * this.y), (this.x * 0 - 1 * this.y)/(this.x * this.x + this.y * this.y));},	
		neg: function () {return complex(-this.x, -this.y);},
		mag: function () {return Math.sqrt(this.x * this.x + this.y * this.y);},
		ang: function () {return Math.atan2(this.y, this.x) * (180/Math.PI);},
		mag10dB: function () {return 10 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
		mag20dB: function () {return 20 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
	};

	function complex(real, imaginary) {
		var complex = new Complex ;
		complex.set(real, imaginary);
		return complex;
	}

	function nPort() {}
	nPort.prototype = {
		constructor: nPort,
		setglobal: function (global) { this.global = global; },
		getglobal: function () {return this.global;},
		setspars: function (sparsArray) { this.spars = sparsArray; },
		getspars: function () { return this.spars; },
		cas: function cas (n2) { // cascade two 2-ports along with method chaining since it returns an nPort
			var freqCount = 0, one = complex(1,0),
				sparsA = this.getspars(),
				sparsB = n2.getspars(),
				s11, s12, s21, s22, s11a, s12a, s21a, s22a, s11b, s12b, s21b, s22b, sparsArray = [];
			for (freqCount = 0; freqCount < this.spars.length; freqCount++) {
				s11a = sparsA[freqCount][1]; s12a = sparsA[freqCount][2]; s21a = sparsA[freqCount][3]; s22a = sparsA[freqCount][4];			
				s11b = sparsB[freqCount][1]; s12b = sparsB[freqCount][2]; s21b = sparsB[freqCount][3]; s22b = sparsB[freqCount][4];

				s11 = s11a.add (( s12a.mul(s11b).mul(s21a) ).div( (one.sub( s22a.mul(s11b) ) ) ) );
				s12 =           ( s12a.mul(s12b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ;
				s22 = s22b.add (( s21b.mul(s22a).mul(s12b) ).div( (one.sub( s22a.mul(s11b) ) ) ) );
				s21 =           ( s21a.mul(s21b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ;
				//sparsArray[freqCount] =	[this.spars[freqCount][0],s11, s12, s21, s22];
				sparsArray[freqCount] =	[sparsA[freqCount][0],s11, s12, s21, s22];
			}		var casOut = new nPort();
			casOut.setspars(sparsArray);
			casOut.setglobal(this.global);
			return casOut;
		},
		out : function out (...sparsArguments) {
			var spars = this.getspars();
			var n = Math.sqrt(spars[0].length - 1); 
			var copy = spars.map(function (element,index,spars) {
				var inner = [element[0]];
				sparsArguments.forEach(function (sparsArgument,index1,array) {
					var row = parseInt(sparsArgument.match(/\d/g)[0]);
					var col = parseInt(sparsArgument.match(/\d/g)[1]);
					var sparIndex = (row - 1) * n + col;
					var sparsTo = sparsArgument.match(/dB|mag|ang/).toString();
					if(sparsTo === 'mag') {inner.push(element[sparIndex].mag());}				if(sparsTo === 'dB')  {inner.push(element[sparIndex].mag20dB());}				if(sparsTo === 'ang') {inner.push(element[sparIndex].ang());}
				});  // end of forEach
				return inner;
			}); // end of map
			sparsArguments.unshift('Freq');
			copy.unshift(sparsArguments);
			return copy;
		},
	};

	var global = {
		fList:	[2e9, 4e9, 6e9, 8e9],
		Ro:	50,
		Temp:	293,
		fGen: function fGen (fStart, fStop, points) {
			var out = [];
			var fStep = (fStop-fStart)/(points-1);
			var fMax = fStart;
			var i = 0; 
			for (i = 0; i < points; i++, fMax += fStep ) {
				out.push(fMax);
			}
			return out;
		},
	};

	function seR(R = 75) { // series resistor nPort object
		var seR = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 0);
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	
		seR.setspars(sparsArray);
		seR.setglobal(global);
		return seR;
	}

	function paR(R = 75) { // parallel resistor nPort object
		var paR = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 0);
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paR.setspars(sparsArray);
		paR.setglobal(global);	
		return paR;
	}

	function seL(L = 5e-9) { // series inductor nPort object
		var seL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount]);	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seL.setspars(sparsArray);
		seL.setglobal(global);	
		return seL;
	}

	function paC(C = 1e-12) { // parallel capacitor nPort object   
		var paC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, -1/(2*Math.PI*C*frequencyList[freqCount]));
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paC.setspars(sparsArray);
		paC.setglobal(global);				
		return paC;
	}

	function lpfGen( filt =[50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50]) {
		var i = 0;
		var filtTable = [];
		filt.pop();
		filt.shift();
		for (i = 0; i < filt.length; i++) {
			if (i % 2 === 0) {filtTable[i] = paC(filt[i]);}		if (i % 2 === 1) {filtTable[i] = seL(filt[i]);}	}	for (i = 0; i < filt.length - 1; i++) {
			filtTable[i+1] = filtTable[i].cas(filtTable[i+1]);
		}	return filtTable[ filtTable.length-1 ];
	}

	function cascade( ... nPorts) {
		var i = 0;
		var nPortsTable = nPorts;
		for (i = 0; i < nPortsTable.length - 1; i++) {
			nPortsTable[i+1] = nPortsTable[i].cas(nPortsTable[i+1]);
		}	return nPortsTable[ nPortsTable.length-1 ];
	}

	function Matrix () {}

	function dim(rows, cols, initial) {
		var row = 0, col = 0, a = [], A = [];
		for (row = 0; row < rows; row++) {
			a = [];
			for (col = 0; col < cols; col++) {
				a[col] = initial;
			}		A[row] = a;
		}	return A;	
	}
	Matrix.prototype = {
		set : function (mat) {return mat ? this.m = mat : this.m = [0];},
		dimension : function (tableRow, tableCol, initial) {
			return matrix(this.m = dim(tableRow, tableCol, initial));
		},

		//duplicate
		duplicate : function duplicate() {
			var row, col,
			A = this.m,
			B = dim(A.length, A[0].length, 0);
			for (row = 0; row < A.length; row++) {
				for (col = 0; col < A[0].length; col++) {
					B[row][col] = A[row][col];
				}		}		return matrix(B);	
		},



		//addition for real numbers
		add : function add (matrixB) { //this works
			var A = this.m,
			B = matrixB.m,
			C = dim(A.length, A[0].length, 0),
			numRows = A.length,
			numCols = A[0].length,
			row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
					C[row][col] = A[row][col] + B[row][col];
				}		}		return matrix(C);
		},

		//addition for complex numbers
		addCplx : function addCplx (matrixB) { //this works
			var A = this.m,
			B = matrixB.m,
			C = dim(A.length, A[0].length, complex(0,0)),
			numRows = A.length,
			numCols = A[0].length,
			row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
					C[row][col] = A[row][col].add(B[row][col]);
				}		}		return matrix(C);
		},

	//subtraction for real numbers
		sub : function sub (matrixB) { //this works
			var A = this.m,
			B = matrixB.m,
			matrixC = dim(A.length, A[0].length, 0),
			numRows = A.length,
			numCols = A[0].length,
			row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
					C[row][col] = A[row][col] - B[row][col];
				}		}		return matrix(C);
		},

	//subtraction for complex numbers
		subCplx : function subCplx (matrixB) { //this works
			var A = this.m,
			B = matrixB.m,
			C = dim(A.length, A[0].length, complex(0,0)),
			numRows = A.length,
			numCols = A[0].length,
			row = 0, col = 0;
			for(row = 0; row < numRows; row++) {
				for(col = 0; col < numCols; col++) {
					C[row][col] = A[row][col].sub(B[row][col]);
				}		}		return matrix(C);
		},

	//multiplication for real numbers
		mul : function mul (matrixB) { //this works  n = matrixB[0].length
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
					}			}		}		return matrix(C);
		},

	//multiplication for complex numbers
		mulCplx : function mulCplx (matrixB) { //this works  n = matrixB[0].length
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
					}			}		}		return matrix(C);
		},
	};

	/*	
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


	//swapRowsLCplx for the lower triangle pivot numbers
		swapRowsLCplx : function swapRowsLCplx(matrix, pivotNum) {
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
		swapRowsUCplx : function swapRowsCplx(matrix, pivotNum) {
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

	//gaussFwdBkEliminationCplx for complex numbers
		solveCplx : function solveCplx(Matrix) { // this works 12/9/16 and now on 6/24/17
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

	//gaussJordenEliminationCplx (use for matrix inversion for complex numbers)
		invertCplx : function invertCplx(Matrix) { //this works
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
	//matrix.swapRowsLCplx(A, constRow);
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
	//matrix.swapRowsUCplx(A, constRow);
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
	*/


	function matrix(mat) {
		var matrix = new Matrix;
		matrix.set(mat);
		return matrix;
	}

	function nodal(nPorts) {
		var a = matrix();
		a.dimension(2,2, nPorts);
		return a;
	}

	exports.seR = seR;
	exports.paR = paR;
	exports.seL = seL;
	exports.paC = paC;
	exports.lpfGen = lpfGen;
	exports.cascade = cascade;
	exports.nodal = nodal;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
