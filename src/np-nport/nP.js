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
		inv: function () {return complex(
			(1 * this.x + 0 * this.y)/(this.x * this.x + this.y * this.y),
			(this.x * 0 - 1 * this.y)/(this.x * this.x + this.y * this.y));},	
		neg: function () {return complex(-this.x, -this.y);},
		mag: function () {return Math.sqrt(this.x * this.x + this.y * this.y);},
		ang: function () {return Math.atan2(this.y, this.x) * (180/Math.PI);},
		mag10dB: function () {return 10 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
		mag20dB: function () {return 20 * Math.log(   Math.sqrt(this.x * this.x + this.y * this.y) )/2.302585092994046   },
		sinhCplx: function () {return complex(Math.sinh(this.x)*Math.cos(this.y), Math.cosh(this.x)*Math.sin(this.y));},
		coshCplx: function () {return complex(Math.cosh(this.x)*Math.cos(this.y), Math.sinh(this.x)*Math.sin(this.y));}
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

	function wireTee() { // series resistor nPort object
		var wireTee = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(-1/3,0);
			s12 = complex(2/3,0);
			s13 = s12;
			s21 = s12;
			s22 = s11;
			s23 = s12;
			s31 = s12;
			s32 = s12;
			s33 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s21, s22, s23, s31, s32, s33];
		}	
		wireTee.setspars(sparsArray);
		wireTee.setglobal(global);
		return wireTee;
	}

	function seriesTee() { // series resistor nPort object
		var seriesTee = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(1/3,0);
			s12 = complex(0.00001,0.000001);//complex(2/3,0);
			s13 = s11; //s12;
			s21 = s12;
			s22 = s11;
			s23 = s12;
			s31 = s11; //s12;
			s32 = s12;
			s33 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s21, s22, s23, s31, s32, s33];
		}	
		seriesTee.setspars(sparsArray);
		seriesTee.setglobal(global);
		return seriesTee;
	}

	function cascade( ... nPorts) {
		var i = 0;
		var nPortsTable = nPorts;
		for (i = 0; i < nPortsTable.length - 1; i++) {
			nPortsTable[i+1] = nPortsTable[i].cas(nPortsTable[i+1]);
		}	return nPortsTable[ nPortsTable.length-1 ];
	}

	function openPort() { // open one port nPort object
		var openPort = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, s11, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(1,0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11];
		}	
		openPort.setspars(sparsArray);
		openPort.setglobal(global);
		return openPort;
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
	function dup(copied) {
		var row, col,
			B = dim(copied.length, copied[0].length, 0);
		for (row = 0; row < copied.length; row++) {
			for (col = 0; col < copied[0].length; col++) {
				B[row][col] = copied[row][col];
			}	}	return B;	
	}
	Matrix.prototype = {
		set : function (mat) {this.m = mat; return this;}, //mat ? this.m = mat : this.m = [0]; return this},
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
				}		}		return matrix(C);
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
				}		}		return matrix(C);
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
				}		}		return matrix(C);
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
				}		}		return matrix(C);
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
					}			}		}		return matrix(C);
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
					}			}		}		return matrix(C);
		},

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
		*/

		solveGaussFB : function solveGaussFB() { //this works
			var A = this.m,
				a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0, accum = 0;

			for(constRow = 0; constRow < numRows; constRow++) { // FORWARD ELIMINAION - this row stays the same
				for(row = constRow+1; row < numRows; row++) { // this row moves down
					a = -A[row][constRow]/A[constRow][constRow]; // this computes "a"
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col] + a*A[constRow][col];
					}			}		}
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
				}		}		return matrix(A);
		},


		solveGaussFBCplx : function solveGaussFBCplx() { // this works 12/9/16 and now on 6/24/17
			var A = this.m,
				a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0, accum = complex(0, 0);

			for(constRow = 0; constRow < numRows; constRow++) { // FORWARD ELIMINATION - this row stays the same
				for(row = constRow+1; row < numRows; row++) { // this row moves down
					a = A[row][constRow].div(A[constRow][constRow]).neg();
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));
					}			}		}
			for(row = numRows -1; row > -1; row--) { // BACK SUBSTITUTION
				accum = complex(0,0);
				for(col = numRows -1; col > row; col--) { 
					accum = accum.add(  A[row][col].mul( A[col][numCols -1]));
				}			A[row][numCols -1] =  (complex(1, 0)).div(A[row][row]).mul( A[row][numCols -1].sub(accum));          
			}
			for(row = 0; row < numRows; row++) { // get to the right column of A				
				for ( col = 0; col < numCols -1; col++) {
					A[row].shift();
				}		}		return matrix(A);
		},


		//gaussJordenElimination (use for matrix inversion with real numbers) ---------------------------------------------------------------------------------------------
		invert : function invert() { //this works
			var A = this.m, a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0;
			//append a 0 Matrix to Matrix, A
			for(row = 0; row < numRows; row++) {
				for(col = numRows; col < 2*numRows; col++) {
					A[row][col] = 0;
				}		}		//update numCols since Matrix, A is now wider;
			numCols = A[0].length;
			//add diagonal 1's to append array, A
			for(row = 0; row < numRows; row++) {
				A[row][row + numRows] = 1;
			}		// Real variable forward lower Elimination routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				for(row = constRow+1; row < numRows; row++) { // this row moves down
					a = -A[row][constRow]/A[constRow][constRow]; // this computes "a"
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col] + a*A[constRow][col];
					}			}		}		// Real variable forward unity diagonal routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				a = 1/A[constRow][constRow];
				for(row = constRow; row < numRows; row++) { // this row moves down
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = a*A[row][col];
					}			}		}		// Real variable forward upper Elimination routine
			for(constRow = numRows - 1; constRow > 0 ; constRow--) { // 2 , 1, 0 this row stays the same			
				for(row = 0; row < constRow; row++) { // 0, 1  this row moves down
					a = -A[row][constRow]/A[constRow][constRow];				
					for(col = 0; col < numCols; col++) { // this sweeps across the columns	
						A[row][col] = A[row][col] + a*A[constRow][col];
					}			}		}		for(row = 0; row < numRows; row++) { // get to the right column of A				
				for ( col = 0; col < numCols/2; col++) {
					A[row].shift();
				}		}		return matrix(A);
		},

		//gaussJordenEliminationCplx (use for matrix inversion for complex numbers) -------------------------------------------------------------------------------------------------------
		invertCplx : function invertCplx() { //this works
			var A = this.m,
				a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0;
			//append a 0 Matrix to Matrix, A
			for(row = 0; row < numRows; row++) {
				for(col = numRows; col < 2*numRows; col++) {
					A[row][col] = complex(0, 0);
				}		}		//update numCols since Matrix, A is now wider;
			numCols = A[0].length;
			//add diagonal 1's to appened array, A
			for(row = 0; row < numRows; row++) {
				A[row][row + numRows] = complex(1, 0);
			}		// Real variable forward lower Elimination routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				//matrix.swapRowsLCplx(A, constRow);
				for(row = constRow + 1; row < numRows; row++) { // this row moves down
					a = A[row][constRow].div(A[constRow][constRow]).neg();
					//console.log(a);
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));
					}			}		}		// Real variable forward unity diagonal routine

			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				a = A[constRow][constRow].inv();
				for(row = constRow; row < numRows; row++) { // this row moves down
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = a.mul(A[row][col]);
					}			}		}
			// Real variable forward upper Elimination routine
			for(constRow = numRows - 1; constRow > 0 ; constRow--) { // 2 , 1, 0 this row stays the same
				//countBconstRow++;
				//matrix.swapRowsUCplx(A, constRow);
				for(row = 0; row < constRow; row++) { // 0, 1  this row moves down

					a = A[row][constRow].div(A[constRow][constRow]).neg();				
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						//countBCol++;
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));						
					}			}		}
			for(row = 0; row < numRows; row++) { // get to the right column of A				
				for ( col = 0; col < numCols/2; col++) {
					A[row].shift();
				}		}		return matrix(A);
		},						
	};


	function matrix(mat) {
		var matrix = new Matrix;
		matrix.set(mat);
		return matrix;
	}

	function nodal( ... nPortsAndNodes) { //nPortsAndNodes = [[nPort1, n1, n2 ...], [nPort2, n1, n2 ...], ... ['out', n1, nn2, ...] ]
		var i = 0, j = 0, k = 0, row = 0, col = 0, offset = 0, base = 0;
		var spars = function () { // creates spars table with frequencies only [ [freq1], [freq2], ... [freqN] ]
			var sparsLength = nPortsAndNodes[0][0].global.fList.length; // use the first nPort for global data
			var sparsArray = dim(sparsLength,1,1);
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
		const gammaArray = function () {
			var outArray = dim(rowCol, rowCol, complex(0,0));
			var outArrayReal = dim(rowCol, rowCol, 0); // for testing hookup
			var expanded = dim(rowCol, 3, 0);
			for (row = 0; row < rowCol; row++) {//put the b's here in the first column 
				expanded[row][0] = row + 1;
			}		for(i = 0, offset = 0; i < numOfnPorts; i++) {//put the nodes here in the second column
				for( col = 0; col < nPortsAndNodes[i].length -1; col++) {
					expanded[offset][1] = nPortsAndNodes[i][col + 1];
					offset++;
				}		}		for (i = 0; i < rowCol; i++) {
				for (row = 0; row < rowCol; row++) { // put the a's in the 3rd column
					if ( !(i === row) && (expanded[i][1] === expanded[row][1])   ) { //pivot row is not counted
						expanded[row][2] = expanded[i][0];
					}			}		}		for (row = 0; row < rowCol; row++) { // put 1's for the interconnects
				outArray[row][expanded[row][2]-1] = complex(1,0);
				outArrayReal[row][expanded[row][2]-1] = 1;
			}		return outArray;
		}();
		var gammaMatrix = matrix(gammaArray);
		var nodalOut = new nPort();
		for ( i = 0; i < numOfFreqs; i++) { // i is number of frequencies
			offset = 0;
			gammaMatrix.m = dup(gammaArray);
			for ( j = 0; j < nPortsAndNodes.length - 1; j++) { // j is the number of the current nPort except the last one
				for ( k = 0; k < (nPortsAndNodes[j].length - 1)**2; k++){ // k is the the port number squared
					base = nPortsAndNodes[j].length - 1;
					gammaMatrix.m[offset + Math.floor(k/base)][offset + k % base] = nPortsAndNodes[j][0].spars[i][1 + k].neg();
				}
				offset += base;
			}		gammaMatrix = gammaMatrix.invertCplx();
			for ( j = 0; j < nPortsAndNodes[nPortsAndNodes.length-1].length-1; j++) { //
				for ( k = 0; k < nPortsAndNodes[nPortsAndNodes.length-1].length-1; k++) {
					spars[i].push(gammaMatrix.m[offset +j][offset + k]);
				}		}
		}	nodalOut.setspars(spars);
		nodalOut.setglobal(nPortsAndNodes[0][0].global); // use the first nPort for global data
		return nodalOut;
	}

	function termPort() { // open one port nPort object
		var termPort = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, s11, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(0,0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11];
		}	
		termPort.setspars(sparsArray);
		termPort.setglobal(global);
		return termPort;
	}

	function shortPort() { // open one port nPort object
		var shortPort = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, s11, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(-1,0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11];
		}	
		shortPort.setspars(sparsArray);
		shortPort.setglobal(global);
		return shortPort;
	}

	function tlin(Ztlin = 60, Length = 0.5 * 0.0254) { // series inductor nPort object
		var tlin = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), one = complex(1,0), two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		var A = {}, B = {}, C = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z = complex(Ztlin, 0);
		
			A = Z.mul(Z).sub(Zo.mul(Zo));
			B = Z.mul(Z).add(Zo.mul(Zo));
			C = two.mul(Z).mul(Zo);
			
			alpha = 0;
			beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
			gamma = complex(alpha * Length, beta * Length);

			Ds = C.mul(gamma.coshCplx()).add(B.mul(gamma.sinhCplx()));

			s11 = A.mul(gamma.sinhCplx()).div(Ds);
			s12 = C.div(Ds);	
			s21 = s12;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	tlin.setspars(sparsArray);
		tlin.setglobal(global);	
		return tlin;
	}

	exports.seR = seR;
	exports.paR = paR;
	exports.seL = seL;
	exports.paC = paC;
	exports.lpfGen = lpfGen;
	exports.wireTee = wireTee;
	exports.seriesTee = seriesTee;
	exports.cascade = cascade;
	exports.openPort = openPort;
	exports.nodal = nodal;
	exports.termPort = termPort;
	exports.shortPort = shortPort;
	exports.tlin = tlin;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
