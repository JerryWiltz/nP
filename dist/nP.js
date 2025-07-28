(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.nP = {}));
})(this, (function (exports) { 'use strict';

	function Complex() {}

	Complex.prototype = {
		constructor: Complex,
		set: function(real, imaginary) { this.x = real; this.y = imaginary; return this },
		
		getR: function () {return this.x;},	  
		getI: function () {return this.y;}, 

		setR: function (R) {this.x = R; return this;}, // added return this to fix issue with nP.log
		setI: function (I) {this.y = I; return this;},	

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
		copy: function () {return complex(this.x, this.y);},

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

	function Matrix () {}

	function dim(rows, cols, initial) { // used by nodal()
		var row = 0, col = 0, a = [], A = [];
		for (row = 0; row < rows; row++) {
			a = [];
			for (col = 0; col < cols; col++) {
				a[col] = initial;
			}		A[row] = a;
		}	return A;	
	}
	function dup(copied) { // used by nodal()
		var row, col, B = dim(copied.length, copied[0].length, 0);
		for (row = 0; row < copied.length; row++) {
			for (col = 0; col < copied[0].length; col++) {
				B[row][col] = copied[row][col];
			}	}	return B;	
	}
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

			if ( key === pivot ) ;
			else {
				array[pivot] = temp1;
				array[key] = temp0;  
			}

		}
		swapNumbers (array, maxKey(array, pivot), pivot);

	}
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

			if ( key === pivot ) ;
			else {
				array[pivot] = temp1;
				array[key] = temp0;  
			}

		}
		swapNumbers (array, maxKey(array, pivot), pivot);

	}
	Matrix.prototype = {
		set : function (mat) {this.m = mat; return this;},
		dimension : function (tableRow, tableCol, initial) {
			return matrix(dim(tableRow, tableCol, initial));
		},

		copyMatrix : function copyMatrix () {
			return matrix(dup(this.m));	
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
				B = matrixB.m;
				dim(A.length, A[0].length, 0);
				var numRows = A.length,
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
				C = dim(A.length, B[0].length,0);
				A[0].length;
				B.length;
				var row = 0, col = 0, n = 0;			
			for(row = 0; row < A.length; row++) {
				for(col = 0; col < B[0].length; col++) {
					for(n = 0; n < B.length; n++) {
						C[row][col] += A[row][n] * B[n][col];
					}			}		}		return matrix(C);
		},

		mulCplx : function mulCplx (matrixB) {
			var A = this.m,
				B = matrixB.m,
				C = dim(A.length, B[0].length, complex(0,0));
				A[0].length;
				B.length;
				var row = 0, col = 0, n = 0;			
			for(row = 0; row < A.length; row++) {
				for(col = 0; col < B[0].length; col++) {
					for(n = 0; n < B.length; n++) {
						C[row][col] = C[row][col].add(A[row][n].mul(B[n][col]));
					}			}		}		return matrix(C);
		},


		solveGaussFB : function solveGaussFB() { //this works
			var A = dup(this.m),
				a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0, accum = 0;

			for(constRow = 0; constRow < numRows; constRow++) { // FORWARD ELIMINAION - this row stays the same
				pivotSort(A, constRow);
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
			var A = dup(this.m),
				a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0, accum = complex(0, 0);

			for(constRow = 0; constRow < numRows; constRow++) { // FORWARD ELIMINATION - this row stays the same
				pivotSortCplx(A, constRow);
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
			for(row = 0; row < numRows; row++) { // get to the rig<!DOCTYPE html>
				for ( col = 0; col < numCols -1; col++) {
					A[row].shift();
				}		}		return matrix(A);
		},


		invert : function invert() { //this works
			var A = dup(this.m),
				a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
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
				pivotSort(A, constRow);
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

		invertCplx : function invertCplx() { //this works
			var A = dup(this.m),
				a = complex(0, 0), numRows = A.length, numCols = A[0].length, constRow = 0,
				row = 0, col = 0;
			//append a 0 Matrix to Matrix, A
			for(row = 0; row < numRows; row++) {
				for(col = numRows; col < 2*numRows; col++) {
					A[row][col] = complex(0, 0);
				}		}
			//update numCols since Matrix, A is now wider;
			numCols = A[0].length;

			//add diagonal 1's to appened array, A
			for(row = 0; row < numRows; row++) {
				A[row][row + numRows] = complex(1, 0);
			}

			// Real variable forward lower Elimination routine  
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				pivotSortCplx(A, constRow);
				for(row = constRow + 1; row < numRows; row++) { // this row moves down
					a = A[row][constRow].div(A[constRow][constRow]).neg();
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = A[row][col].add(a.mul(A[constRow][col]));
					}			}		}
			// Real variable forward unity diagonal routine
			for(constRow = 0; constRow < numRows; constRow++) { // this row stays the same
				a = A[constRow][constRow].inv(); 
				for(row = constRow; row < numRows; row++) { // this row moves down
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
						A[row][col] = a.mul(A[row][col]);
					}			}		}
			// Real variable forward upper Elimination routine
			for(constRow = numRows - 1; constRow > 0 ; constRow--) { // 2 , 1, 0 this row stays the same
				for(row = 0; row < constRow; row++) { // 0, 1  this row moves down
					a = A[row][constRow].div(A[constRow][constRow]).neg();
					for(col = 0; col < numCols; col++) { // this sweeps across the columns
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

	// Generates an array of chebyshev values based on number of section and ripple
	function chebyLPgk (n = 3, ripple = 0.1) { // Returns gk's shown in formula 4.05-2 on page 99 of MYJ
		var	chebyLPgkin = new Array(1 + 1 + n + 1),  // Table title row, go row, gk's (n rows), and g(k+1)
			chebyLPgkout = [],
			i = 0, row = 0;

		// The function, gk() Fills in the variable table above called "chebyLPgkin" to hold ak, bk, and gk's based on the n
		for(i = 0; i < chebyLPgkin.length; i++) {chebyLPgkin[i] = new Array(4); }
		// Table for complete display of values
		chebyLPgkin[0][0] = 'ak'; chebyLPgkin[0][1] = 'bk'; chebyLPgkin[0][2] = 'gk'; chebyLPgkin[0][3] = 'R,C,L';

		function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));}	function B() {return Math.log(coth(ripple/17.37));}	function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;}	function G() {return sinh(B()/(2 * n));} // Compute G() on page 99 of MYJ

		chebyLPgkin[1][2] = 1; // Initialize the lowPassFilter array for g0=1;

		for(row = 2; row < chebyLPgkin.length -1; row++) { chebyLPgkin[row][0] = Math.sin(((2*(row -1) -1) * Math.PI)/(2 * n)); }
		for(row = 2; row < chebyLPgkin.length -1; row++) { // Populate the bk column on page 99 of MYJ
			chebyLPgkin[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(  (row-1) * Math.PI/n),2);    
		}
		chebyLPgkin[2][2] = 2*chebyLPgkin[2][0]/G(); // Populate the first q1 in the cell

		for(row = 3; row < chebyLPgkin.length -1; row++) { // Populate the gk column from g2 onward to gk
			chebyLPgkin[row][2] = (4 * chebyLPgkin[row-1][0] * chebyLPgkin[row][0])/(chebyLPgkin[row-1][1] * chebyLPgkin[row-1][2]);    
		}
		chebyLPgkin[ n+2][2] = (n % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ; // Populate the last g(k+1) in the cell

		// Populate chebyLPgkout
		for(row = 1; row < chebyLPgkin.length; row++) { chebyLPgkout[row - 1] = chebyLPgkin[row][2]; }
		return chebyLPgkout;
	}

	// Generates an array of parallel Capacitors and series Inductors based on chebyshev values
	function chebyLPLCs ( cheby = [1, 1.0315851425078764, 1.1474003299537219, 1.0315851425078761, 1], maxPassFrequency = 0.2e9, zo = 50) { 
		var	chebyLPLCsout = new Array(cheby.length),
			i = 0;

		chebyLPLCsout[0] = cheby[0] * zo; // Populate the first resistor in the array

		for(i = 1; i < cheby.length -1; i++) { // Populate the C's and L's
			chebyLPLCsout[i] = ( (i) % 2 === 0 ) ? cheby[i] * zo * (1/(2*Math.PI)) * (1/(maxPassFrequency )) : cheby[i] * 1/zo * (1/(2*Math.PI)) * (1/(maxPassFrequency));
		}
		chebyLPLCsout[cheby.length-1] = cheby[cheby.length-1] * zo; // Populate the last resistor in the array

		return chebyLPLCsout;
	}

	// Computes the number sections in a chebyshev lowpass filter
	function chebyLPNsec (passFreq = .2, rejFreq = 1.5, ripple = 0.1, rejection = 30) { // Formula 4.03-4 for n on page 86 of MYJ
		var chebyLPNsecout = 0;
		function normalizedBandwidth() { return rejFreq/passFreq; }// Computes the w/w1 in MYJ on page 86 of MYJ
		function epsilon() { return Math.pow(10,(ripple/10))-1;} // Formula 4.03-5 on page 87 on MYJ
		function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
		chebyLPNsecout = Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(rejection/10))-1)/epsilon()))/arcCosh(normalizedBandwidth()));
		return chebyLPNsecout;
	}

	var global = {
		fList:	[2e9],//[2e9, 4e9, 6e9, 8e9],
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

	function ascending$1(a, b) {
	  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
	}

	function descending(a, b) {
	  return a == null || b == null ? NaN
	    : b < a ? -1
	    : b > a ? 1
	    : b >= a ? 0
	    : NaN;
	}

	function bisector(f) {
	  let compare1, compare2, delta;

	  // If an accessor is specified, promote it to a comparator. In this case we
	  // can test whether the search value is (self-) comparable. We can’t do this
	  // for a comparator (except for specific, known comparators) because we can’t
	  // tell if the comparator is symmetric, and an asymmetric comparator can’t be
	  // used to test whether a single value is comparable.
	  if (f.length !== 2) {
	    compare1 = ascending$1;
	    compare2 = (d, x) => ascending$1(f(d), x);
	    delta = (d, x) => f(d) - x;
	  } else {
	    compare1 = f === ascending$1 || f === descending ? f : zero$1;
	    compare2 = f;
	    delta = f;
	  }

	  function left(a, x, lo = 0, hi = a.length) {
	    if (lo < hi) {
	      if (compare1(x, x) !== 0) return hi;
	      do {
	        const mid = (lo + hi) >>> 1;
	        if (compare2(a[mid], x) < 0) lo = mid + 1;
	        else hi = mid;
	      } while (lo < hi);
	    }
	    return lo;
	  }

	  function right(a, x, lo = 0, hi = a.length) {
	    if (lo < hi) {
	      if (compare1(x, x) !== 0) return hi;
	      do {
	        const mid = (lo + hi) >>> 1;
	        if (compare2(a[mid], x) <= 0) lo = mid + 1;
	        else hi = mid;
	      } while (lo < hi);
	    }
	    return lo;
	  }

	  function center(a, x, lo = 0, hi = a.length) {
	    const i = left(a, x, lo, hi - 1);
	    return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
	  }

	  return {left, center, right};
	}

	function zero$1() {
	  return 0;
	}

	function number$2(x) {
	  return x === null ? NaN : +x;
	}

	const ascendingBisect = bisector(ascending$1);
	const bisectRight = ascendingBisect.right;
	bisector(number$2).center;

	function extent(values, valueof) {
	  let min;
	  let max;
	  {
	    for (const value of values) {
	      if (value != null) {
	        if (min === undefined) {
	          if (value >= value) min = max = value;
	        } else {
	          if (min > value) min = value;
	          if (max < value) max = value;
	        }
	      }
	    }
	  }
	  return [min, max];
	}

	const e10 = Math.sqrt(50),
	    e5 = Math.sqrt(10),
	    e2 = Math.sqrt(2);

	function tickSpec(start, stop, count) {
	  const step = (stop - start) / Math.max(0, count),
	      power = Math.floor(Math.log10(step)),
	      error = step / Math.pow(10, power),
	      factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
	  let i1, i2, inc;
	  if (power < 0) {
	    inc = Math.pow(10, -power) / factor;
	    i1 = Math.round(start * inc);
	    i2 = Math.round(stop * inc);
	    if (i1 / inc < start) ++i1;
	    if (i2 / inc > stop) --i2;
	    inc = -inc;
	  } else {
	    inc = Math.pow(10, power) * factor;
	    i1 = Math.round(start / inc);
	    i2 = Math.round(stop / inc);
	    if (i1 * inc < start) ++i1;
	    if (i2 * inc > stop) --i2;
	  }
	  if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
	  return [i1, i2, inc];
	}

	function ticks(start, stop, count) {
	  stop = +stop, start = +start, count = +count;
	  if (!(count > 0)) return [];
	  if (start === stop) return [start];
	  const reverse = stop < start, [i1, i2, inc] = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count);
	  if (!(i2 >= i1)) return [];
	  const n = i2 - i1 + 1, ticks = new Array(n);
	  if (reverse) {
	    if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) / -inc;
	    else for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) * inc;
	  } else {
	    if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) / -inc;
	    else for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) * inc;
	  }
	  return ticks;
	}

	function tickIncrement(start, stop, count) {
	  stop = +stop, start = +start, count = +count;
	  return tickSpec(start, stop, count)[2];
	}

	function tickStep(start, stop, count) {
	  stop = +stop, start = +start, count = +count;
	  const reverse = stop < start, inc = reverse ? tickIncrement(stop, start, count) : tickIncrement(start, stop, count);
	  return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
	}

	function identity$3(x) {
	  return x;
	}

	var top = 1,
	    right = 2,
	    bottom = 3,
	    left = 4,
	    epsilon$1 = 1e-6;

	function translateX(x) {
	  return "translate(" + x + ",0)";
	}

	function translateY(y) {
	  return "translate(0," + y + ")";
	}

	function number$1(scale) {
	  return d => +scale(d);
	}

	function center(scale, offset) {
	  offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
	  if (scale.round()) offset = Math.round(offset);
	  return d => +scale(d) + offset;
	}

	function entering() {
	  return !this.__axis;
	}

	function axis(orient, scale) {
	  var tickArguments = [],
	      tickValues = null,
	      tickFormat = null,
	      tickSizeInner = 6,
	      tickSizeOuter = 6,
	      tickPadding = 3,
	      offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5,
	      k = orient === top || orient === left ? -1 : 1,
	      x = orient === left || orient === right ? "x" : "y",
	      transform = orient === top || orient === bottom ? translateX : translateY;

	  function axis(context) {
	    var values = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
	        format = tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$3) : tickFormat,
	        spacing = Math.max(tickSizeInner, 0) + tickPadding,
	        range = scale.range(),
	        range0 = +range[0] + offset,
	        range1 = +range[range.length - 1] + offset,
	        position = (scale.bandwidth ? center : number$1)(scale.copy(), offset),
	        selection = context.selection ? context.selection() : context,
	        path = selection.selectAll(".domain").data([null]),
	        tick = selection.selectAll(".tick").data(values, scale).order(),
	        tickExit = tick.exit(),
	        tickEnter = tick.enter().append("g").attr("class", "tick"),
	        line = tick.select("line"),
	        text = tick.select("text");

	    path = path.merge(path.enter().insert("path", ".tick")
	        .attr("class", "domain")
	        .attr("stroke", "currentColor"));

	    tick = tick.merge(tickEnter);

	    line = line.merge(tickEnter.append("line")
	        .attr("stroke", "currentColor")
	        .attr(x + "2", k * tickSizeInner));

	    text = text.merge(tickEnter.append("text")
	        .attr("fill", "currentColor")
	        .attr(x, k * spacing)
	        .attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));

	    if (context !== selection) {
	      path = path.transition(context);
	      tick = tick.transition(context);
	      line = line.transition(context);
	      text = text.transition(context);

	      tickExit = tickExit.transition(context)
	          .attr("opacity", epsilon$1)
	          .attr("transform", function(d) { return isFinite(d = position(d)) ? transform(d + offset) : this.getAttribute("transform"); });

	      tickEnter
	          .attr("opacity", epsilon$1)
	          .attr("transform", function(d) { var p = this.parentNode.__axis; return transform((p && isFinite(p = p(d)) ? p : position(d)) + offset); });
	    }

	    tickExit.remove();

	    path
	        .attr("d", orient === left || orient === right
	            ? (tickSizeOuter ? "M" + k * tickSizeOuter + "," + range0 + "H" + offset + "V" + range1 + "H" + k * tickSizeOuter : "M" + offset + "," + range0 + "V" + range1)
	            : (tickSizeOuter ? "M" + range0 + "," + k * tickSizeOuter + "V" + offset + "H" + range1 + "V" + k * tickSizeOuter : "M" + range0 + "," + offset + "H" + range1));

	    tick
	        .attr("opacity", 1)
	        .attr("transform", function(d) { return transform(position(d) + offset); });

	    line
	        .attr(x + "2", k * tickSizeInner);

	    text
	        .attr(x, k * spacing)
	        .text(format);

	    selection.filter(entering)
	        .attr("fill", "none")
	        .attr("font-size", 10)
	        .attr("font-family", "sans-serif")
	        .attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");

	    selection
	        .each(function() { this.__axis = position; });
	  }

	  axis.scale = function(_) {
	    return arguments.length ? (scale = _, axis) : scale;
	  };

	  axis.ticks = function() {
	    return tickArguments = Array.from(arguments), axis;
	  };

	  axis.tickArguments = function(_) {
	    return arguments.length ? (tickArguments = _ == null ? [] : Array.from(_), axis) : tickArguments.slice();
	  };

	  axis.tickValues = function(_) {
	    return arguments.length ? (tickValues = _ == null ? null : Array.from(_), axis) : tickValues && tickValues.slice();
	  };

	  axis.tickFormat = function(_) {
	    return arguments.length ? (tickFormat = _, axis) : tickFormat;
	  };

	  axis.tickSize = function(_) {
	    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
	  };

	  axis.tickSizeInner = function(_) {
	    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
	  };

	  axis.tickSizeOuter = function(_) {
	    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
	  };

	  axis.tickPadding = function(_) {
	    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
	  };

	  axis.offset = function(_) {
	    return arguments.length ? (offset = +_, axis) : offset;
	  };

	  return axis;
	}

	function axisBottom(scale) {
	  return axis(bottom, scale);
	}

	function axisLeft(scale) {
	  return axis(left, scale);
	}

	var noop = {value: () => {}};

	function dispatch() {
	  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
	    if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
	    _[t] = [];
	  }
	  return new Dispatch(_);
	}

	function Dispatch(_) {
	  this._ = _;
	}

	function parseTypenames$1(typenames, types) {
	  return typenames.trim().split(/^|\s+/).map(function(t) {
	    var name = "", i = t.indexOf(".");
	    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
	    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
	    return {type: t, name: name};
	  });
	}

	Dispatch.prototype = dispatch.prototype = {
	  constructor: Dispatch,
	  on: function(typename, callback) {
	    var _ = this._,
	        T = parseTypenames$1(typename + "", _),
	        t,
	        i = -1,
	        n = T.length;

	    // If no callback was specified, return the callback of the given type and name.
	    if (arguments.length < 2) {
	      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
	      return;
	    }

	    // If a type was specified, set the callback for the given type and name.
	    // Otherwise, if a null callback was specified, remove callbacks of the given name.
	    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
	    while (++i < n) {
	      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
	      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
	    }

	    return this;
	  },
	  copy: function() {
	    var copy = {}, _ = this._;
	    for (var t in _) copy[t] = _[t].slice();
	    return new Dispatch(copy);
	  },
	  call: function(type, that) {
	    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
	    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
	    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
	  },
	  apply: function(type, that, args) {
	    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
	    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
	  }
	};

	function get$1(type, name) {
	  for (var i = 0, n = type.length, c; i < n; ++i) {
	    if ((c = type[i]).name === name) {
	      return c.value;
	    }
	  }
	}

	function set$1(type, name, callback) {
	  for (var i = 0, n = type.length; i < n; ++i) {
	    if (type[i].name === name) {
	      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
	      break;
	    }
	  }
	  if (callback != null) type.push({name: name, value: callback});
	  return type;
	}

	var xhtml = "http://www.w3.org/1999/xhtml";

	var namespaces = {
	  svg: "http://www.w3.org/2000/svg",
	  xhtml: xhtml,
	  xlink: "http://www.w3.org/1999/xlink",
	  xml: "http://www.w3.org/XML/1998/namespace",
	  xmlns: "http://www.w3.org/2000/xmlns/"
	};

	function namespace(name) {
	  var prefix = name += "", i = prefix.indexOf(":");
	  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
	  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
	}

	function creatorInherit(name) {
	  return function() {
	    var document = this.ownerDocument,
	        uri = this.namespaceURI;
	    return uri === xhtml && document.documentElement.namespaceURI === xhtml
	        ? document.createElement(name)
	        : document.createElementNS(uri, name);
	  };
	}

	function creatorFixed(fullname) {
	  return function() {
	    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
	  };
	}

	function creator(name) {
	  var fullname = namespace(name);
	  return (fullname.local
	      ? creatorFixed
	      : creatorInherit)(fullname);
	}

	function none() {}

	function selector(selector) {
	  return selector == null ? none : function() {
	    return this.querySelector(selector);
	  };
	}

	function selection_select(select) {
	  if (typeof select !== "function") select = selector(select);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
	      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
	        if ("__data__" in node) subnode.__data__ = node.__data__;
	        subgroup[i] = subnode;
	      }
	    }
	  }

	  return new Selection$1(subgroups, this._parents);
	}

	// Given something array like (or null), returns something that is strictly an
	// array. This is used to ensure that array-like objects passed to d3.selectAll
	// or selection.selectAll are converted into proper arrays when creating a
	// selection; we don’t ever want to create a selection backed by a live
	// HTMLCollection or NodeList. However, note that selection.selectAll will use a
	// static NodeList as a group, since it safely derived from querySelectorAll.
	function array$1(x) {
	  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
	}

	function empty() {
	  return [];
	}

	function selectorAll(selector) {
	  return selector == null ? empty : function() {
	    return this.querySelectorAll(selector);
	  };
	}

	function arrayAll(select) {
	  return function() {
	    return array$1(select.apply(this, arguments));
	  };
	}

	function selection_selectAll(select) {
	  if (typeof select === "function") select = arrayAll(select);
	  else select = selectorAll(select);

	  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        subgroups.push(select.call(node, node.__data__, i, group));
	        parents.push(node);
	      }
	    }
	  }

	  return new Selection$1(subgroups, parents);
	}

	function matcher(selector) {
	  return function() {
	    return this.matches(selector);
	  };
	}

	function childMatcher(selector) {
	  return function(node) {
	    return node.matches(selector);
	  };
	}

	var find = Array.prototype.find;

	function childFind(match) {
	  return function() {
	    return find.call(this.children, match);
	  };
	}

	function childFirst() {
	  return this.firstElementChild;
	}

	function selection_selectChild(match) {
	  return this.select(match == null ? childFirst
	      : childFind(typeof match === "function" ? match : childMatcher(match)));
	}

	var filter = Array.prototype.filter;

	function children() {
	  return Array.from(this.children);
	}

	function childrenFilter(match) {
	  return function() {
	    return filter.call(this.children, match);
	  };
	}

	function selection_selectChildren(match) {
	  return this.selectAll(match == null ? children
	      : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
	}

	function selection_filter(match) {
	  if (typeof match !== "function") match = matcher(match);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
	      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
	        subgroup.push(node);
	      }
	    }
	  }

	  return new Selection$1(subgroups, this._parents);
	}

	function sparse(update) {
	  return new Array(update.length);
	}

	function selection_enter() {
	  return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
	}

	function EnterNode(parent, datum) {
	  this.ownerDocument = parent.ownerDocument;
	  this.namespaceURI = parent.namespaceURI;
	  this._next = null;
	  this._parent = parent;
	  this.__data__ = datum;
	}

	EnterNode.prototype = {
	  constructor: EnterNode,
	  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
	  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
	  querySelector: function(selector) { return this._parent.querySelector(selector); },
	  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
	};

	function constant$2(x) {
	  return function() {
	    return x;
	  };
	}

	function bindIndex(parent, group, enter, update, exit, data) {
	  var i = 0,
	      node,
	      groupLength = group.length,
	      dataLength = data.length;

	  // Put any non-null nodes that fit into update.
	  // Put any null nodes into enter.
	  // Put any remaining data into enter.
	  for (; i < dataLength; ++i) {
	    if (node = group[i]) {
	      node.__data__ = data[i];
	      update[i] = node;
	    } else {
	      enter[i] = new EnterNode(parent, data[i]);
	    }
	  }

	  // Put any non-null nodes that don’t fit into exit.
	  for (; i < groupLength; ++i) {
	    if (node = group[i]) {
	      exit[i] = node;
	    }
	  }
	}

	function bindKey(parent, group, enter, update, exit, data, key) {
	  var i,
	      node,
	      nodeByKeyValue = new Map,
	      groupLength = group.length,
	      dataLength = data.length,
	      keyValues = new Array(groupLength),
	      keyValue;

	  // Compute the key for each node.
	  // If multiple nodes have the same key, the duplicates are added to exit.
	  for (i = 0; i < groupLength; ++i) {
	    if (node = group[i]) {
	      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
	      if (nodeByKeyValue.has(keyValue)) {
	        exit[i] = node;
	      } else {
	        nodeByKeyValue.set(keyValue, node);
	      }
	    }
	  }

	  // Compute the key for each datum.
	  // If there a node associated with this key, join and add it to update.
	  // If there is not (or the key is a duplicate), add it to enter.
	  for (i = 0; i < dataLength; ++i) {
	    keyValue = key.call(parent, data[i], i, data) + "";
	    if (node = nodeByKeyValue.get(keyValue)) {
	      update[i] = node;
	      node.__data__ = data[i];
	      nodeByKeyValue.delete(keyValue);
	    } else {
	      enter[i] = new EnterNode(parent, data[i]);
	    }
	  }

	  // Add any remaining nodes that were not bound to data to exit.
	  for (i = 0; i < groupLength; ++i) {
	    if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
	      exit[i] = node;
	    }
	  }
	}

	function datum(node) {
	  return node.__data__;
	}

	function selection_data(value, key) {
	  if (!arguments.length) return Array.from(this, datum);

	  var bind = key ? bindKey : bindIndex,
	      parents = this._parents,
	      groups = this._groups;

	  if (typeof value !== "function") value = constant$2(value);

	  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
	    var parent = parents[j],
	        group = groups[j],
	        groupLength = group.length,
	        data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
	        dataLength = data.length,
	        enterGroup = enter[j] = new Array(dataLength),
	        updateGroup = update[j] = new Array(dataLength),
	        exitGroup = exit[j] = new Array(groupLength);

	    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

	    // Now connect the enter nodes to their following update node, such that
	    // appendChild can insert the materialized enter node before this node,
	    // rather than at the end of the parent node.
	    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
	      if (previous = enterGroup[i0]) {
	        if (i0 >= i1) i1 = i0 + 1;
	        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
	        previous._next = next || null;
	      }
	    }
	  }

	  update = new Selection$1(update, parents);
	  update._enter = enter;
	  update._exit = exit;
	  return update;
	}

	// Given some data, this returns an array-like view of it: an object that
	// exposes a length property and allows numeric indexing. Note that unlike
	// selectAll, this isn’t worried about “live” collections because the resulting
	// array will only be used briefly while data is being bound. (It is possible to
	// cause the data to change while iterating by using a key function, but please
	// don’t; we’d rather avoid a gratuitous copy.)
	function arraylike(data) {
	  return typeof data === "object" && "length" in data
	    ? data // Array, TypedArray, NodeList, array-like
	    : Array.from(data); // Map, Set, iterable, string, or anything else
	}

	function selection_exit() {
	  return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
	}

	function selection_join(onenter, onupdate, onexit) {
	  var enter = this.enter(), update = this, exit = this.exit();
	  if (typeof onenter === "function") {
	    enter = onenter(enter);
	    if (enter) enter = enter.selection();
	  } else {
	    enter = enter.append(onenter + "");
	  }
	  if (onupdate != null) {
	    update = onupdate(update);
	    if (update) update = update.selection();
	  }
	  if (onexit == null) exit.remove(); else onexit(exit);
	  return enter && update ? enter.merge(update).order() : update;
	}

	function selection_merge(context) {
	  var selection = context.selection ? context.selection() : context;

	  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
	    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group0[i] || group1[i]) {
	        merge[i] = node;
	      }
	    }
	  }

	  for (; j < m0; ++j) {
	    merges[j] = groups0[j];
	  }

	  return new Selection$1(merges, this._parents);
	}

	function selection_order() {

	  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
	    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
	      if (node = group[i]) {
	        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
	        next = node;
	      }
	    }
	  }

	  return this;
	}

	function selection_sort(compare) {
	  if (!compare) compare = ascending;

	  function compareNode(a, b) {
	    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
	  }

	  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        sortgroup[i] = node;
	      }
	    }
	    sortgroup.sort(compareNode);
	  }

	  return new Selection$1(sortgroups, this._parents).order();
	}

	function ascending(a, b) {
	  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
	}

	function selection_call() {
	  var callback = arguments[0];
	  arguments[0] = this;
	  callback.apply(null, arguments);
	  return this;
	}

	function selection_nodes() {
	  return Array.from(this);
	}

	function selection_node() {

	  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
	    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
	      var node = group[i];
	      if (node) return node;
	    }
	  }

	  return null;
	}

	function selection_size() {
	  let size = 0;
	  for (const node of this) ++size; // eslint-disable-line no-unused-vars
	  return size;
	}

	function selection_empty() {
	  return !this.node();
	}

	function selection_each(callback) {

	  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
	    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
	      if (node = group[i]) callback.call(node, node.__data__, i, group);
	    }
	  }

	  return this;
	}

	function attrRemove$1(name) {
	  return function() {
	    this.removeAttribute(name);
	  };
	}

	function attrRemoveNS$1(fullname) {
	  return function() {
	    this.removeAttributeNS(fullname.space, fullname.local);
	  };
	}

	function attrConstant$1(name, value) {
	  return function() {
	    this.setAttribute(name, value);
	  };
	}

	function attrConstantNS$1(fullname, value) {
	  return function() {
	    this.setAttributeNS(fullname.space, fullname.local, value);
	  };
	}

	function attrFunction$1(name, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.removeAttribute(name);
	    else this.setAttribute(name, v);
	  };
	}

	function attrFunctionNS$1(fullname, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
	    else this.setAttributeNS(fullname.space, fullname.local, v);
	  };
	}

	function selection_attr(name, value) {
	  var fullname = namespace(name);

	  if (arguments.length < 2) {
	    var node = this.node();
	    return fullname.local
	        ? node.getAttributeNS(fullname.space, fullname.local)
	        : node.getAttribute(fullname);
	  }

	  return this.each((value == null
	      ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
	      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
	      : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
	}

	function defaultView(node) {
	  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
	      || (node.document && node) // node is a Window
	      || node.defaultView; // node is a Document
	}

	function styleRemove$1(name) {
	  return function() {
	    this.style.removeProperty(name);
	  };
	}

	function styleConstant$1(name, value, priority) {
	  return function() {
	    this.style.setProperty(name, value, priority);
	  };
	}

	function styleFunction$1(name, value, priority) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) this.style.removeProperty(name);
	    else this.style.setProperty(name, v, priority);
	  };
	}

	function selection_style(name, value, priority) {
	  return arguments.length > 1
	      ? this.each((value == null
	            ? styleRemove$1 : typeof value === "function"
	            ? styleFunction$1
	            : styleConstant$1)(name, value, priority == null ? "" : priority))
	      : styleValue(this.node(), name);
	}

	function styleValue(node, name) {
	  return node.style.getPropertyValue(name)
	      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
	}

	function propertyRemove(name) {
	  return function() {
	    delete this[name];
	  };
	}

	function propertyConstant(name, value) {
	  return function() {
	    this[name] = value;
	  };
	}

	function propertyFunction(name, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (v == null) delete this[name];
	    else this[name] = v;
	  };
	}

	function selection_property(name, value) {
	  return arguments.length > 1
	      ? this.each((value == null
	          ? propertyRemove : typeof value === "function"
	          ? propertyFunction
	          : propertyConstant)(name, value))
	      : this.node()[name];
	}

	function classArray(string) {
	  return string.trim().split(/^|\s+/);
	}

	function classList(node) {
	  return node.classList || new ClassList(node);
	}

	function ClassList(node) {
	  this._node = node;
	  this._names = classArray(node.getAttribute("class") || "");
	}

	ClassList.prototype = {
	  add: function(name) {
	    var i = this._names.indexOf(name);
	    if (i < 0) {
	      this._names.push(name);
	      this._node.setAttribute("class", this._names.join(" "));
	    }
	  },
	  remove: function(name) {
	    var i = this._names.indexOf(name);
	    if (i >= 0) {
	      this._names.splice(i, 1);
	      this._node.setAttribute("class", this._names.join(" "));
	    }
	  },
	  contains: function(name) {
	    return this._names.indexOf(name) >= 0;
	  }
	};

	function classedAdd(node, names) {
	  var list = classList(node), i = -1, n = names.length;
	  while (++i < n) list.add(names[i]);
	}

	function classedRemove(node, names) {
	  var list = classList(node), i = -1, n = names.length;
	  while (++i < n) list.remove(names[i]);
	}

	function classedTrue(names) {
	  return function() {
	    classedAdd(this, names);
	  };
	}

	function classedFalse(names) {
	  return function() {
	    classedRemove(this, names);
	  };
	}

	function classedFunction(names, value) {
	  return function() {
	    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
	  };
	}

	function selection_classed(name, value) {
	  var names = classArray(name + "");

	  if (arguments.length < 2) {
	    var list = classList(this.node()), i = -1, n = names.length;
	    while (++i < n) if (!list.contains(names[i])) return false;
	    return true;
	  }

	  return this.each((typeof value === "function"
	      ? classedFunction : value
	      ? classedTrue
	      : classedFalse)(names, value));
	}

	function textRemove() {
	  this.textContent = "";
	}

	function textConstant$1(value) {
	  return function() {
	    this.textContent = value;
	  };
	}

	function textFunction$1(value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    this.textContent = v == null ? "" : v;
	  };
	}

	function selection_text(value) {
	  return arguments.length
	      ? this.each(value == null
	          ? textRemove : (typeof value === "function"
	          ? textFunction$1
	          : textConstant$1)(value))
	      : this.node().textContent;
	}

	function htmlRemove() {
	  this.innerHTML = "";
	}

	function htmlConstant(value) {
	  return function() {
	    this.innerHTML = value;
	  };
	}

	function htmlFunction(value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    this.innerHTML = v == null ? "" : v;
	  };
	}

	function selection_html(value) {
	  return arguments.length
	      ? this.each(value == null
	          ? htmlRemove : (typeof value === "function"
	          ? htmlFunction
	          : htmlConstant)(value))
	      : this.node().innerHTML;
	}

	function raise() {
	  if (this.nextSibling) this.parentNode.appendChild(this);
	}

	function selection_raise() {
	  return this.each(raise);
	}

	function lower() {
	  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
	}

	function selection_lower() {
	  return this.each(lower);
	}

	function selection_append(name) {
	  var create = typeof name === "function" ? name : creator(name);
	  return this.select(function() {
	    return this.appendChild(create.apply(this, arguments));
	  });
	}

	function constantNull() {
	  return null;
	}

	function selection_insert(name, before) {
	  var create = typeof name === "function" ? name : creator(name),
	      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
	  return this.select(function() {
	    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
	  });
	}

	function remove() {
	  var parent = this.parentNode;
	  if (parent) parent.removeChild(this);
	}

	function selection_remove() {
	  return this.each(remove);
	}

	function selection_cloneShallow() {
	  var clone = this.cloneNode(false), parent = this.parentNode;
	  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
	}

	function selection_cloneDeep() {
	  var clone = this.cloneNode(true), parent = this.parentNode;
	  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
	}

	function selection_clone(deep) {
	  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
	}

	function selection_datum(value) {
	  return arguments.length
	      ? this.property("__data__", value)
	      : this.node().__data__;
	}

	function contextListener(listener) {
	  return function(event) {
	    listener.call(this, event, this.__data__);
	  };
	}

	function parseTypenames(typenames) {
	  return typenames.trim().split(/^|\s+/).map(function(t) {
	    var name = "", i = t.indexOf(".");
	    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
	    return {type: t, name: name};
	  });
	}

	function onRemove(typename) {
	  return function() {
	    var on = this.__on;
	    if (!on) return;
	    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
	      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
	        this.removeEventListener(o.type, o.listener, o.options);
	      } else {
	        on[++i] = o;
	      }
	    }
	    if (++i) on.length = i;
	    else delete this.__on;
	  };
	}

	function onAdd(typename, value, options) {
	  return function() {
	    var on = this.__on, o, listener = contextListener(value);
	    if (on) for (var j = 0, m = on.length; j < m; ++j) {
	      if ((o = on[j]).type === typename.type && o.name === typename.name) {
	        this.removeEventListener(o.type, o.listener, o.options);
	        this.addEventListener(o.type, o.listener = listener, o.options = options);
	        o.value = value;
	        return;
	      }
	    }
	    this.addEventListener(typename.type, listener, options);
	    o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
	    if (!on) this.__on = [o];
	    else on.push(o);
	  };
	}

	function selection_on(typename, value, options) {
	  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

	  if (arguments.length < 2) {
	    var on = this.node().__on;
	    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
	      for (i = 0, o = on[j]; i < n; ++i) {
	        if ((t = typenames[i]).type === o.type && t.name === o.name) {
	          return o.value;
	        }
	      }
	    }
	    return;
	  }

	  on = value ? onAdd : onRemove;
	  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
	  return this;
	}

	function dispatchEvent(node, type, params) {
	  var window = defaultView(node),
	      event = window.CustomEvent;

	  if (typeof event === "function") {
	    event = new event(type, params);
	  } else {
	    event = window.document.createEvent("Event");
	    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
	    else event.initEvent(type, false, false);
	  }

	  node.dispatchEvent(event);
	}

	function dispatchConstant(type, params) {
	  return function() {
	    return dispatchEvent(this, type, params);
	  };
	}

	function dispatchFunction(type, params) {
	  return function() {
	    return dispatchEvent(this, type, params.apply(this, arguments));
	  };
	}

	function selection_dispatch(type, params) {
	  return this.each((typeof params === "function"
	      ? dispatchFunction
	      : dispatchConstant)(type, params));
	}

	function* selection_iterator() {
	  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
	    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
	      if (node = group[i]) yield node;
	    }
	  }
	}

	var root = [null];

	function Selection$1(groups, parents) {
	  this._groups = groups;
	  this._parents = parents;
	}

	function selection() {
	  return new Selection$1([[document.documentElement]], root);
	}

	function selection_selection() {
	  return this;
	}

	Selection$1.prototype = selection.prototype = {
	  constructor: Selection$1,
	  select: selection_select,
	  selectAll: selection_selectAll,
	  selectChild: selection_selectChild,
	  selectChildren: selection_selectChildren,
	  filter: selection_filter,
	  data: selection_data,
	  enter: selection_enter,
	  exit: selection_exit,
	  join: selection_join,
	  merge: selection_merge,
	  selection: selection_selection,
	  order: selection_order,
	  sort: selection_sort,
	  call: selection_call,
	  nodes: selection_nodes,
	  node: selection_node,
	  size: selection_size,
	  empty: selection_empty,
	  each: selection_each,
	  attr: selection_attr,
	  style: selection_style,
	  property: selection_property,
	  classed: selection_classed,
	  text: selection_text,
	  html: selection_html,
	  raise: selection_raise,
	  lower: selection_lower,
	  append: selection_append,
	  insert: selection_insert,
	  remove: selection_remove,
	  clone: selection_clone,
	  datum: selection_datum,
	  on: selection_on,
	  dispatch: selection_dispatch,
	  [Symbol.iterator]: selection_iterator
	};

	function select(selector) {
	  return typeof selector === "string"
	      ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
	      : new Selection$1([[selector]], root);
	}

	function define(constructor, factory, prototype) {
	  constructor.prototype = factory.prototype = prototype;
	  prototype.constructor = constructor;
	}

	function extend(parent, definition) {
	  var prototype = Object.create(parent.prototype);
	  for (var key in definition) prototype[key] = definition[key];
	  return prototype;
	}

	function Color() {}

	var darker = 0.7;
	var brighter = 1 / darker;

	var reI = "\\s*([+-]?\\d+)\\s*",
	    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
	    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
	    reHex = /^#([0-9a-f]{3,8})$/,
	    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
	    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
	    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
	    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
	    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
	    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

	var named = {
	  aliceblue: 0xf0f8ff,
	  antiquewhite: 0xfaebd7,
	  aqua: 0x00ffff,
	  aquamarine: 0x7fffd4,
	  azure: 0xf0ffff,
	  beige: 0xf5f5dc,
	  bisque: 0xffe4c4,
	  black: 0x000000,
	  blanchedalmond: 0xffebcd,
	  blue: 0x0000ff,
	  blueviolet: 0x8a2be2,
	  brown: 0xa52a2a,
	  burlywood: 0xdeb887,
	  cadetblue: 0x5f9ea0,
	  chartreuse: 0x7fff00,
	  chocolate: 0xd2691e,
	  coral: 0xff7f50,
	  cornflowerblue: 0x6495ed,
	  cornsilk: 0xfff8dc,
	  crimson: 0xdc143c,
	  cyan: 0x00ffff,
	  darkblue: 0x00008b,
	  darkcyan: 0x008b8b,
	  darkgoldenrod: 0xb8860b,
	  darkgray: 0xa9a9a9,
	  darkgreen: 0x006400,
	  darkgrey: 0xa9a9a9,
	  darkkhaki: 0xbdb76b,
	  darkmagenta: 0x8b008b,
	  darkolivegreen: 0x556b2f,
	  darkorange: 0xff8c00,
	  darkorchid: 0x9932cc,
	  darkred: 0x8b0000,
	  darksalmon: 0xe9967a,
	  darkseagreen: 0x8fbc8f,
	  darkslateblue: 0x483d8b,
	  darkslategray: 0x2f4f4f,
	  darkslategrey: 0x2f4f4f,
	  darkturquoise: 0x00ced1,
	  darkviolet: 0x9400d3,
	  deeppink: 0xff1493,
	  deepskyblue: 0x00bfff,
	  dimgray: 0x696969,
	  dimgrey: 0x696969,
	  dodgerblue: 0x1e90ff,
	  firebrick: 0xb22222,
	  floralwhite: 0xfffaf0,
	  forestgreen: 0x228b22,
	  fuchsia: 0xff00ff,
	  gainsboro: 0xdcdcdc,
	  ghostwhite: 0xf8f8ff,
	  gold: 0xffd700,
	  goldenrod: 0xdaa520,
	  gray: 0x808080,
	  green: 0x008000,
	  greenyellow: 0xadff2f,
	  grey: 0x808080,
	  honeydew: 0xf0fff0,
	  hotpink: 0xff69b4,
	  indianred: 0xcd5c5c,
	  indigo: 0x4b0082,
	  ivory: 0xfffff0,
	  khaki: 0xf0e68c,
	  lavender: 0xe6e6fa,
	  lavenderblush: 0xfff0f5,
	  lawngreen: 0x7cfc00,
	  lemonchiffon: 0xfffacd,
	  lightblue: 0xadd8e6,
	  lightcoral: 0xf08080,
	  lightcyan: 0xe0ffff,
	  lightgoldenrodyellow: 0xfafad2,
	  lightgray: 0xd3d3d3,
	  lightgreen: 0x90ee90,
	  lightgrey: 0xd3d3d3,
	  lightpink: 0xffb6c1,
	  lightsalmon: 0xffa07a,
	  lightseagreen: 0x20b2aa,
	  lightskyblue: 0x87cefa,
	  lightslategray: 0x778899,
	  lightslategrey: 0x778899,
	  lightsteelblue: 0xb0c4de,
	  lightyellow: 0xffffe0,
	  lime: 0x00ff00,
	  limegreen: 0x32cd32,
	  linen: 0xfaf0e6,
	  magenta: 0xff00ff,
	  maroon: 0x800000,
	  mediumaquamarine: 0x66cdaa,
	  mediumblue: 0x0000cd,
	  mediumorchid: 0xba55d3,
	  mediumpurple: 0x9370db,
	  mediumseagreen: 0x3cb371,
	  mediumslateblue: 0x7b68ee,
	  mediumspringgreen: 0x00fa9a,
	  mediumturquoise: 0x48d1cc,
	  mediumvioletred: 0xc71585,
	  midnightblue: 0x191970,
	  mintcream: 0xf5fffa,
	  mistyrose: 0xffe4e1,
	  moccasin: 0xffe4b5,
	  navajowhite: 0xffdead,
	  navy: 0x000080,
	  oldlace: 0xfdf5e6,
	  olive: 0x808000,
	  olivedrab: 0x6b8e23,
	  orange: 0xffa500,
	  orangered: 0xff4500,
	  orchid: 0xda70d6,
	  palegoldenrod: 0xeee8aa,
	  palegreen: 0x98fb98,
	  paleturquoise: 0xafeeee,
	  palevioletred: 0xdb7093,
	  papayawhip: 0xffefd5,
	  peachpuff: 0xffdab9,
	  peru: 0xcd853f,
	  pink: 0xffc0cb,
	  plum: 0xdda0dd,
	  powderblue: 0xb0e0e6,
	  purple: 0x800080,
	  rebeccapurple: 0x663399,
	  red: 0xff0000,
	  rosybrown: 0xbc8f8f,
	  royalblue: 0x4169e1,
	  saddlebrown: 0x8b4513,
	  salmon: 0xfa8072,
	  sandybrown: 0xf4a460,
	  seagreen: 0x2e8b57,
	  seashell: 0xfff5ee,
	  sienna: 0xa0522d,
	  silver: 0xc0c0c0,
	  skyblue: 0x87ceeb,
	  slateblue: 0x6a5acd,
	  slategray: 0x708090,
	  slategrey: 0x708090,
	  snow: 0xfffafa,
	  springgreen: 0x00ff7f,
	  steelblue: 0x4682b4,
	  tan: 0xd2b48c,
	  teal: 0x008080,
	  thistle: 0xd8bfd8,
	  tomato: 0xff6347,
	  turquoise: 0x40e0d0,
	  violet: 0xee82ee,
	  wheat: 0xf5deb3,
	  white: 0xffffff,
	  whitesmoke: 0xf5f5f5,
	  yellow: 0xffff00,
	  yellowgreen: 0x9acd32
	};

	define(Color, color, {
	  copy(channels) {
	    return Object.assign(new this.constructor, this, channels);
	  },
	  displayable() {
	    return this.rgb().displayable();
	  },
	  hex: color_formatHex, // Deprecated! Use color.formatHex.
	  formatHex: color_formatHex,
	  formatHex8: color_formatHex8,
	  formatHsl: color_formatHsl,
	  formatRgb: color_formatRgb,
	  toString: color_formatRgb
	});

	function color_formatHex() {
	  return this.rgb().formatHex();
	}

	function color_formatHex8() {
	  return this.rgb().formatHex8();
	}

	function color_formatHsl() {
	  return hslConvert(this).formatHsl();
	}

	function color_formatRgb() {
	  return this.rgb().formatRgb();
	}

	function color(format) {
	  var m, l;
	  format = (format + "").trim().toLowerCase();
	  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
	      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
	      : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
	      : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
	      : null) // invalid hex
	      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
	      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
	      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
	      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
	      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
	      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
	      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
	      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
	      : null;
	}

	function rgbn(n) {
	  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
	}

	function rgba(r, g, b, a) {
	  if (a <= 0) r = g = b = NaN;
	  return new Rgb(r, g, b, a);
	}

	function rgbConvert(o) {
	  if (!(o instanceof Color)) o = color(o);
	  if (!o) return new Rgb;
	  o = o.rgb();
	  return new Rgb(o.r, o.g, o.b, o.opacity);
	}

	function rgb(r, g, b, opacity) {
	  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
	}

	function Rgb(r, g, b, opacity) {
	  this.r = +r;
	  this.g = +g;
	  this.b = +b;
	  this.opacity = +opacity;
	}

	define(Rgb, rgb, extend(Color, {
	  brighter(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  darker(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
	  },
	  rgb() {
	    return this;
	  },
	  clamp() {
	    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
	  },
	  displayable() {
	    return (-0.5 <= this.r && this.r < 255.5)
	        && (-0.5 <= this.g && this.g < 255.5)
	        && (-0.5 <= this.b && this.b < 255.5)
	        && (0 <= this.opacity && this.opacity <= 1);
	  },
	  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
	  formatHex: rgb_formatHex,
	  formatHex8: rgb_formatHex8,
	  formatRgb: rgb_formatRgb,
	  toString: rgb_formatRgb
	}));

	function rgb_formatHex() {
	  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
	}

	function rgb_formatHex8() {
	  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
	}

	function rgb_formatRgb() {
	  const a = clampa(this.opacity);
	  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
	}

	function clampa(opacity) {
	  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
	}

	function clampi(value) {
	  return Math.max(0, Math.min(255, Math.round(value) || 0));
	}

	function hex(value) {
	  value = clampi(value);
	  return (value < 16 ? "0" : "") + value.toString(16);
	}

	function hsla(h, s, l, a) {
	  if (a <= 0) h = s = l = NaN;
	  else if (l <= 0 || l >= 1) h = s = NaN;
	  else if (s <= 0) h = NaN;
	  return new Hsl(h, s, l, a);
	}

	function hslConvert(o) {
	  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
	  if (!(o instanceof Color)) o = color(o);
	  if (!o) return new Hsl;
	  if (o instanceof Hsl) return o;
	  o = o.rgb();
	  var r = o.r / 255,
	      g = o.g / 255,
	      b = o.b / 255,
	      min = Math.min(r, g, b),
	      max = Math.max(r, g, b),
	      h = NaN,
	      s = max - min,
	      l = (max + min) / 2;
	  if (s) {
	    if (r === max) h = (g - b) / s + (g < b) * 6;
	    else if (g === max) h = (b - r) / s + 2;
	    else h = (r - g) / s + 4;
	    s /= l < 0.5 ? max + min : 2 - max - min;
	    h *= 60;
	  } else {
	    s = l > 0 && l < 1 ? 0 : h;
	  }
	  return new Hsl(h, s, l, o.opacity);
	}

	function hsl(h, s, l, opacity) {
	  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
	}

	function Hsl(h, s, l, opacity) {
	  this.h = +h;
	  this.s = +s;
	  this.l = +l;
	  this.opacity = +opacity;
	}

	define(Hsl, hsl, extend(Color, {
	  brighter(k) {
	    k = k == null ? brighter : Math.pow(brighter, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  darker(k) {
	    k = k == null ? darker : Math.pow(darker, k);
	    return new Hsl(this.h, this.s, this.l * k, this.opacity);
	  },
	  rgb() {
	    var h = this.h % 360 + (this.h < 0) * 360,
	        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
	        l = this.l,
	        m2 = l + (l < 0.5 ? l : 1 - l) * s,
	        m1 = 2 * l - m2;
	    return new Rgb(
	      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
	      hsl2rgb(h, m1, m2),
	      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
	      this.opacity
	    );
	  },
	  clamp() {
	    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
	  },
	  displayable() {
	    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
	        && (0 <= this.l && this.l <= 1)
	        && (0 <= this.opacity && this.opacity <= 1);
	  },
	  formatHsl() {
	    const a = clampa(this.opacity);
	    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
	  }
	}));

	function clamph(value) {
	  value = (value || 0) % 360;
	  return value < 0 ? value + 360 : value;
	}

	function clampt(value) {
	  return Math.max(0, Math.min(1, value || 0));
	}

	/* From FvD 13.37, CSS Color Module Level 3 */
	function hsl2rgb(h, m1, m2) {
	  return (h < 60 ? m1 + (m2 - m1) * h / 60
	      : h < 180 ? m2
	      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
	      : m1) * 255;
	}

	var constant$1 = x => () => x;

	function linear$1(a, d) {
	  return function(t) {
	    return a + t * d;
	  };
	}

	function exponential(a, b, y) {
	  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
	    return Math.pow(a + t * b, y);
	  };
	}

	function gamma(y) {
	  return (y = +y) === 1 ? nogamma : function(a, b) {
	    return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
	  };
	}

	function nogamma(a, b) {
	  var d = b - a;
	  return d ? linear$1(a, d) : constant$1(isNaN(a) ? b : a);
	}

	var interpolateRgb = (function rgbGamma(y) {
	  var color = gamma(y);

	  function rgb$1(start, end) {
	    var r = color((start = rgb(start)).r, (end = rgb(end)).r),
	        g = color(start.g, end.g),
	        b = color(start.b, end.b),
	        opacity = nogamma(start.opacity, end.opacity);
	    return function(t) {
	      start.r = r(t);
	      start.g = g(t);
	      start.b = b(t);
	      start.opacity = opacity(t);
	      return start + "";
	    };
	  }

	  rgb$1.gamma = rgbGamma;

	  return rgb$1;
	})(1);

	function numberArray(a, b) {
	  if (!b) b = [];
	  var n = a ? Math.min(b.length, a.length) : 0,
	      c = b.slice(),
	      i;
	  return function(t) {
	    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
	    return c;
	  };
	}

	function isNumberArray(x) {
	  return ArrayBuffer.isView(x) && !(x instanceof DataView);
	}

	function genericArray(a, b) {
	  var nb = b ? b.length : 0,
	      na = a ? Math.min(nb, a.length) : 0,
	      x = new Array(na),
	      c = new Array(nb),
	      i;

	  for (i = 0; i < na; ++i) x[i] = interpolate$1(a[i], b[i]);
	  for (; i < nb; ++i) c[i] = b[i];

	  return function(t) {
	    for (i = 0; i < na; ++i) c[i] = x[i](t);
	    return c;
	  };
	}

	function date(a, b) {
	  var d = new Date;
	  return a = +a, b = +b, function(t) {
	    return d.setTime(a * (1 - t) + b * t), d;
	  };
	}

	function interpolateNumber(a, b) {
	  return a = +a, b = +b, function(t) {
	    return a * (1 - t) + b * t;
	  };
	}

	function object(a, b) {
	  var i = {},
	      c = {},
	      k;

	  if (a === null || typeof a !== "object") a = {};
	  if (b === null || typeof b !== "object") b = {};

	  for (k in b) {
	    if (k in a) {
	      i[k] = interpolate$1(a[k], b[k]);
	    } else {
	      c[k] = b[k];
	    }
	  }

	  return function(t) {
	    for (k in i) c[k] = i[k](t);
	    return c;
	  };
	}

	var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
	    reB = new RegExp(reA.source, "g");

	function zero(b) {
	  return function() {
	    return b;
	  };
	}

	function one(b) {
	  return function(t) {
	    return b(t) + "";
	  };
	}

	function interpolateString(a, b) {
	  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
	      am, // current match in a
	      bm, // current match in b
	      bs, // string preceding current number in b, if any
	      i = -1, // index in s
	      s = [], // string constants and placeholders
	      q = []; // number interpolators

	  // Coerce inputs to strings.
	  a = a + "", b = b + "";

	  // Interpolate pairs of numbers in a & b.
	  while ((am = reA.exec(a))
	      && (bm = reB.exec(b))) {
	    if ((bs = bm.index) > bi) { // a string precedes the next number in b
	      bs = b.slice(bi, bs);
	      if (s[i]) s[i] += bs; // coalesce with previous string
	      else s[++i] = bs;
	    }
	    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
	      if (s[i]) s[i] += bm; // coalesce with previous string
	      else s[++i] = bm;
	    } else { // interpolate non-matching numbers
	      s[++i] = null;
	      q.push({i: i, x: interpolateNumber(am, bm)});
	    }
	    bi = reB.lastIndex;
	  }

	  // Add remains of b.
	  if (bi < b.length) {
	    bs = b.slice(bi);
	    if (s[i]) s[i] += bs; // coalesce with previous string
	    else s[++i] = bs;
	  }

	  // Special optimization for only a single match.
	  // Otherwise, interpolate each of the numbers and rejoin the string.
	  return s.length < 2 ? (q[0]
	      ? one(q[0].x)
	      : zero(b))
	      : (b = q.length, function(t) {
	          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
	          return s.join("");
	        });
	}

	function interpolate$1(a, b) {
	  var t = typeof b, c;
	  return b == null || t === "boolean" ? constant$1(b)
	      : (t === "number" ? interpolateNumber
	      : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
	      : b instanceof color ? interpolateRgb
	      : b instanceof Date ? date
	      : isNumberArray(b) ? numberArray
	      : Array.isArray(b) ? genericArray
	      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
	      : interpolateNumber)(a, b);
	}

	function interpolateRound(a, b) {
	  return a = +a, b = +b, function(t) {
	    return Math.round(a * (1 - t) + b * t);
	  };
	}

	var degrees = 180 / Math.PI;

	var identity$2 = {
	  translateX: 0,
	  translateY: 0,
	  rotate: 0,
	  skewX: 0,
	  scaleX: 1,
	  scaleY: 1
	};

	function decompose(a, b, c, d, e, f) {
	  var scaleX, scaleY, skewX;
	  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
	  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
	  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
	  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
	  return {
	    translateX: e,
	    translateY: f,
	    rotate: Math.atan2(b, a) * degrees,
	    skewX: Math.atan(skewX) * degrees,
	    scaleX: scaleX,
	    scaleY: scaleY
	  };
	}

	var svgNode;

	/* eslint-disable no-undef */
	function parseCss(value) {
	  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
	  return m.isIdentity ? identity$2 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
	}

	function parseSvg(value) {
	  if (value == null) return identity$2;
	  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
	  svgNode.setAttribute("transform", value);
	  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$2;
	  value = value.matrix;
	  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
	}

	function interpolateTransform(parse, pxComma, pxParen, degParen) {

	  function pop(s) {
	    return s.length ? s.pop() + " " : "";
	  }

	  function translate(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push("translate(", null, pxComma, null, pxParen);
	      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
	    } else if (xb || yb) {
	      s.push("translate(" + xb + pxComma + yb + pxParen);
	    }
	  }

	  function rotate(a, b, s, q) {
	    if (a !== b) {
	      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
	      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "rotate(" + b + degParen);
	    }
	  }

	  function skewX(a, b, s, q) {
	    if (a !== b) {
	      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
	    } else if (b) {
	      s.push(pop(s) + "skewX(" + b + degParen);
	    }
	  }

	  function scale(xa, ya, xb, yb, s, q) {
	    if (xa !== xb || ya !== yb) {
	      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
	      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
	    } else if (xb !== 1 || yb !== 1) {
	      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
	    }
	  }

	  return function(a, b) {
	    var s = [], // string constants and placeholders
	        q = []; // number interpolators
	    a = parse(a), b = parse(b);
	    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
	    rotate(a.rotate, b.rotate, s, q);
	    skewX(a.skewX, b.skewX, s, q);
	    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
	    a = b = null; // gc
	    return function(t) {
	      var i = -1, n = q.length, o;
	      while (++i < n) s[(o = q[i]).i] = o.x(t);
	      return s.join("");
	    };
	  };
	}

	var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
	var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

	var frame = 0, // is an animation frame pending?
	    timeout$1 = 0, // is a timeout pending?
	    interval = 0, // are any timers active?
	    pokeDelay = 1000, // how frequently we check for clock skew
	    taskHead,
	    taskTail,
	    clockLast = 0,
	    clockNow = 0,
	    clockSkew = 0,
	    clock = typeof performance === "object" && performance.now ? performance : Date,
	    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

	function now() {
	  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
	}

	function clearNow() {
	  clockNow = 0;
	}

	function Timer() {
	  this._call =
	  this._time =
	  this._next = null;
	}

	Timer.prototype = timer.prototype = {
	  constructor: Timer,
	  restart: function(callback, delay, time) {
	    if (typeof callback !== "function") throw new TypeError("callback is not a function");
	    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
	    if (!this._next && taskTail !== this) {
	      if (taskTail) taskTail._next = this;
	      else taskHead = this;
	      taskTail = this;
	    }
	    this._call = callback;
	    this._time = time;
	    sleep();
	  },
	  stop: function() {
	    if (this._call) {
	      this._call = null;
	      this._time = Infinity;
	      sleep();
	    }
	  }
	};

	function timer(callback, delay, time) {
	  var t = new Timer;
	  t.restart(callback, delay, time);
	  return t;
	}

	function timerFlush() {
	  now(); // Get the current time, if not already set.
	  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
	  var t = taskHead, e;
	  while (t) {
	    if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
	    t = t._next;
	  }
	  --frame;
	}

	function wake() {
	  clockNow = (clockLast = clock.now()) + clockSkew;
	  frame = timeout$1 = 0;
	  try {
	    timerFlush();
	  } finally {
	    frame = 0;
	    nap();
	    clockNow = 0;
	  }
	}

	function poke() {
	  var now = clock.now(), delay = now - clockLast;
	  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
	}

	function nap() {
	  var t0, t1 = taskHead, t2, time = Infinity;
	  while (t1) {
	    if (t1._call) {
	      if (time > t1._time) time = t1._time;
	      t0 = t1, t1 = t1._next;
	    } else {
	      t2 = t1._next, t1._next = null;
	      t1 = t0 ? t0._next = t2 : taskHead = t2;
	    }
	  }
	  taskTail = t0;
	  sleep(time);
	}

	function sleep(time) {
	  if (frame) return; // Soonest alarm already set, or will be.
	  if (timeout$1) timeout$1 = clearTimeout(timeout$1);
	  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
	  if (delay > 24) {
	    if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
	    if (interval) interval = clearInterval(interval);
	  } else {
	    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
	    frame = 1, setFrame(wake);
	  }
	}

	function timeout(callback, delay, time) {
	  var t = new Timer;
	  delay = delay == null ? 0 : +delay;
	  t.restart(elapsed => {
	    t.stop();
	    callback(elapsed + delay);
	  }, delay, time);
	  return t;
	}

	var emptyOn = dispatch("start", "end", "cancel", "interrupt");
	var emptyTween = [];

	var CREATED = 0;
	var SCHEDULED = 1;
	var STARTING = 2;
	var STARTED = 3;
	var RUNNING = 4;
	var ENDING = 5;
	var ENDED = 6;

	function schedule(node, name, id, index, group, timing) {
	  var schedules = node.__transition;
	  if (!schedules) node.__transition = {};
	  else if (id in schedules) return;
	  create(node, id, {
	    name: name,
	    index: index, // For context during callback.
	    group: group, // For context during callback.
	    on: emptyOn,
	    tween: emptyTween,
	    time: timing.time,
	    delay: timing.delay,
	    duration: timing.duration,
	    ease: timing.ease,
	    timer: null,
	    state: CREATED
	  });
	}

	function init(node, id) {
	  var schedule = get(node, id);
	  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
	  return schedule;
	}

	function set(node, id) {
	  var schedule = get(node, id);
	  if (schedule.state > STARTED) throw new Error("too late; already running");
	  return schedule;
	}

	function get(node, id) {
	  var schedule = node.__transition;
	  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
	  return schedule;
	}

	function create(node, id, self) {
	  var schedules = node.__transition,
	      tween;

	  // Initialize the self timer when the transition is created.
	  // Note the actual delay is not known until the first callback!
	  schedules[id] = self;
	  self.timer = timer(schedule, 0, self.time);

	  function schedule(elapsed) {
	    self.state = SCHEDULED;
	    self.timer.restart(start, self.delay, self.time);

	    // If the elapsed delay is less than our first sleep, start immediately.
	    if (self.delay <= elapsed) start(elapsed - self.delay);
	  }

	  function start(elapsed) {
	    var i, j, n, o;

	    // If the state is not SCHEDULED, then we previously errored on start.
	    if (self.state !== SCHEDULED) return stop();

	    for (i in schedules) {
	      o = schedules[i];
	      if (o.name !== self.name) continue;

	      // While this element already has a starting transition during this frame,
	      // defer starting an interrupting transition until that transition has a
	      // chance to tick (and possibly end); see d3/d3-transition#54!
	      if (o.state === STARTED) return timeout(start);

	      // Interrupt the active transition, if any.
	      if (o.state === RUNNING) {
	        o.state = ENDED;
	        o.timer.stop();
	        o.on.call("interrupt", node, node.__data__, o.index, o.group);
	        delete schedules[i];
	      }

	      // Cancel any pre-empted transitions.
	      else if (+i < id) {
	        o.state = ENDED;
	        o.timer.stop();
	        o.on.call("cancel", node, node.__data__, o.index, o.group);
	        delete schedules[i];
	      }
	    }

	    // Defer the first tick to end of the current frame; see d3/d3#1576.
	    // Note the transition may be canceled after start and before the first tick!
	    // Note this must be scheduled before the start event; see d3/d3-transition#16!
	    // Assuming this is successful, subsequent callbacks go straight to tick.
	    timeout(function() {
	      if (self.state === STARTED) {
	        self.state = RUNNING;
	        self.timer.restart(tick, self.delay, self.time);
	        tick(elapsed);
	      }
	    });

	    // Dispatch the start event.
	    // Note this must be done before the tween are initialized.
	    self.state = STARTING;
	    self.on.call("start", node, node.__data__, self.index, self.group);
	    if (self.state !== STARTING) return; // interrupted
	    self.state = STARTED;

	    // Initialize the tween, deleting null tween.
	    tween = new Array(n = self.tween.length);
	    for (i = 0, j = -1; i < n; ++i) {
	      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
	        tween[++j] = o;
	      }
	    }
	    tween.length = j + 1;
	  }

	  function tick(elapsed) {
	    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
	        i = -1,
	        n = tween.length;

	    while (++i < n) {
	      tween[i].call(node, t);
	    }

	    // Dispatch the end event.
	    if (self.state === ENDING) {
	      self.on.call("end", node, node.__data__, self.index, self.group);
	      stop();
	    }
	  }

	  function stop() {
	    self.state = ENDED;
	    self.timer.stop();
	    delete schedules[id];
	    for (var i in schedules) return; // eslint-disable-line no-unused-vars
	    delete node.__transition;
	  }
	}

	function interrupt(node, name) {
	  var schedules = node.__transition,
	      schedule,
	      active,
	      empty = true,
	      i;

	  if (!schedules) return;

	  name = name == null ? null : name + "";

	  for (i in schedules) {
	    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
	    active = schedule.state > STARTING && schedule.state < ENDING;
	    schedule.state = ENDED;
	    schedule.timer.stop();
	    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
	    delete schedules[i];
	  }

	  if (empty) delete node.__transition;
	}

	function selection_interrupt(name) {
	  return this.each(function() {
	    interrupt(this, name);
	  });
	}

	function tweenRemove(id, name) {
	  var tween0, tween1;
	  return function() {
	    var schedule = set(this, id),
	        tween = schedule.tween;

	    // If this node shared tween with the previous node,
	    // just assign the updated shared tween and we’re done!
	    // Otherwise, copy-on-write.
	    if (tween !== tween0) {
	      tween1 = tween0 = tween;
	      for (var i = 0, n = tween1.length; i < n; ++i) {
	        if (tween1[i].name === name) {
	          tween1 = tween1.slice();
	          tween1.splice(i, 1);
	          break;
	        }
	      }
	    }

	    schedule.tween = tween1;
	  };
	}

	function tweenFunction(id, name, value) {
	  var tween0, tween1;
	  if (typeof value !== "function") throw new Error;
	  return function() {
	    var schedule = set(this, id),
	        tween = schedule.tween;

	    // If this node shared tween with the previous node,
	    // just assign the updated shared tween and we’re done!
	    // Otherwise, copy-on-write.
	    if (tween !== tween0) {
	      tween1 = (tween0 = tween).slice();
	      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
	        if (tween1[i].name === name) {
	          tween1[i] = t;
	          break;
	        }
	      }
	      if (i === n) tween1.push(t);
	    }

	    schedule.tween = tween1;
	  };
	}

	function transition_tween(name, value) {
	  var id = this._id;

	  name += "";

	  if (arguments.length < 2) {
	    var tween = get(this.node(), id).tween;
	    for (var i = 0, n = tween.length, t; i < n; ++i) {
	      if ((t = tween[i]).name === name) {
	        return t.value;
	      }
	    }
	    return null;
	  }

	  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
	}

	function tweenValue(transition, name, value) {
	  var id = transition._id;

	  transition.each(function() {
	    var schedule = set(this, id);
	    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
	  });

	  return function(node) {
	    return get(node, id).value[name];
	  };
	}

	function interpolate(a, b) {
	  var c;
	  return (typeof b === "number" ? interpolateNumber
	      : b instanceof color ? interpolateRgb
	      : (c = color(b)) ? (b = c, interpolateRgb)
	      : interpolateString)(a, b);
	}

	function attrRemove(name) {
	  return function() {
	    this.removeAttribute(name);
	  };
	}

	function attrRemoveNS(fullname) {
	  return function() {
	    this.removeAttributeNS(fullname.space, fullname.local);
	  };
	}

	function attrConstant(name, interpolate, value1) {
	  var string00,
	      string1 = value1 + "",
	      interpolate0;
	  return function() {
	    var string0 = this.getAttribute(name);
	    return string0 === string1 ? null
	        : string0 === string00 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, value1);
	  };
	}

	function attrConstantNS(fullname, interpolate, value1) {
	  var string00,
	      string1 = value1 + "",
	      interpolate0;
	  return function() {
	    var string0 = this.getAttributeNS(fullname.space, fullname.local);
	    return string0 === string1 ? null
	        : string0 === string00 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, value1);
	  };
	}

	function attrFunction(name, interpolate, value) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0, value1 = value(this), string1;
	    if (value1 == null) return void this.removeAttribute(name);
	    string0 = this.getAttribute(name);
	    string1 = value1 + "";
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
	  };
	}

	function attrFunctionNS(fullname, interpolate, value) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0, value1 = value(this), string1;
	    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
	    string0 = this.getAttributeNS(fullname.space, fullname.local);
	    string1 = value1 + "";
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
	  };
	}

	function transition_attr(name, value) {
	  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
	  return this.attrTween(name, typeof value === "function"
	      ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
	      : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
	      : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
	}

	function attrInterpolate(name, i) {
	  return function(t) {
	    this.setAttribute(name, i.call(this, t));
	  };
	}

	function attrInterpolateNS(fullname, i) {
	  return function(t) {
	    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
	  };
	}

	function attrTweenNS(fullname, value) {
	  var t0, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
	    return t0;
	  }
	  tween._value = value;
	  return tween;
	}

	function attrTween(name, value) {
	  var t0, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
	    return t0;
	  }
	  tween._value = value;
	  return tween;
	}

	function transition_attrTween(name, value) {
	  var key = "attr." + name;
	  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  var fullname = namespace(name);
	  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
	}

	function delayFunction(id, value) {
	  return function() {
	    init(this, id).delay = +value.apply(this, arguments);
	  };
	}

	function delayConstant(id, value) {
	  return value = +value, function() {
	    init(this, id).delay = value;
	  };
	}

	function transition_delay(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each((typeof value === "function"
	          ? delayFunction
	          : delayConstant)(id, value))
	      : get(this.node(), id).delay;
	}

	function durationFunction(id, value) {
	  return function() {
	    set(this, id).duration = +value.apply(this, arguments);
	  };
	}

	function durationConstant(id, value) {
	  return value = +value, function() {
	    set(this, id).duration = value;
	  };
	}

	function transition_duration(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each((typeof value === "function"
	          ? durationFunction
	          : durationConstant)(id, value))
	      : get(this.node(), id).duration;
	}

	function easeConstant(id, value) {
	  if (typeof value !== "function") throw new Error;
	  return function() {
	    set(this, id).ease = value;
	  };
	}

	function transition_ease(value) {
	  var id = this._id;

	  return arguments.length
	      ? this.each(easeConstant(id, value))
	      : get(this.node(), id).ease;
	}

	function easeVarying(id, value) {
	  return function() {
	    var v = value.apply(this, arguments);
	    if (typeof v !== "function") throw new Error;
	    set(this, id).ease = v;
	  };
	}

	function transition_easeVarying(value) {
	  if (typeof value !== "function") throw new Error;
	  return this.each(easeVarying(this._id, value));
	}

	function transition_filter(match) {
	  if (typeof match !== "function") match = matcher(match);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
	      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
	        subgroup.push(node);
	      }
	    }
	  }

	  return new Transition(subgroups, this._parents, this._name, this._id);
	}

	function transition_merge(transition) {
	  if (transition._id !== this._id) throw new Error;

	  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
	    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
	      if (node = group0[i] || group1[i]) {
	        merge[i] = node;
	      }
	    }
	  }

	  for (; j < m0; ++j) {
	    merges[j] = groups0[j];
	  }

	  return new Transition(merges, this._parents, this._name, this._id);
	}

	function start(name) {
	  return (name + "").trim().split(/^|\s+/).every(function(t) {
	    var i = t.indexOf(".");
	    if (i >= 0) t = t.slice(0, i);
	    return !t || t === "start";
	  });
	}

	function onFunction(id, name, listener) {
	  var on0, on1, sit = start(name) ? init : set;
	  return function() {
	    var schedule = sit(this, id),
	        on = schedule.on;

	    // If this node shared a dispatch with the previous node,
	    // just assign the updated shared dispatch and we’re done!
	    // Otherwise, copy-on-write.
	    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

	    schedule.on = on1;
	  };
	}

	function transition_on(name, listener) {
	  var id = this._id;

	  return arguments.length < 2
	      ? get(this.node(), id).on.on(name)
	      : this.each(onFunction(id, name, listener));
	}

	function removeFunction(id) {
	  return function() {
	    var parent = this.parentNode;
	    for (var i in this.__transition) if (+i !== id) return;
	    if (parent) parent.removeChild(this);
	  };
	}

	function transition_remove() {
	  return this.on("end.remove", removeFunction(this._id));
	}

	function transition_select(select) {
	  var name = this._name,
	      id = this._id;

	  if (typeof select !== "function") select = selector(select);

	  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
	      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
	        if ("__data__" in node) subnode.__data__ = node.__data__;
	        subgroup[i] = subnode;
	        schedule(subgroup[i], name, id, i, subgroup, get(node, id));
	      }
	    }
	  }

	  return new Transition(subgroups, this._parents, name, id);
	}

	function transition_selectAll(select) {
	  var name = this._name,
	      id = this._id;

	  if (typeof select !== "function") select = selectorAll(select);

	  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
	          if (child = children[k]) {
	            schedule(child, name, id, k, children, inherit);
	          }
	        }
	        subgroups.push(children);
	        parents.push(node);
	      }
	    }
	  }

	  return new Transition(subgroups, parents, name, id);
	}

	var Selection = selection.prototype.constructor;

	function transition_selection() {
	  return new Selection(this._groups, this._parents);
	}

	function styleNull(name, interpolate) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0 = styleValue(this, name),
	        string1 = (this.style.removeProperty(name), styleValue(this, name));
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, string10 = string1);
	  };
	}

	function styleRemove(name) {
	  return function() {
	    this.style.removeProperty(name);
	  };
	}

	function styleConstant(name, interpolate, value1) {
	  var string00,
	      string1 = value1 + "",
	      interpolate0;
	  return function() {
	    var string0 = styleValue(this, name);
	    return string0 === string1 ? null
	        : string0 === string00 ? interpolate0
	        : interpolate0 = interpolate(string00 = string0, value1);
	  };
	}

	function styleFunction(name, interpolate, value) {
	  var string00,
	      string10,
	      interpolate0;
	  return function() {
	    var string0 = styleValue(this, name),
	        value1 = value(this),
	        string1 = value1 + "";
	    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
	    return string0 === string1 ? null
	        : string0 === string00 && string1 === string10 ? interpolate0
	        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
	  };
	}

	function styleMaybeRemove(id, name) {
	  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
	  return function() {
	    var schedule = set(this, id),
	        on = schedule.on,
	        listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

	    // If this node shared a dispatch with the previous node,
	    // just assign the updated shared dispatch and we’re done!
	    // Otherwise, copy-on-write.
	    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

	    schedule.on = on1;
	  };
	}

	function transition_style(name, value, priority) {
	  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
	  return value == null ? this
	      .styleTween(name, styleNull(name, i))
	      .on("end.style." + name, styleRemove(name))
	    : typeof value === "function" ? this
	      .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
	      .each(styleMaybeRemove(this._id, name))
	    : this
	      .styleTween(name, styleConstant(name, i, value), priority)
	      .on("end.style." + name, null);
	}

	function styleInterpolate(name, i, priority) {
	  return function(t) {
	    this.style.setProperty(name, i.call(this, t), priority);
	  };
	}

	function styleTween(name, value, priority) {
	  var t, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
	    return t;
	  }
	  tween._value = value;
	  return tween;
	}

	function transition_styleTween(name, value, priority) {
	  var key = "style." + (name += "");
	  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
	}

	function textConstant(value) {
	  return function() {
	    this.textContent = value;
	  };
	}

	function textFunction(value) {
	  return function() {
	    var value1 = value(this);
	    this.textContent = value1 == null ? "" : value1;
	  };
	}

	function transition_text(value) {
	  return this.tween("text", typeof value === "function"
	      ? textFunction(tweenValue(this, "text", value))
	      : textConstant(value == null ? "" : value + ""));
	}

	function textInterpolate(i) {
	  return function(t) {
	    this.textContent = i.call(this, t);
	  };
	}

	function textTween(value) {
	  var t0, i0;
	  function tween() {
	    var i = value.apply(this, arguments);
	    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
	    return t0;
	  }
	  tween._value = value;
	  return tween;
	}

	function transition_textTween(value) {
	  var key = "text";
	  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
	  if (value == null) return this.tween(key, null);
	  if (typeof value !== "function") throw new Error;
	  return this.tween(key, textTween(value));
	}

	function transition_transition() {
	  var name = this._name,
	      id0 = this._id,
	      id1 = newId();

	  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        var inherit = get(node, id0);
	        schedule(node, name, id1, i, group, {
	          time: inherit.time + inherit.delay + inherit.duration,
	          delay: 0,
	          duration: inherit.duration,
	          ease: inherit.ease
	        });
	      }
	    }
	  }

	  return new Transition(groups, this._parents, name, id1);
	}

	function transition_end() {
	  var on0, on1, that = this, id = that._id, size = that.size();
	  return new Promise(function(resolve, reject) {
	    var cancel = {value: reject},
	        end = {value: function() { if (--size === 0) resolve(); }};

	    that.each(function() {
	      var schedule = set(this, id),
	          on = schedule.on;

	      // If this node shared a dispatch with the previous node,
	      // just assign the updated shared dispatch and we’re done!
	      // Otherwise, copy-on-write.
	      if (on !== on0) {
	        on1 = (on0 = on).copy();
	        on1._.cancel.push(cancel);
	        on1._.interrupt.push(cancel);
	        on1._.end.push(end);
	      }

	      schedule.on = on1;
	    });

	    // The selection was empty, resolve end immediately
	    if (size === 0) resolve();
	  });
	}

	var id = 0;

	function Transition(groups, parents, name, id) {
	  this._groups = groups;
	  this._parents = parents;
	  this._name = name;
	  this._id = id;
	}

	function newId() {
	  return ++id;
	}

	var selection_prototype = selection.prototype;

	Transition.prototype = {
	  constructor: Transition,
	  select: transition_select,
	  selectAll: transition_selectAll,
	  selectChild: selection_prototype.selectChild,
	  selectChildren: selection_prototype.selectChildren,
	  filter: transition_filter,
	  merge: transition_merge,
	  selection: transition_selection,
	  transition: transition_transition,
	  call: selection_prototype.call,
	  nodes: selection_prototype.nodes,
	  node: selection_prototype.node,
	  size: selection_prototype.size,
	  empty: selection_prototype.empty,
	  each: selection_prototype.each,
	  on: transition_on,
	  attr: transition_attr,
	  attrTween: transition_attrTween,
	  style: transition_style,
	  styleTween: transition_styleTween,
	  text: transition_text,
	  textTween: transition_textTween,
	  remove: transition_remove,
	  tween: transition_tween,
	  delay: transition_delay,
	  duration: transition_duration,
	  ease: transition_ease,
	  easeVarying: transition_easeVarying,
	  end: transition_end,
	  [Symbol.iterator]: selection_prototype[Symbol.iterator]
	};

	function cubicInOut(t) {
	  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
	}

	var defaultTiming = {
	  time: null, // Set on use.
	  delay: 0,
	  duration: 250,
	  ease: cubicInOut
	};

	function inherit(node, id) {
	  var timing;
	  while (!(timing = node.__transition) || !(timing = timing[id])) {
	    if (!(node = node.parentNode)) {
	      throw new Error(`transition ${id} not found`);
	    }
	  }
	  return timing;
	}

	function selection_transition(name) {
	  var id,
	      timing;

	  if (name instanceof Transition) {
	    id = name._id, name = name._name;
	  } else {
	    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
	  }

	  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
	    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
	      if (node = group[i]) {
	        schedule(node, name, id, i, group, timing || inherit(node, id));
	      }
	    }
	  }

	  return new Transition(groups, this._parents, name, id);
	}

	selection.prototype.interrupt = selection_interrupt;
	selection.prototype.transition = selection_transition;

	const pi = Math.PI,
	    tau = 2 * pi,
	    epsilon = 1e-6,
	    tauEpsilon = tau - epsilon;

	function append(strings) {
	  this._ += strings[0];
	  for (let i = 1, n = strings.length; i < n; ++i) {
	    this._ += arguments[i] + strings[i];
	  }
	}

	function appendRound(digits) {
	  let d = Math.floor(digits);
	  if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
	  if (d > 15) return append;
	  const k = 10 ** d;
	  return function(strings) {
	    this._ += strings[0];
	    for (let i = 1, n = strings.length; i < n; ++i) {
	      this._ += Math.round(arguments[i] * k) / k + strings[i];
	    }
	  };
	}

	class Path {
	  constructor(digits) {
	    this._x0 = this._y0 = // start of current subpath
	    this._x1 = this._y1 = null; // end of current subpath
	    this._ = "";
	    this._append = digits == null ? append : appendRound(digits);
	  }
	  moveTo(x, y) {
	    this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}`;
	  }
	  closePath() {
	    if (this._x1 !== null) {
	      this._x1 = this._x0, this._y1 = this._y0;
	      this._append`Z`;
	    }
	  }
	  lineTo(x, y) {
	    this._append`L${this._x1 = +x},${this._y1 = +y}`;
	  }
	  quadraticCurveTo(x1, y1, x, y) {
	    this._append`Q${+x1},${+y1},${this._x1 = +x},${this._y1 = +y}`;
	  }
	  bezierCurveTo(x1, y1, x2, y2, x, y) {
	    this._append`C${+x1},${+y1},${+x2},${+y2},${this._x1 = +x},${this._y1 = +y}`;
	  }
	  arcTo(x1, y1, x2, y2, r) {
	    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;

	    // Is the radius negative? Error.
	    if (r < 0) throw new Error(`negative radius: ${r}`);

	    let x0 = this._x1,
	        y0 = this._y1,
	        x21 = x2 - x1,
	        y21 = y2 - y1,
	        x01 = x0 - x1,
	        y01 = y0 - y1,
	        l01_2 = x01 * x01 + y01 * y01;

	    // Is this path empty? Move to (x1,y1).
	    if (this._x1 === null) {
	      this._append`M${this._x1 = x1},${this._y1 = y1}`;
	    }

	    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
	    else if (!(l01_2 > epsilon));

	    // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
	    // Equivalently, is (x1,y1) coincident with (x2,y2)?
	    // Or, is the radius zero? Line to (x1,y1).
	    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
	      this._append`L${this._x1 = x1},${this._y1 = y1}`;
	    }

	    // Otherwise, draw an arc!
	    else {
	      let x20 = x2 - x0,
	          y20 = y2 - y0,
	          l21_2 = x21 * x21 + y21 * y21,
	          l20_2 = x20 * x20 + y20 * y20,
	          l21 = Math.sqrt(l21_2),
	          l01 = Math.sqrt(l01_2),
	          l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
	          t01 = l / l01,
	          t21 = l / l21;

	      // If the start tangent is not coincident with (x0,y0), line to.
	      if (Math.abs(t01 - 1) > epsilon) {
	        this._append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
	      }

	      this._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x1 + t21 * x21},${this._y1 = y1 + t21 * y21}`;
	    }
	  }
	  arc(x, y, r, a0, a1, ccw) {
	    x = +x, y = +y, r = +r, ccw = !!ccw;

	    // Is the radius negative? Error.
	    if (r < 0) throw new Error(`negative radius: ${r}`);

	    let dx = r * Math.cos(a0),
	        dy = r * Math.sin(a0),
	        x0 = x + dx,
	        y0 = y + dy,
	        cw = 1 ^ ccw,
	        da = ccw ? a0 - a1 : a1 - a0;

	    // Is this path empty? Move to (x0,y0).
	    if (this._x1 === null) {
	      this._append`M${x0},${y0}`;
	    }

	    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
	    else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
	      this._append`L${x0},${y0}`;
	    }

	    // Is this arc empty? We’re done.
	    if (!r) return;

	    // Does the angle go the wrong way? Flip the direction.
	    if (da < 0) da = da % tau + tau;

	    // Is this a complete circle? Draw two arcs to complete the circle.
	    if (da > tauEpsilon) {
	      this._append`A${r},${r},0,1,${cw},${x - dx},${y - dy}A${r},${r},0,1,${cw},${this._x1 = x0},${this._y1 = y0}`;
	    }

	    // Is this arc non-empty? Draw an arc!
	    else if (da > epsilon) {
	      this._append`A${r},${r},0,${+(da >= pi)},${cw},${this._x1 = x + r * Math.cos(a1)},${this._y1 = y + r * Math.sin(a1)}`;
	    }
	  }
	  rect(x, y, w, h) {
	    this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}h${w = +w}v${+h}h${-w}Z`;
	  }
	  toString() {
	    return this._;
	  }
	}

	var EOL = {},
	    EOF = {},
	    QUOTE = 34,
	    NEWLINE = 10,
	    RETURN = 13;

	function objectConverter(columns) {
	  return new Function("d", "return {" + columns.map(function(name, i) {
	    return JSON.stringify(name) + ": d[" + i + "] || \"\"";
	  }).join(",") + "}");
	}

	function customConverter(columns, f) {
	  var object = objectConverter(columns);
	  return function(row, i) {
	    return f(object(row), i, columns);
	  };
	}

	// Compute unique columns in order of discovery.
	function inferColumns(rows) {
	  var columnSet = Object.create(null),
	      columns = [];

	  rows.forEach(function(row) {
	    for (var column in row) {
	      if (!(column in columnSet)) {
	        columns.push(columnSet[column] = column);
	      }
	    }
	  });

	  return columns;
	}

	function pad(value, width) {
	  var s = value + "", length = s.length;
	  return length < width ? new Array(width - length + 1).join(0) + s : s;
	}

	function formatYear(year) {
	  return year < 0 ? "-" + pad(-year, 6)
	    : year > 9999 ? "+" + pad(year, 6)
	    : pad(year, 4);
	}

	function formatDate(date) {
	  var hours = date.getUTCHours(),
	      minutes = date.getUTCMinutes(),
	      seconds = date.getUTCSeconds(),
	      milliseconds = date.getUTCMilliseconds();
	  return isNaN(date) ? "Invalid Date"
	      : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
	      + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
	      : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
	      : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
	      : "");
	}

	function dsvFormat(delimiter) {
	  var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
	      DELIMITER = delimiter.charCodeAt(0);

	  function parse(text, f) {
	    var convert, columns, rows = parseRows(text, function(row, i) {
	      if (convert) return convert(row, i - 1);
	      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
	    });
	    rows.columns = columns || [];
	    return rows;
	  }

	  function parseRows(text, f) {
	    var rows = [], // output rows
	        N = text.length,
	        I = 0, // current character index
	        n = 0, // current line number
	        t, // current token
	        eof = N <= 0, // current token followed by EOF?
	        eol = false; // current token followed by EOL?

	    // Strip the trailing newline.
	    if (text.charCodeAt(N - 1) === NEWLINE) --N;
	    if (text.charCodeAt(N - 1) === RETURN) --N;

	    function token() {
	      if (eof) return EOF;
	      if (eol) return eol = false, EOL;

	      // Unescape quotes.
	      var i, j = I, c;
	      if (text.charCodeAt(j) === QUOTE) {
	        while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
	        if ((i = I) >= N) eof = true;
	        else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
	        else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
	        return text.slice(j + 1, i - 1).replace(/""/g, "\"");
	      }

	      // Find next delimiter or newline.
	      while (I < N) {
	        if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
	        else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
	        else if (c !== DELIMITER) continue;
	        return text.slice(j, i);
	      }

	      // Return last token before EOF.
	      return eof = true, text.slice(j, N);
	    }

	    while ((t = token()) !== EOF) {
	      var row = [];
	      while (t !== EOL && t !== EOF) row.push(t), t = token();
	      if (f && (row = f(row, n++)) == null) continue;
	      rows.push(row);
	    }

	    return rows;
	  }

	  function preformatBody(rows, columns) {
	    return rows.map(function(row) {
	      return columns.map(function(column) {
	        return formatValue(row[column]);
	      }).join(delimiter);
	    });
	  }

	  function format(rows, columns) {
	    if (columns == null) columns = inferColumns(rows);
	    return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
	  }

	  function formatBody(rows, columns) {
	    if (columns == null) columns = inferColumns(rows);
	    return preformatBody(rows, columns).join("\n");
	  }

	  function formatRows(rows) {
	    return rows.map(formatRow).join("\n");
	  }

	  function formatRow(row) {
	    return row.map(formatValue).join(delimiter);
	  }

	  function formatValue(value) {
	    return value == null ? ""
	        : value instanceof Date ? formatDate(value)
	        : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
	        : value;
	  }

	  return {
	    parse: parse,
	    parseRows: parseRows,
	    format: format,
	    formatBody: formatBody,
	    formatRows: formatRows,
	    formatRow: formatRow,
	    formatValue: formatValue
	  };
	}

	var tsv = dsvFormat("\t");

	var tsvParse = tsv.parse;

	function formatDecimal(x) {
	  return Math.abs(x = Math.round(x)) >= 1e21
	      ? x.toLocaleString("en").replace(/,/g, "")
	      : x.toString(10);
	}

	// Computes the decimal coefficient and exponent of the specified number x with
	// significant digits p, where x is positive and p is in [1, 21] or undefined.
	// For example, formatDecimalParts(1.23) returns ["123", 0].
	function formatDecimalParts(x, p) {
	  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
	  var i, coefficient = x.slice(0, i);

	  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
	  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
	  return [
	    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
	    +x.slice(i + 1)
	  ];
	}

	function exponent(x) {
	  return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
	}

	function formatGroup(grouping, thousands) {
	  return function(value, width) {
	    var i = value.length,
	        t = [],
	        j = 0,
	        g = grouping[0],
	        length = 0;

	    while (i > 0 && g > 0) {
	      if (length + g + 1 > width) g = Math.max(1, width - length);
	      t.push(value.substring(i -= g, i + g));
	      if ((length += g + 1) > width) break;
	      g = grouping[j = (j + 1) % grouping.length];
	    }

	    return t.reverse().join(thousands);
	  };
	}

	function formatNumerals(numerals) {
	  return function(value) {
	    return value.replace(/[0-9]/g, function(i) {
	      return numerals[+i];
	    });
	  };
	}

	// [[fill]align][sign][symbol][0][width][,][.precision][~][type]
	var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

	function formatSpecifier(specifier) {
	  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
	  var match;
	  return new FormatSpecifier({
	    fill: match[1],
	    align: match[2],
	    sign: match[3],
	    symbol: match[4],
	    zero: match[5],
	    width: match[6],
	    comma: match[7],
	    precision: match[8] && match[8].slice(1),
	    trim: match[9],
	    type: match[10]
	  });
	}

	formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

	function FormatSpecifier(specifier) {
	  this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
	  this.align = specifier.align === undefined ? ">" : specifier.align + "";
	  this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
	  this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
	  this.zero = !!specifier.zero;
	  this.width = specifier.width === undefined ? undefined : +specifier.width;
	  this.comma = !!specifier.comma;
	  this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
	  this.trim = !!specifier.trim;
	  this.type = specifier.type === undefined ? "" : specifier.type + "";
	}

	FormatSpecifier.prototype.toString = function() {
	  return this.fill
	      + this.align
	      + this.sign
	      + this.symbol
	      + (this.zero ? "0" : "")
	      + (this.width === undefined ? "" : Math.max(1, this.width | 0))
	      + (this.comma ? "," : "")
	      + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
	      + (this.trim ? "~" : "")
	      + this.type;
	};

	// Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
	function formatTrim(s) {
	  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
	    switch (s[i]) {
	      case ".": i0 = i1 = i; break;
	      case "0": if (i0 === 0) i0 = i; i1 = i; break;
	      default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
	    }
	  }
	  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
	}

	var prefixExponent;

	function formatPrefixAuto(x, p) {
	  var d = formatDecimalParts(x, p);
	  if (!d) return x + "";
	  var coefficient = d[0],
	      exponent = d[1],
	      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
	      n = coefficient.length;
	  return i === n ? coefficient
	      : i > n ? coefficient + new Array(i - n + 1).join("0")
	      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
	      : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
	}

	function formatRounded(x, p) {
	  var d = formatDecimalParts(x, p);
	  if (!d) return x + "";
	  var coefficient = d[0],
	      exponent = d[1];
	  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
	      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
	      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
	}

	var formatTypes = {
	  "%": (x, p) => (x * 100).toFixed(p),
	  "b": (x) => Math.round(x).toString(2),
	  "c": (x) => x + "",
	  "d": formatDecimal,
	  "e": (x, p) => x.toExponential(p),
	  "f": (x, p) => x.toFixed(p),
	  "g": (x, p) => x.toPrecision(p),
	  "o": (x) => Math.round(x).toString(8),
	  "p": (x, p) => formatRounded(x * 100, p),
	  "r": formatRounded,
	  "s": formatPrefixAuto,
	  "X": (x) => Math.round(x).toString(16).toUpperCase(),
	  "x": (x) => Math.round(x).toString(16)
	};

	function identity$1(x) {
	  return x;
	}

	var map = Array.prototype.map,
	    prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

	function formatLocale(locale) {
	  var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
	      currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
	      currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
	      decimal = locale.decimal === undefined ? "." : locale.decimal + "",
	      numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map.call(locale.numerals, String)),
	      percent = locale.percent === undefined ? "%" : locale.percent + "",
	      minus = locale.minus === undefined ? "−" : locale.minus + "",
	      nan = locale.nan === undefined ? "NaN" : locale.nan + "";

	  function newFormat(specifier) {
	    specifier = formatSpecifier(specifier);

	    var fill = specifier.fill,
	        align = specifier.align,
	        sign = specifier.sign,
	        symbol = specifier.symbol,
	        zero = specifier.zero,
	        width = specifier.width,
	        comma = specifier.comma,
	        precision = specifier.precision,
	        trim = specifier.trim,
	        type = specifier.type;

	    // The "n" type is an alias for ",g".
	    if (type === "n") comma = true, type = "g";

	    // The "" type, and any invalid type, is an alias for ".12~g".
	    else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

	    // If zero fill is specified, padding goes after sign and before digits.
	    if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

	    // Compute the prefix and suffix.
	    // For SI-prefix, the suffix is lazily computed.
	    var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
	        suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

	    // What format function should we use?
	    // Is this an integer type?
	    // Can this type generate exponential notation?
	    var formatType = formatTypes[type],
	        maybeSuffix = /[defgprs%]/.test(type);

	    // Set the default precision if not specified,
	    // or clamp the specified precision to the supported range.
	    // For significant precision, it must be in [1, 21].
	    // For fixed precision, it must be in [0, 20].
	    precision = precision === undefined ? 6
	        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
	        : Math.max(0, Math.min(20, precision));

	    function format(value) {
	      var valuePrefix = prefix,
	          valueSuffix = suffix,
	          i, n, c;

	      if (type === "c") {
	        valueSuffix = formatType(value) + valueSuffix;
	        value = "";
	      } else {
	        value = +value;

	        // Determine the sign. -0 is not less than 0, but 1 / -0 is!
	        var valueNegative = value < 0 || 1 / value < 0;

	        // Perform the initial formatting.
	        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

	        // Trim insignificant zeros.
	        if (trim) value = formatTrim(value);

	        // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
	        if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

	        // Compute the prefix and suffix.
	        valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
	        valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

	        // Break the formatted value into the integer “value” part that can be
	        // grouped, and fractional or exponential “suffix” part that is not.
	        if (maybeSuffix) {
	          i = -1, n = value.length;
	          while (++i < n) {
	            if (c = value.charCodeAt(i), 48 > c || c > 57) {
	              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
	              value = value.slice(0, i);
	              break;
	            }
	          }
	        }
	      }

	      // If the fill character is not "0", grouping is applied before padding.
	      if (comma && !zero) value = group(value, Infinity);

	      // Compute the padding.
	      var length = valuePrefix.length + value.length + valueSuffix.length,
	          padding = length < width ? new Array(width - length + 1).join(fill) : "";

	      // If the fill character is "0", grouping is applied after padding.
	      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

	      // Reconstruct the final output based on the desired alignment.
	      switch (align) {
	        case "<": value = valuePrefix + value + valueSuffix + padding; break;
	        case "=": value = valuePrefix + padding + value + valueSuffix; break;
	        case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
	        default: value = padding + valuePrefix + value + valueSuffix; break;
	      }

	      return numerals(value);
	    }

	    format.toString = function() {
	      return specifier + "";
	    };

	    return format;
	  }

	  function formatPrefix(specifier, value) {
	    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
	        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
	        k = Math.pow(10, -e),
	        prefix = prefixes[8 + e / 3];
	    return function(value) {
	      return f(k * value) + prefix;
	    };
	  }

	  return {
	    format: newFormat,
	    formatPrefix: formatPrefix
	  };
	}

	var locale;
	var format;
	var formatPrefix;

	defaultLocale({
	  thousands: ",",
	  grouping: [3],
	  currency: ["$", ""]
	});

	function defaultLocale(definition) {
	  locale = formatLocale(definition);
	  format = locale.format;
	  formatPrefix = locale.formatPrefix;
	  return locale;
	}

	function precisionFixed(step) {
	  return Math.max(0, -exponent(Math.abs(step)));
	}

	function precisionPrefix(step, value) {
	  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
	}

	function precisionRound(step, max) {
	  step = Math.abs(step), max = Math.abs(max) - step;
	  return Math.max(0, exponent(max) - exponent(step)) + 1;
	}

	function initRange(domain, range) {
	  switch (arguments.length) {
	    case 0: break;
	    case 1: this.range(domain); break;
	    default: this.range(range).domain(domain); break;
	  }
	  return this;
	}

	function constants(x) {
	  return function() {
	    return x;
	  };
	}

	function number(x) {
	  return +x;
	}

	var unit = [0, 1];

	function identity(x) {
	  return x;
	}

	function normalize(a, b) {
	  return (b -= (a = +a))
	      ? function(x) { return (x - a) / b; }
	      : constants(isNaN(b) ? NaN : 0.5);
	}

	function clamper(a, b) {
	  var t;
	  if (a > b) t = a, a = b, b = t;
	  return function(x) { return Math.max(a, Math.min(b, x)); };
	}

	// normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
	// interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
	function bimap(domain, range, interpolate) {
	  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
	  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
	  else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
	  return function(x) { return r0(d0(x)); };
	}

	function polymap(domain, range, interpolate) {
	  var j = Math.min(domain.length, range.length) - 1,
	      d = new Array(j),
	      r = new Array(j),
	      i = -1;

	  // Reverse descending domains.
	  if (domain[j] < domain[0]) {
	    domain = domain.slice().reverse();
	    range = range.slice().reverse();
	  }

	  while (++i < j) {
	    d[i] = normalize(domain[i], domain[i + 1]);
	    r[i] = interpolate(range[i], range[i + 1]);
	  }

	  return function(x) {
	    var i = bisectRight(domain, x, 1, j) - 1;
	    return r[i](d[i](x));
	  };
	}

	function copy(source, target) {
	  return target
	      .domain(source.domain())
	      .range(source.range())
	      .interpolate(source.interpolate())
	      .clamp(source.clamp())
	      .unknown(source.unknown());
	}

	function transformer() {
	  var domain = unit,
	      range = unit,
	      interpolate = interpolate$1,
	      transform,
	      untransform,
	      unknown,
	      clamp = identity,
	      piecewise,
	      output,
	      input;

	  function rescale() {
	    var n = Math.min(domain.length, range.length);
	    if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1]);
	    piecewise = n > 2 ? polymap : bimap;
	    output = input = null;
	    return scale;
	  }

	  function scale(x) {
	    return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
	  }

	  scale.invert = function(y) {
	    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
	  };

	  scale.domain = function(_) {
	    return arguments.length ? (domain = Array.from(_, number), rescale()) : domain.slice();
	  };

	  scale.range = function(_) {
	    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
	  };

	  scale.rangeRound = function(_) {
	    return range = Array.from(_), interpolate = interpolateRound, rescale();
	  };

	  scale.clamp = function(_) {
	    return arguments.length ? (clamp = _ ? true : identity, rescale()) : clamp !== identity;
	  };

	  scale.interpolate = function(_) {
	    return arguments.length ? (interpolate = _, rescale()) : interpolate;
	  };

	  scale.unknown = function(_) {
	    return arguments.length ? (unknown = _, scale) : unknown;
	  };

	  return function(t, u) {
	    transform = t, untransform = u;
	    return rescale();
	  };
	}

	function continuous() {
	  return transformer()(identity, identity);
	}

	function tickFormat(start, stop, count, specifier) {
	  var step = tickStep(start, stop, count),
	      precision;
	  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
	  switch (specifier.type) {
	    case "s": {
	      var value = Math.max(Math.abs(start), Math.abs(stop));
	      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
	      return formatPrefix(specifier, value);
	    }
	    case "":
	    case "e":
	    case "g":
	    case "p":
	    case "r": {
	      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
	      break;
	    }
	    case "f":
	    case "%": {
	      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
	      break;
	    }
	  }
	  return format(specifier);
	}

	function linearish(scale) {
	  var domain = scale.domain;

	  scale.ticks = function(count) {
	    var d = domain();
	    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
	  };

	  scale.tickFormat = function(count, specifier) {
	    var d = domain();
	    return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
	  };

	  scale.nice = function(count) {
	    if (count == null) count = 10;

	    var d = domain();
	    var i0 = 0;
	    var i1 = d.length - 1;
	    var start = d[i0];
	    var stop = d[i1];
	    var prestep;
	    var step;
	    var maxIter = 10;

	    if (stop < start) {
	      step = start, start = stop, stop = step;
	      step = i0, i0 = i1, i1 = step;
	    }
	    
	    while (maxIter-- > 0) {
	      step = tickIncrement(start, stop, count);
	      if (step === prestep) {
	        d[i0] = start;
	        d[i1] = stop;
	        return domain(d);
	      } else if (step > 0) {
	        start = Math.floor(start / step) * step;
	        stop = Math.ceil(stop / step) * step;
	      } else if (step < 0) {
	        start = Math.ceil(start * step) / step;
	        stop = Math.floor(stop * step) / step;
	      } else {
	        break;
	      }
	      prestep = step;
	    }

	    return scale;
	  };

	  return scale;
	}

	function linear() {
	  var scale = continuous();

	  scale.copy = function() {
	    return copy(scale, linear());
	  };

	  initRange.apply(scale, arguments);

	  return linearish(scale);
	}

	function colors(specifier) {
	  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
	  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
	  return colors;
	}

	var category10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

	function constant(x) {
	  return function constant() {
	    return x;
	  };
	}

	function withPath(shape) {
	  let digits = 3;

	  shape.digits = function(_) {
	    if (!arguments.length) return digits;
	    if (_ == null) {
	      digits = null;
	    } else {
	      const d = Math.floor(_);
	      if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
	      digits = d;
	    }
	    return shape;
	  };

	  return () => new Path(digits);
	}

	function array(x) {
	  return typeof x === "object" && "length" in x
	    ? x // Array, TypedArray, NodeList, array-like
	    : Array.from(x); // Map, Set, iterable, string, or anything else
	}

	function Linear(context) {
	  this._context = context;
	}

	Linear.prototype = {
	  areaStart: function() {
	    this._line = 0;
	  },
	  areaEnd: function() {
	    this._line = NaN;
	  },
	  lineStart: function() {
	    this._point = 0;
	  },
	  lineEnd: function() {
	    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
	    this._line = 1 - this._line;
	  },
	  point: function(x, y) {
	    x = +x, y = +y;
	    switch (this._point) {
	      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
	      case 1: this._point = 2; // falls through
	      default: this._context.lineTo(x, y); break;
	    }
	  }
	};

	function curveLinear(context) {
	  return new Linear(context);
	}

	function x(p) {
	  return p[0];
	}

	function y(p) {
	  return p[1];
	}

	function line(x$1, y$1) {
	  var defined = constant(true),
	      context = null,
	      curve = curveLinear,
	      output = null,
	      path = withPath(line);

	  x$1 = typeof x$1 === "function" ? x$1 : (x$1 === undefined) ? x : constant(x$1);
	  y$1 = typeof y$1 === "function" ? y$1 : (y$1 === undefined) ? y : constant(y$1);

	  function line(data) {
	    var i,
	        n = (data = array(data)).length,
	        d,
	        defined0 = false,
	        buffer;

	    if (context == null) output = curve(buffer = path());

	    for (i = 0; i <= n; ++i) {
	      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
	        if (defined0 = !defined0) output.lineStart();
	        else output.lineEnd();
	      }
	      if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
	    }

	    if (buffer) return output = null, buffer + "" || null;
	  }

	  line.x = function(_) {
	    return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant(+_), line) : x$1;
	  };

	  line.y = function(_) {
	    return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant(+_), line) : y$1;
	  };

	  line.defined = function(_) {
	    return arguments.length ? (defined = typeof _ === "function" ? _ : constant(!!_), line) : defined;
	  };

	  line.curve = function(_) {
	    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
	  };

	  line.context = function(_) {
	    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
	  };

	  return line;
	}

	function Transform(k, x, y) {
	  this.k = k;
	  this.x = x;
	  this.y = y;
	}

	Transform.prototype = {
	  constructor: Transform,
	  scale: function(k) {
	    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
	  },
	  translate: function(x, y) {
	    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
	  },
	  apply: function(point) {
	    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
	  },
	  applyX: function(x) {
	    return x * this.k + this.x;
	  },
	  applyY: function(y) {
	    return y * this.k + this.y;
	  },
	  invert: function(location) {
	    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
	  },
	  invertX: function(x) {
	    return (x - this.x) / this.k;
	  },
	  invertY: function(y) {
	    return (y - this.y) / this.k;
	  },
	  rescaleX: function(x) {
	    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
	  },
	  rescaleY: function(y) {
	    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
	  },
	  toString: function() {
	    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
	  }
	};

	Transform.prototype;

	function  lineChart (lineChartInputObject = {}) {

		// here is the definition of the lineChartInputObject data structure:

		// lineChartInputObject.inputTable,	// an array of outs [out1, out2 ... outn]; default is internal inputTable
		// lineChartInputObject.chartID,	// a string of an svg id 'chart'; default is 'chart1'
		// lineChartInputObject.metricPrefix,	// a string of a metric prefix such as 'giga'; default is 'giga'
		// lineChartInputObject.chartTitle,	// a string of the chart title; default is blank
		// lineChartInputObject.xAxisTitle,	// a string of the x axis title; default is 'Frequency'
		// lineChartInputObject.yAxisTitle,	// a string of the y axis title; default is 'dB'
		// lineChartInputObject.xRange,		// an array of min, max such as [2e9, 12e9]; default is autorange based on data
		// lineChartInputObject.yRange,		// an array of min, max such as [0, -80]; default is autorange based on data
		// lineChartInputObject.showPoints,	// a string with either 'show' or 'hide', if not specified, default is 'show'
		// lineChartInputObject.showLables,	// a string with either 'show' or 'hide', if not specified, default is 'show'
		// lineChartInputObject.traceColor,	// a string with either 'color' or 'gray', if not specified, default is 'color'

		// there are default values for all the above.
		// just use nP.lineChart() and view Gain and Noise Figure

		// lineChart has one arguement, lineChartInputObject.
		// if no arguement, an svg and a default chart is created

		/*
		 ********************************************************
		 ********************************************************

		This section sets up the inputs

		 ********************************************************
		 ********************************************************	
		 */

		// there is a requierment for unique ID for each chart svg, it is defined by the user in the svg, or created if no svg
		// a sequencial chartID is generated at every lineChart call. if no chartID provided, this one is used.
		var chartText = 'chart' + (document.getElementsByTagName('svg').length + 1).toString();

		(function ( ) {
			var idAttr = document.createAttribute('id');
			var widthAttr = document.createAttribute('width');
			var heightAttr = document.createAttribute('height');
			var chartBody = document.getElementsByTagName("body")[0];
			var chart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			idAttr.value = chartText; // chart1
			widthAttr.value = 400;
			heightAttr.value = 300;
			chart.setAttributeNode(idAttr);
			chart.setAttributeNode(widthAttr);
			chart.setAttributeNode(heightAttr);
			if(!lineChartInputObject.chartID){
				// added this for webpage
				var outputBox = document.getElementsByClassName('outputBox')[0];

				outputBox === undefined ? chartBody.appendChild(chart) : outputBox.appendChild(chart);}	})();

		// this is the internal inputTable that has default data if no inputTable data provided
		var inputTable = lineChartInputObject.inputTable || [ 
			[
				['Freq','s21dB','s23dB'],
				[0,-3.52182,-3.52182],
				[600000000,-3.51008,-4.19455],
				[1200000000,-3.47582,-5.72534],
				[1800000000,-3.42189,-7.46851],
				[2400000000,-3.35291,-9.21548],
				[3000000000,-3.27504,-11.01964],
				[3600000000,-3.19561,-13.04088],
				[4200000000,-3.12248,-15.53461],
				[4800000000,-3.06328,-18.99038],
				[5400000000,-3.02443,-24.83689],
				[6000000000,-3.01031,-53.90094],
				[6600000000,-3.02253,-25.46905],
				[7200000000,-3.05969,-19.30541],
				[7800000000,-3.11761,-15.74536],
				[8400000000,-3.18997,-13.20271],
				[9000000000,-3.26921,-11.15721],
				[9600000000,-3.34745,-9.34356],
				[10200000000,-3.41731,-7.596],
				[10800000000,-3.47251,-5.85015],
				[11400000000,-3.50832,-4.28704],
				[12000000000,-3.52176,-3.52571]
			]	
		];

		// lineChart mutates inputTable. if same inputTable is reused by another lineChart, output is distorted.
		// so we create a duplicate version of the inputTable and leave the original version unmutated.
		var inputTableDuplicated = JSON.parse(JSON.stringify(inputTable));

		var metricPrefix = lineChartInputObject.metricPrefix || 'giga';
		var chartID = lineChartInputObject.chartID ? ('#' + lineChartInputObject.chartID) : ('#' + chartText) ; //d3 wants a '#' in front of an id
		var chartTitle = lineChartInputObject.chartTitle || '';
		var titleVisibilty = function () {
			if (chartTitle===''){return 'hidden'}
			else {return 'visible'}	};
		var xAxisTitle = lineChartInputObject.xAxisTitle || 'Frequency';
		var yAxisTitle = lineChartInputObject.yAxisTitle || 'dB';
		var xAxisTitleOffset = 40;
		var yAxisTitleOffset = 40;
		var showPoints = lineChartInputObject.showPoints === 'hide' ? false : (lineChartInputObject.showPoints === 'show' ? true : true);
		var showLables = lineChartInputObject.showLables === 'hide' ? false : (lineChartInputObject.showLables === 'show' ? true : true);
		var traceColor = lineChartInputObject.traceColor === 'color' ? false : (lineChartInputObject.traceColor === 'gray' ? true : false);

		var pickScale = function (metricPrefix){
			var out = 0;
			if (metricPrefix === 'giga') {out = 1e9;}		if (metricPrefix === 'mega') {out = 1e6;}		if (metricPrefix === 'kilo') {out = 1e3;}		if (metricPrefix === 'none') {out = 1;}		if (metricPrefix === 'deci') {out = 1e-1;}		if (metricPrefix === 'centi') {out = 1e-2;}		if (metricPrefix === 'milli') {out = 1e-3;}		if (metricPrefix === 'micro') {out = 1e-6;}		if (metricPrefix === 'nano') {out = 1e-9;}		if (metricPrefix === 'pico') {out = 1e-12;}		return out;
		};

		/*
		 ********************************************************
		 ********************************************************

		This section formats the data so d3 likes it

		 ********************************************************
		 ********************************************************	
		 */

		var generateFormattedData = function (inputTable) {
			var k = 0;
			var divisor = pickScale(metricPrefix); // default is giga, 1e9
			var inputTableFrequencyAdjusted = [];

			inputTableFrequencyAdjusted = inputTable;

			for (k = 1; k < inputTable.length; k++) {
				inputTableFrequencyAdjusted[k][0] = inputTable[k][0]/divisor;
			}
			var tsv = '';
			inputTableFrequencyAdjusted.forEach( (element) => {
				tsv += element.join('\t') + '\n';
			});
			//use d3 to turn tsv data into d3 data
			var data = tsvParse(tsv);

			//change data type from string to float, for arbitrary sized/named table
			data.forEach( d => {
				for (k = 0; k < data.columns.length; k++){
					d[data.columns[k]] = +d[data.columns[k]];
				}		});

			//change the data to groupData
			var groupData = data.columns.slice(1).map(function(yName) {// this will return an array of objects
				return {
					yName: yName,                       // this is the rf dB plot
					yValues: data.map(function(d) {     // this will return an inner Array of objects
						return {xValue: d[data.columns[0]], // this is the rf frequency
							yValue: d[yName]};          // this is the dB value
					})
				};
			});
			return groupData;
		};

		var formattedData = inputTableDuplicated.map( function(element) {
			return generateFormattedData(element);
		});

		var xSpan = []; // the span of the the x axis
		formattedData.flat().forEach( function (element) {
			element.yValues.forEach(function (item) { xSpan.push(item.xValue);});	
		});

		// checks if xRange is specified, if it is then xSpan is updated with scaled xRange input
		if(lineChartInputObject.xRange) {xSpan = lineChartInputObject.xRange.map( function (element) { return element/pickScale(metricPrefix);});}
		var ySpan = []; // the span of the y axis
		formattedData.flat().forEach( function (element) {
			element.yValues.forEach(function (item) { ySpan.push(item.yValue);});	
		});

		// checks if yRange is specified, if it is then ySpan is updated with yRange input
		ySpan = lineChartInputObject.yRange || ySpan;

		/*
		 ********************************************************
		 ********************************************************

		This section sets up the plot area

		 ********************************************************
		 ********************************************************	
		 */

		//set up the plot area
		var chartRect = select(chartID).node().getBoundingClientRect();
		var outerWidth = chartRect.width;
		var outerHeight = chartRect.height;
		var margin = { left: 70, top: 20, right: 20, bottom: 60 };

		var innerWidth  = outerWidth  - margin.left - margin.right;
		var innerHeight = outerHeight - margin.top  - margin.bottom;

		var x = linear().domain(extent(xSpan)).range([0, innerWidth]);
		var y = linear().domain(extent(ySpan)).range([innerHeight, 0]);

		var svg = select(chartID) // this always runs and it overwrites the chartID specified svg
			.attr("width", outerWidth)
			.attr("height", outerHeight)
			.attr("class", 'lineChart remove') // added remove class for elements that could be removed
			.style('background-color', '#ffffff');

		svg.append('rect')
			.attr("width", outerWidth)
			.attr("height", outerHeight)
			.attr('fill', 'none')
			.attr('stroke', 'black')
			.attr('stroke-width', '1px')
			.attr('id', 'outerRect');

		var chartTitle = svg.append('text')
			.attr('transform', 'translate(' + (2) + ',' + (8) + ')')
			.attr("x", 3)
			.attr("dy",  "0.35em")
			.attr('id', 'chartTitleID')
			.style('visibility', titleVisibilty)
			.style("font", "11px sans-serif")
			.text(chartTitle);

		var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		//append the x axis onto g
		g.append('g')
			.attr('class', 'xAxis')
			.style('font-size', '12')
			.attr('transform', 'translate(0,' + innerHeight + ')')
			.call(axisBottom(x))
			.append('text')
			.attr("fill", "#000")
			.style("text-anchor", "middle")
			.attr("transform", "translate(" + (innerWidth / 2) + "," + xAxisTitleOffset + ")")
			.style('font-size', '20')
			.text(xAxisTitle);						
		//append the x axis grid onto g
		g.append('g')
			.attr("class", "xGrid")
			.attr('transform', 'translate(0,' + innerHeight + ')')
			.call(axisBottom(x).tickSize(-innerHeight).tickFormat("")).attr('stroke', 'gray').attr('stroke-dasharray', '3, 3');	  
		//append the y axis onto g
		g.append('g')
			.attr('class', 'yAxis')
			.style('font-size', '12')
			.call(axisLeft(y))
			.append('text')
			.attr("fill", "#000")
			.style("text-anchor", "middle")
			.attr("transform", "translate(-" + yAxisTitleOffset + "," + (innerHeight / 2) + ") rotate(-90)")
			.style('font-size', '20')
			.text(yAxisTitle);						
		//append the y axis grid onto g
		g.append('g')
			.attr("class", "yGrid")
			.call(axisLeft(y).tickSize(-innerWidth).tickFormat("")).attr('stroke', 'gray').attr('stroke-dasharray', '3, 3');

		/*
		 ********************************************************
		 ********************************************************

		This section plots the data

		 ********************************************************
		 ********************************************************	
		 */

		var colorIndex = 0;
		formattedData.forEach(function(groupData, groupIndex) { 

			function plotColor (colorIndex) {	
				var grayScale = ['d4d4d4','646464','c4c4c4','545454','b4b4b4','444444','a4a4a4','343434','949494','242424','848484','141414','747474','040404'][colorIndex];
				var colorScale = category10[colorIndex];
				var outScale = traceColor ? grayScale : colorScale;
				return outScale;
			}
			var newPlot = 'newPlot' + groupIndex.toString();	
			g.selectAll('g.newPlot')
				.data(groupData)
				.enter()
				.append('g')
				.attr('class', newPlot)
				.each( function (d) {
					var line$1 = line()
						.x(d => x(d.xValue))
						.y(d => y(d.yValue));

					select(this).append("path")
						.attr('d', d => line$1(d.yValues))
						.style("stroke", plotColor(colorIndex)).style('fill', 'none').style('stroke-width', '2');

					if(showPoints === true){
						select(this).selectAll('circle')
							.data(d => d.yValues)
							.enter()
							.append('circle')
							.attr('class', 'peek' + chartID.slice(1))
							.attr('cx', d => x(d.xValue))
							.attr('cy', d => y(d.yValue))
							.attr('r', 2)
							.style("stroke", plotColor(colorIndex)).style('fill', plotColor(colorIndex)).style('stroke-width','2');
					}
					if (showLables === true) {
						select(this).append("text")
							.attr('class', 'textLable')
							.attr("transform", function(d) { 
								let textShift = function () { // put start of lable to the right side of chart rectangle
									let points = d.yValues.length;
									if (points === 1) {return 1}								if (points === 2) {return 2}								if (points === 3) {return 2}								if (points === 4) {return 2}								if ( (points => 5) && (points <= 10) ) {return Math.ceil(points/4) + 2}								if ( (points => 11) && (points <= 100) ) {return Math.ceil(points/4) + 1}								if (points => 101) {return Math.ceil(points/4)}							}();
								let shiftDown = function () { // put lable above or below the trace depending on slope
									let points = d.yValues.length;
									if (points < 50) {return 10}								if (points => 50) {
										let low = d.yValues[d.yValues.length-textShift-10].yValue;
										let high = d.yValues[d.yValues.length-textShift+10].yValue;
										if(low <= high) {return 10} // put lable below trace, positive slope
										if(low > high) { return -10} // put lable above trace, negative slope	
									}
								}();
								let shiftRight = 10;
								return "translate(" + (x(d.yValues[d.yValues.length-textShift].xValue) + shiftRight) + "," + (y(d.yValues[d.yValues.length-textShift].yValue) + shiftDown) + ")";})
							.attr("x", 3)
							.attr("dy", "0.35em")
							.style("font", "12px sans-serif")
							.text(function(d) { return d.yName; });
					}				colorIndex++;
				});//end d3.each() 
		});// end .forEach()

		/*
		 ********************************************************
		 ********************************************************

		This section enables a capability to hover over a point, then see the x and y values the bottom right of the plot.
		You may also click on a point to high light it and show the x and y values and include them in the PNG.

		 ********************************************************
		 ********************************************************	
		 */

		// define outside if-then because I want to remove it in the toPNG function
		let dataTextID = 'dataText' + chartID.slice(1); // slice(1) removes '#' from chartID
		let dataText = svg.append('text')
			.attr('transform', 'translate(' + (outerWidth - 190) + ',' + ( outerHeight - 10 ) + ')' )
			.attr("x", 3)
			.attr("dy",  "0.35em")
			.attr('id', dataTextID)
			.style('visibility', 'visible')
			.style("font", "11px sans-serif");

		// make clicked visible to toPNG
		var clicked = false;
		if(showPoints===true){ // example of the data structure of the points: {xValue: 10, yValue: 8}
			let circleArray = document.getElementsByClassName('peek' + chartID.slice(1));// console.log(circleArray);
			let circleArrayEnter = [], circleArrayLeave = [], circleClick = [], circleColor = '', i = 0;
			let oldIndex = -1;

			for (let element of circleArray) {
				element.__data__.index = i; // need to number all the circles
				circleArrayEnter[i] = element.addEventListener('mouseenter', function () {
					if(clicked===false) {
						circleColor = element.getAttribute('style','fill');
						element.setAttribute('style', 'fill: black'); 
						element.setAttribute('r', '4'); 
						dataText.text(xAxisTitle + ' = ' + (element.__data__).xValue.toPrecision(3) + ', ' + yAxisTitle + ' = ' + (element.__data__).yValue.toPrecision(3)  );
					}
				});
				circleArrayLeave[i] = element.addEventListener('mouseleave', function () {
					if(clicked===false) {
						dataText.text("");
						element.setAttribute('r', '2');
						element.setAttribute('style', circleColor);
					}
				});
				circleClick[i] = element.addEventListener('click', function () {
					if(oldIndex===-1) {
						oldIndex = element.__data__.index;
						clicked = true;
					} else if (element.__data__.index===oldIndex){
						dataText.text("");
						circleArray[oldIndex].setAttribute('r', '2');
						circleArray[oldIndex].setAttribute('style', circleColor);
						clicked = false;
						oldIndex=-1;
					} else 	;	
				});
				i++;
			}
		}
		/*
		 ********************************************************
		 ********************************************************

		This section converts the svg into a png for Save as ...

		 ********************************************************
		 ********************************************************	
		 */

		// construct the little square button at the upper right of the plot
		var buttonRectID = 'buttonRect' + chartID.slice(1); // slice(1) removes '#" from chartID
		var buttonRect = svg.append('rect') // this sets up the 'To PNG' button
			.attr('width', '10')
			.attr('height', '10')
			.attr('fill', '#d3d3d3')
			.attr('stroke', '#a9a9a9')
			.attr('stroke-width', '1px')
			.attr('id', buttonRectID)
			.attr('transform', 'translate(' + (outerWidth - 13) + ',' + 3 + ')');

		var buttonTextID = 'buttonText' + chartID.slice(1); // slice(1) removes '#' from chartID
		var buttonText = svg.append('text')
			.attr('transform', 'translate(' + (outerWidth - 105) + ',' + 9.5 + ')')
			.attr("x", 3)
			.attr("dy",  "0.35em")
			.attr('id', buttonTextID)
			.style('visibility', 'visible')
			.style("font", "11px sans-serif")
			.text('Change to PNG?');


		var toPNG = function toPNG () {
			// get rid of the button and the button text before converting to PNG
			buttonRect.remove(); buttonText.remove();

			// get rid of the text if dot is not clicked	
			if(clicked===false) {dataText.remove();}
			// get the old svg element to be replaced
			var oldSvg = document.getElementById(chartID.slice(1)); // slice(1) to remove '#' in front of chartID

			// Put the svg into an image tag so that the Canvas element can read it in.
			var doctype = '<?xml version="1.0" standalone="no"?>'
				+ '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

				// serialize our SVG XML to a string.			
				var source = (new XMLSerializer()).serializeToString(select(chartID).node());

			// create a file blob of our SVG.
			var blob = new Blob([ doctype + source], { type: 'image/svg+xml;charset=utf-8' });

			var url = window.URL.createObjectURL(blob);

			var tempImg = select('body').append('img')
				.attr('width', outerWidth)
				.attr('height', outerHeight)
				.attr('id', 'tempImg')
				.node();

			tempImg.onload = function(){
				// Now that the image has loaded, put the image into a canvas element.
				var canvas = select('body').append('canvas').node();
				canvas.width = outerWidth;
				canvas.height = outerHeight;
				canvas.id = 'tempCanvas';
				var ctx = canvas.getContext('2d');
				ctx.drawImage(tempImg, 0, 0);
				var canvasUrl = canvas.toDataURL("image/png");
				var newImg = select('body').append('img') 
					.attr('width', outerWidth)
					.attr('height', outerHeight)
					.attr('id', 'newImg')
					.attr('class', 'remove')
					.node();

				newImg.onload = function() {
					document.getElementById('newImg');
					oldSvg.parentNode.replaceChild(newImg, oldSvg);
				};
				// this is now the base64 encoded version of our PNG! you could optionally 
				// redirect the user to download the PNG by sending them to the url with 
				// `window.location.href= canvasUrl`.
				newImg.src = canvasUrl;
				canvas.remove();

			};
			// start loading the image.
			tempImg.src = url;
			tempImg.remove();

		};
		var buttonRect = document.getElementById(buttonRectID);
		var buttonText = document.getElementById(buttonTextID);

		buttonRect.addEventListener('mouseenter', function () { buttonRect.setAttribute('fill', '#a9a9a9');});
		buttonRect.addEventListener('mouseleave', function () { buttonRect.setAttribute('fill', '#d3d3d3');});
		buttonRect.addEventListener("click", function() { toPNG(); });

	}

	const version = '0.0.45';

	function CplxToCell(complexNumber) {
		return complexNumber.x.toPrecision(4) + (complexNumber.y.toPrecision(4) >= 0 ? " +j" + complexNumber.y.toPrecision(4) : " -j" + (-complexNumber.y).toPrecision(4));
	}
	function createArray(myArray) {
		var row = 0, element = '', html = '';

		html = "<table><tbody>"; // fill in the table with one column only
		for (row = 0; row < myArray.length; row++) {
			if ( typeof myArray[row] === 'string') {
				element = myArray[row];
			} else if ( typeof myArray[row] === 'number') {
				element = myArray[row].toPrecision(4);
			} else if ( myArray[row].constructor.name === 'Complex') {
				element = CplxToCell(myArray[row]);
			} else {
				element = '** ** **';
			}		html +="<tr>";
			html += "<td style='text-align: center; border-style: solid; border-width: 1px' width='140px'>" + element;
			html += "</td>";
			html +="</tr>";
		}	html += "</tbody></table>"; // finish the one column table
		return html; // return the one column table
	}

	function createTable (myMatrix) {
		var row = 0, col = 0, html = "";

		html = "<table><tbody>"; // fill in the table
		for (row = 0; row < myMatrix.length; row++) {
			html +="<tr>";
			for (col = 0; col < myMatrix[0].length; col++) {
				html += "<td style='text-align: center; border-style: solid; border-width: 1px' width='140px'>" + myMatrix[row][col].toPrecision(4);
				html += "</td>";
			}		html +="</tr>";
		}	html += "</tbody></table>"; // finish the table

		return html; // return the table
	}



	function createCplxTable (myMatrix) {
		var row = 0, col = 0, html = "";

		html = "<table><tbody>"; // fill in the table
		for (row = 0; row < myMatrix.length; row++) {
			html +="<tr>";
			for (col = 0; col < myMatrix[0].length; col++) {
				html += "<td style='text-align: center; border-style: solid; border-width: 1px' width='140px'>" + CplxToCell(myMatrix[row][col]);
				html += "</td>";
			}		html +="</tr>";
		}	html += "</tbody></table>"; // finish the table

		return html; // return the table
	}

	function lineTable$1(out) {
		var row = 0, col = 0, element = '', html = '';

		html = "<table><tbody>"; // fill in the table with one column only
		for (row = 0; row < out.length; row++) {
			html +="<tr>";
			for (col = 0; col < out[0].length; col++) {
				if ( typeof out[row][col] === 'string') {
					element = out[row][col];
				} else if ( typeof out[row][col] === 'number') {
					element = out[row][col].toPrecision(4);
				} else if ( out[row][col].constructor.name === 'Complex') {
					element = CplxToCell(out[row][col]);
				} else {
					element = '** ** **';
				}			html += "<td style='text-align: center; border-style: solid; border-width: 1px' width='140px'>" + element;
				html += "</td>";
			}
			html +="</tr>";
		}	html += "</tbody></table>"; // finish the one column table
		return html; // return the one column table
	}

	function log(input) {
		var pre = document.createElement('pre');
		var output = '';
		var classAttr = document.createAttribute('class');

		// added this for webpage
		var outputBox = document.getElementsByClassName('outputBox')[0];

		classAttr.value = 'outputSection remove'; // added another class name for elements to be removed
		pre.setAttributeNode(classAttr);
		if ( typeof input === 'string'){
			output = input;
		} else if ( typeof input === 'number'){
			output = input.toPrecision(4);
		} else if ( typeof input === 'boolean' ){
			output = input;
		} else if ( input instanceof Array && input.m === undefined && !(input[0] instanceof Array) ) { // linear array
			output = createArray(input);
		} else if (input instanceof Array && input[0] instanceof Array) { // lineTable
			output = lineTable$1(input);
		} else if ( input.constructor.name === 'Complex') {
			var real = '', imaginary = '';
			real = input.getR().toPrecision(4);
			imaginary = input.getI() >= 0 ? 'j' + input.getI().toPrecision(4) : '-j' + (Math.abs(input.getI())).toPrecision(4);
			output = real + ', ' + imaginary;
		} else if ( typeof input === 'object' && input.m.constructor.name === 'Array' && !(input.m[0][0].constructor.name === 'Complex')) { // matrix of real numbers 
			output = createTable(input.m);
		} else if ( typeof input === 'object' && input.m.constructor.name === 'Array' && input.m[0][0].constructor.name === 'Complex') { // matrix of Complex numbers
			output = createCplxTable(input.m);
		} else {
			output = "nP.log can't read this input";
		}	pre.innerHTML = output;
		outputBox === undefined ? document.body.appendChild(pre) : outputBox.appendChild(pre);
	}

	function  lineTable (lineTableInputObject = {}) {

		// here is the definition of the lineTableInputObject data structure:

		// lineTableInputObject.inputTable,	// an array of outs [out1, out2 ... outn]; default is internal inputTable
		// lineTableInputObject.tableID,	// a string of an svg id 'table'; default is 'table1'
		// lineTableInputObject.metricPrefix,	// a string of a metric prefix such as 'giga'; default is 'giga'
		// lineTableInputObject.tableTitle,		// a string of the chart tableTitle; default is blank
		// lineTableInputObject.headColor,	// a string with either 'color' or 'gray', if not specified, default is 'color'
		// lineTableInputObject.tableWH,	// a string with either 'no' or 'yes', if not specified, default is 'no'

		// there are default values for all the above.
		// just use nP.lineTable() and view the Insertion Loss, Return Loss

		// this function has one arguement, lineTableInputObject.
		// if no arguement, then an internal default version of the lineTableInputObject is used.
		// if no lineTableImputObject.tableID, then a div is created.

		// a sequencial tableID is generated at every lineChart call. if no canvasID provided, this one is used.

		/*
		 ********************************************************
		 ********************************************************

		This section sets up the inputs

		 ********************************************************
		 ********************************************************	
		 */

		var tableText = 'table' + (document.getElementsByTagName('svg').length + 1).toString();

		(function ( ) {
			var idAttr = document.createAttribute('id');
			var widthAttr = document.createAttribute('width');
			var heightAttr = document.createAttribute('height');
			var tableBody = document.getElementsByTagName("body")[0];
			var table = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			idAttr.value = tableText; // table1
			widthAttr.value = 400;
			heightAttr.value = 400;
			table.setAttributeNode(idAttr);
			table.setAttributeNode(widthAttr);
			table.setAttributeNode(heightAttr);
			if(!lineTableInputObject.tableID){
				// added this for webpage
				var outputBox = document.getElementsByClassName('outputBox')[0];

				outputBox === undefined ? tableBody.appendChild(table) : outputBox.appendChild(table);}	})();

		// this is the internal inputTable that has default data if no inputTable data provided
		var inputTable = lineTableInputObject.inputTable || [ 
			[
				['Freq','s21dB','s23dB'],
				[0,-3.52182,-3.52182],
				[600000000,-3.51008,-4.19455],
				[1200000000,-3.47582,-5.72534],
				[1800000000,-3.42189,-7.46851],
				[2400000000,-3.35291,-9.21548],
				[3000000000,-3.27504,-11.01964],
				[3600000000,-3.19561,-13.04088],
				[4200000000,-3.12248,-15.53461],
				[4800000000,-3.06328,-18.99038],
				[5400000000,-3.02443,-24.83689],
				[6000000000,-3.01031,-53.90094],
				[6600000000,-3.02253,-25.46905],
				[7200000000,-3.05969,-19.30541],
				[7800000000,-3.11761,-15.74536],
				[8400000000,-3.18997,-13.20271],
				[9000000000,-3.26921,-11.15721],
				[9600000000,-3.34745,-9.34356],
				[10200000000,-3.41731,-7.596],
				[10800000000,-3.47251,-5.85015],
				[11400000000,-3.50832,-4.28704],
				[12000000000,-3.52176,-3.52571]
			]	

		];

		// lineTable mutates inputTable. if same inputTable is reused by another lineTable, output is distorted.
		// so we create a duplicate version of the inputTable and leave the original version pristine
		var inputTableDuplicated = JSON.parse(JSON.stringify(inputTable));

		var metricPrefix = lineTableInputObject.metricPrefix || 'giga';
		var tableID = lineTableInputObject.tableID ? ('#' + lineTableInputObject.tableID) : ('#' + tableText) ; //d3 wants a '#' in front of an id
		var tableTitle = lineTableInputObject.tableTitle || '';
		var titleVisibilty = function () {
			if (tableTitle===''){return 'hidden'}
			else {return 'visible'}	};
		var headColor = lineTableInputObject.headColor === 'color' ? false : (lineTableInputObject.headColor === 'gray' ? true : false);
		var tableWH = lineTableInputObject.tableWH === 'no' ? false : (lineTableInputObject.tableWH === 'yes' ? true : false);

		var pickScale = function (metricPrefix){
			var out = 0;
			if (metricPrefix === 'tera') {out = 1e12;}		if (metricPrefix === 'giga') {out = 1e9;}		if (metricPrefix === 'mega') {out = 1e6;}		if (metricPrefix === 'kilo') {out = 1e3;}		if (metricPrefix === 'one') {out = 1;}		if (metricPrefix === 'deci') {out = 1e-1;}		if (metricPrefix === 'centi') {out = 1e-2;}		if (metricPrefix === 'milli') {out = 1e-3;}		if (metricPrefix === 'micro') {out = 1e-6;}		if (metricPrefix === 'nano') {out = 1e-9;}		if (metricPrefix === 'pico') {out = 1e-12;}		return out;
		};

		// frequency number in column 0 is scaled by the metric prefix
		var scaleFreq = function scaleFreq (array) {
			var row = 0;
			for (row = 1; row< array.length; row ++) {
				array[row][0] = array[row][0]/pickScale(metricPrefix);
			}
		};

		// inputTableDuplicated is mutated in this forEach !!! scale all the frequencies in all the tables
		inputTableDuplicated.forEach(function (element) {
			scaleFreq(element);
		});

		/*
		 ********************************************************
		 ********************************************************

		This section sets up the <table> area. No 'toPNG' possible

		 ********************************************************
		 ********************************************************	
		 */

		//set up the <table> area

		// determine total rows and colums of the table
		var totalTables = inputTableDuplicated.length; // default is two tables
		var totalRows = 0;
		var totalCols = 0;
		var rowsPerTable = [];
		inputTableDuplicated.forEach( function (element) { return totalRows = totalRows + element.length;});
		inputTableDuplicated.forEach( function (element) { 
			element.forEach(function (e) {
				totalCols = (totalCols >= e.length ? totalCols : e.length );
				return totalCols;
			});
		});
		inputTableDuplicated.forEach( function (element, d) {
			rowsPerTable[d] = element.length;
		});	

		// determine the inner and outer dimensions
		var columnWidth = 100;
		var tableWidth = totalCols * (columnWidth + 3) + 1;
		var rowHeight = 20;
		var tableHeight = totalRows * (rowHeight + 1) + (totalTables - 1) + 1;// adding for border and for stacked tables
		var margin = { left: 20, top: 20, right: 20, bottom: 20 };
		var outerWidth = margin.left + tableWidth + margin.right;
		var outerHeight = margin.top + tableHeight + margin.bottom;

		// when producing the PNG, determine the x and y values for the upper left corner of the tables
		var x = 20; // this will always be a constant, starting with 20
		var y = []; // this will always be an array, starting with 20, each element of the array is a new table
		rowsPerTable.forEach( function(element, index, array) {
			if (index === 0) { y[0] = 21;}
			if (index >   0) { y[index] = y[index-1] + (rowHeight + 1) * array[index-1] +1; }	}); 

		// shows alert box displaying the width and height of the table if inputTableObject.tableWH is 'yes'
		if(tableWH) {alert('The table dimensions: Width is ' + outerWidth + ', ' + 'Height is ' + outerHeight);}
		// get the svg and add the children elements
		var svg = select(tableID) // this always runs and it overwrites the tableID specified svg
			.attr("width", outerWidth)
			.attr("height", outerHeight)
			.attr("class", 'lineTable remove') // added extra classname for elements that could be removed
			.style('background-color', '#ffffff');
		//		.style('border', '1px solid black');

		svg.append('rect')
			.attr("width", outerWidth)
			.attr("height", outerHeight)
			.attr('fill', 'none')
			.attr('stroke', 'black')
			.attr('stroke-width', '1px')
			.attr('id', 'outerRect');


		var g = svg.append('g')
		//.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		;

		var tableTitle = svg.append('text')
			.attr('transform', 'translate(' + (2) + ',' + (8) + ')')
			.attr("x", 3)
			.attr("dy",  "0.35em")
			.attr('id', 'tableTitleID')
			.style('visibility', titleVisibilty)
			.style("font", "11px sans-serif")
			.text(tableTitle);

		var foreign = g.append('foreignObject')
			.attr('id', 'foreign' + tableID.slice(1))
			.attr('x',margin.left)
			.attr('y',margin.top)
			.attr('width',tableWidth)
			.attr('height',tableHeight);
		var divTable = foreign.append('xhtml:div'); // put the table in this div

		// create each table	
		function createTable (myArray) {
			var row = 0, col = 0, textAlign = '', backgroundColor = '';
			var table = divTable.append('table')
				.attr('width', function () {return ( myArray[0].length===totalCols ? tableWidth : 25) ;})
				.style('table-layout', 'fixed')
				.style('border-collapse','collapse');
			for (row = 0; row < myArray.length; row++) {
				var tr = table.append('tr');
				for (col = 0; col < myArray[0].length; col++) {
					tr.append('td')
						.attr('width',columnWidth)
						.attr('height',rowHeight-2) // needed to enforce hmlt5 compliance, <!doctype html> must be used for nPort.
						.style('border-style','solid')
						.style('border-width','1px')
						.style('overflow','hidden')
						.style('white-space','nowrap')
						.style('text-align', function() {
							textAlign = (typeof myArray[row][col]==='string' ? 'center' : 'left');
							return textAlign;
						})
						.style('background-color', function() {
							backgroundColor = (typeof myArray[row][col]==='string' ? (headColor ? '#d4d4d4' : '#add8e6') : 'white');
							return backgroundColor;
						})	.html( (typeof myArray[row][col]==='string' ? myArray[row][col] : myArray[row][col].toFixed(5)) );
				}		}
		}
		// calls createTable for each table, two tables included in the default inputTableOject
		inputTableDuplicated.forEach(function (element) {
			createTable(element);
		});

		/*
		 ********************************************************
		 ********************************************************

		This section adds a button to the svg above and to the right of the table

		 ********************************************************
		 ********************************************************	
		 */

		// construct the little square button at the upper right of the plot
		var buttonRectID = 'buttonRect' + tableID.slice(1); // slice(1) removes '#" from chartID
		var buttonRect = svg.append('rect') // this sets up the 'To PNG' button
			.attr('width', '10')
			.attr('height', '10')
			.attr('fill', '#d3d3d3')
			.attr('stroke', '#a9a9a9')
			.attr('stroke-width', '1px')
			.attr('id', buttonRectID)
			.attr('transform', 'translate(' + (outerWidth - 13) + ',' + 3 + ')');

		var buttonTextID = 'buttonText' + tableID.slice(1); // slice(1) removes '#' from chartID
		var buttonText = svg.append('text')
			.attr('transform', 'translate(' + (outerWidth - 105) + ',' + 9.5 + ')')
			.attr("x", 3)
			.attr("dy",  "0.35em")
			.attr('id', buttonTextID)
			.style('visibility', 'visible')
			.style("font", "11px sans-serif")
			.text('Change to PNG?');

		/*
		 ********************************************************
		 ********************************************************

		This section creates the png image when the button is clicked

		 ********************************************************
		 ********************************************************	
		 */

		var createPngTable = function createPngTable (myArray, x, y) {
			var row = 0, col = 0, notLastCellWidth = 0, lastCellWidth = 0, color = '';
			for (row = 0; row < myArray.length; row++) {
				for (col = 0; col < myArray[0].length; col++) {
					svg.append('rect')
						.attr('x', x + (columnWidth + 3) * col)
						.attr('y', y + (rowHeight + 1) * row)
						.attr('width', function() {
							notLastCellWidth = columnWidth + 4;
							lastCellWidth = notLastCellWidth -1;
							if(col === myArray[0].length -1) { return lastCellWidth;}						return notLastCellWidth;
						})
						.attr('height', rowHeight + 1)
						.attr('fill', function () {
							color = typeof myArray[row][col]==='string' ? (headColor ? '#d4d4d4' : '#add8e6') : 'white';
							return color;
						})
						.attr('stroke', 'black')
						.attr('stroke-width', '1px');
					svg.append('text')
						.attr('transform', function () {
							var center = 0;
							center = typeof myArray[row][col]==='string' ? Math.round(columnWidth/2 - (myArray[row][col].length*columnWidth)/28) : 3;

							return 'translate(' + (x + center + (columnWidth + 3) * col) + ',' + (y + 16 + (rowHeight + 1) * row) + ')'
						})
						.style('visibility', 'visible')
						.text(typeof myArray[row][col]==='string' ? myArray[row][col] : myArray[row][col].toFixed(5));

				}
			}	};

		var toPNG = function toPNG () {
			// remove the foreignObject element and all it's children
			var foreign = document.getElementById('foreign'+tableID.slice(1)); foreign.remove();

			// calls createPngTable for each table, two tables included in the default inputTableOject
			inputTableDuplicated.forEach(function (element, index) {
				createPngTable(element, x, y[index]);
			});

			// get rid of the button and the button text before converting to PNG
			buttonRect.remove(); buttonText.remove();


			// get the old svg element to be replaced
			var oldSvg = document.getElementById(tableID.slice(1)); // slice(1) to remove '#' in front of chartID

			// Put the svg into an image tag so that the Canvas element can read it in.
			var doctype = '<?xml version="1.0" standalone="no"?>'
				+ '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

				// serialize our SVG XML to a string.			
				var source = (new XMLSerializer()).serializeToString(select(tableID).node());

			// create a file blob of our SVG.
			var blob = new Blob([ doctype + source], { type: 'image/svg+xml;charset=utf-8' });

			var url = window.URL.createObjectURL(blob);
			var tempImg = select('body').append('img')
				.attr('width', outerWidth)
				.attr('height', outerHeight)
				.attr('id', 'tempImg')
				.node();
			tempImg.onload = function(){
				// Now that the image has loaded, put the image into a canvas element.
				var canvas = select('body').append('canvas').node();
				canvas.width = outerWidth;
				canvas.height = outerHeight;
				canvas.id = 'tempCanvas';
				var ctx = canvas.getContext('2d');
				ctx.drawImage(tempImg, 0, 0);
				var canvasUrl = canvas.toDataURL("image/png");
				var newImg = select('body').append('img') 
					.attr('width', outerWidth)
					.attr('height', outerHeight)
					.attr('id', 'newImg')
					.attr('class', 'remove')
					.node();

				newImg.onload = function() {
					document.getElementById('newImg');
					oldSvg.parentNode.replaceChild(newImg, oldSvg);
				};
				// this is now the base64 encoded versikjon of our NG! you could optionally 
				// redirect the user to download the PNG by sending them to the url with 
				// `window.location.href= canvasUrl`.
				newImg.src = canvasUrl;
				canvas.remove();

			};
			// start loading the image.
			tempImg.src = url;
			tempImg.remove();

		};
		var buttonRect = document.getElementById(buttonRectID);
		var buttonText = document.getElementById(buttonTextID);

		buttonRect.addEventListener('mouseenter', function () { buttonRect.setAttribute('fill', '#a9a9a9');});
		buttonRect.addEventListener('mouseleave', function () { buttonRect.setAttribute('fill', '#d3d3d3');});
		buttonRect.addEventListener("click", function() { toPNG(); });

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
					var sparsTo = sparsArgument.match(/dB|mag|ang|Re|Im/).toString();
					if(sparsTo === 'mag') {inner.push(element[sparIndex].mag());}				if(sparsTo === 'dB')  {inner.push(element[sparIndex].mag20dB());}				if(sparsTo === 'ang') {inner.push(element[sparIndex].ang());}				if(sparsTo === 'Re')  {inner.push(element[sparIndex].getR());}
					if(sparsTo === 'Im')  {inner.push(element[sparIndex].getI());}
				});  // end of forEach
				return inner;
			}); // end of map
			sparsArguments.unshift('Freq');
			copy.unshift(sparsArguments);
			return copy;
		},
		outTable : function out (...sparsArguments) {
			var spars = this.getspars();
			var n = Math.sqrt(spars[0].length - 1); 
			var copy = spars.map(function (element,index,spars) {
				var inner = [element[0]];
				sparsArguments.forEach(function (sparsArgument,index1,array) {
					var row = parseInt(sparsArgument.match(/\d/g)[0]);
					var col = parseInt(sparsArgument.match(/\d/g)[1]);
					var sparIndex = (row - 1) * n + col;
					var sparsTo = sparsArgument.match(/dB|mag|ang|Re|Im/).toString();
					if(sparsTo === 'mag') {inner.push(element[sparIndex].mag());}				if(sparsTo === 'dB')  {inner.push(element[sparIndex].mag20dB());}				if(sparsTo === 'ang') {inner.push(element[sparIndex].ang());}				if(sparsTo === 'Re')  {inner.push(element[sparIndex].getR());}
					if(sparsTo === 'Im')  {inner.push(element[sparIndex].getI());}
				});  // end of forEach
				return inner;
			}); // end of map
			sparsArguments.unshift('Freq');
			copy.unshift(sparsArguments);
			return copy.map(function(element) {return element;});
		},
	};

	function seR(R = 75) { // series resistor nPort object
		var seR = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
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
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
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

	function paL(L = 5e-9) { // parallel capacitor nPort object   
		var paL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount]);
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paL.setspars(sparsArray);
		paL.setglobal(global);				
		return paL;
	}

	function seC(C = 1e-12) { // series inductor nPort object
		var seC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, -1/(2*Math.PI*C*frequencyList[freqCount]));	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seC.setspars(sparsArray);
		seC.setglobal(global);	
		return seC;
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

	function trf(N = 0.5) { // parallel resistor nPort object
		var trf = new nPort;
		var e = 1e-7;
		var frequencyList = global.fList; global.Ro;
		var freqCount = 0, s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex((N**2-1)/(N**2+1),0+e);
			s12 = complex(2*N/(N**2+1),0+e);  
			s21 = complex(2*N/(N**2+1),0+e);  
			s22 = complex((1-N**2)/(N**2+1),0+e);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		trf.setspars(sparsArray);
		trf.setglobal(global);	
		return trf;
	}

	function trf4Port(N = 0.5) { // parallel resistor nPort object
		var trf4Port = new nPort;
		var frequencyList = global.fList; global.Ro;
		var freqCount = 0, sparsArray = [];
		var s11, s12, s13, s14,
			s21, s22, s23, s24,
			s31, s32, s33, s34,
			s41, s42, s43, s44;
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = s24 = s33 = s42 = complex((N**2)/(N**2+1),0);
			s14 = s23 = s32 = s41 = complex(-N/(N**2+1),0);  
			s12 = s21 = s34 = s43 = complex(N/(N**2+1),0);  
			s13 = s22 = s31 = s44 = complex((1)/(N**2+1),0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
		}
		trf4Port.setspars(sparsArray);
		trf4Port.setglobal(global);	
		return trf4Port;
	}
	/*                Note: N2 = N**2 N = 0.5, N2 = 0.25

	S11 = S24 = S33 = S42 = N2 / (1 + N2)  //  0.25/1.25 = 0.2
	S14 = S23 = S32 = S41 = -N / (1 + N2)  //  -0.5/1.25 = -0.4
	S12 = S21 = S34 = S43 =  N / (1 + N2)  //   0.5/1.25 = 0.4
	S13 = S22 = S31 = S44 =  1 / (1 + N2)  //     1/1.25 = 0.8
	*/

	function seSeRL(R = 75, L = 5e-9) { // series inductor nPort object
		var seSeRL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 2*Math.PI*L*frequencyList[freqCount]);	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seSeRL.setspars(sparsArray);
		seSeRL.setglobal(global);	
		return seSeRL;
	}

	function paSeRL(R = 75, L = 5e-9) { // parallel capacitor nPort object   
		var paSeRL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 2*Math.PI*L*frequencyList[freqCount]);
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paSeRL.setspars(sparsArray);
		paSeRL.setglobal(global);				
		return paSeRL;
	}

	function seSeRC(R = 75, C = 1e-12) { // series inductor nPort object
		var seSeRC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, -1/(2*Math.PI*C*frequencyList[freqCount]));	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seSeRC.setspars(sparsArray);
		seSeRC.setglobal(global);	
		return seSeRC;
	}

	function paSeRC(R = 75, C = 1e-12) { // parallel capaSeRCitor nPort object   
		var paSeRC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, -1/(2*Math.PI*C*frequencyList[freqCount]));
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paSeRC.setspars(sparsArray);
		paSeRC.setglobal(global);				
		return paSeRC;
	}

	function seSeLC(L = 5e-9, C = 1e-12) { // series inductor nPort object
		var seSeLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount] -1/(2*Math.PI*C*frequencyList[freqCount]));	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seSeLC.setspars(sparsArray);
		seSeLC.setglobal(global);	
		return seSeLC;
	}

	function paSeLC(L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var paSeLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount] -1/(2*Math.PI*C*frequencyList[freqCount]));
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paSeLC.setspars(sparsArray);
		paSeLC.setglobal(global);				
		return paSeLC;
	}

	function seSeRLC(R = 75, L = 5e-9, C = 1e-12) { // series inductor nPort object
		var seSeRLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 2*Math.PI*L*frequencyList[freqCount] -1/(2*Math.PI*C*frequencyList[freqCount]));	
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	seSeRLC.setspars(sparsArray);
		seSeRLC.setglobal(global);	
		return seSeRLC;
	}

	function paSeRLC(R = 75, L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var paSeRLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = complex(R, 2*Math.PI*L*frequencyList[freqCount] -1/(2*Math.PI*C*frequencyList[freqCount]));
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paSeRLC.setspars(sparsArray);
		paSeRLC.setglobal(global);				
		return paSeRLC;
	}

	function paPaRL(R = 75, L = 5e-9) { // parallel capacitor nPort object   
		var paPaRL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(R,0).inv()).add(complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv())  ).inv();
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paPaRL.setspars(sparsArray);
		paPaRL.setglobal(global);				
		return paPaRL;
	}

	function sePaRL(R = 75, L = 5e-9) { // parallel capacitor nPort object   
		var sePaRL = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(R,0).inv()).add(complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv())  ).inv();
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		sePaRL.setspars(sparsArray);
		sePaRL.setglobal(global);				
		return sePaRL;
	}

	function paPaRC(R = 75, C = 1e-12) { // parallel capacitor nPort object   
		var paPaRC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(R,0).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paPaRC.setspars(sparsArray);
		paPaRC.setglobal(global);				
		return paPaRC;
	}

	function sePaRC(R = 75, C = 1e-12) { // parallel capacitor nPort object   
		var sePaRC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(R,0).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		sePaRC.setspars(sparsArray);
		sePaRC.setglobal(global);				
		return sePaRC;
	}

	function paPaLC(L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var paPaLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paPaLC.setspars(sparsArray);
		paPaLC.setglobal(global);				
		return paPaLC;
	}

	function sePaLC(L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var sePaLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = (  (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		sePaLC.setspars(sparsArray);
		sePaLC.setglobal(global);				
		return sePaLC;
	}

	function paPaRLC(R = 75, L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var paPaRLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0), Yo = Zo.inv(), two = complex(2,0), freqCount = 0, Z = [], Y = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = ( (complex(R,0).inv()).add (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			Y[freqCount] = Z[freqCount].inv();
			s11 = (Y[freqCount].neg()).div(Y[freqCount].add(Yo.add(Yo)));
			s21 = (two.mul(Yo)).div(Y[freqCount].add(Yo.add(Yo)));  
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		paPaRLC.setspars(sparsArray);
		paPaRLC.setglobal(global);				
		return paPaRLC;
	}

	function sePaRLC(R = 75, L = 5e-9, C = 1e-12) { // parallel capacitor nPort object   
		var sePaRLC = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Z[freqCount] = ( (complex(R,0).inv()).add (complex(0, 2*Math.PI*L*frequencyList[freqCount]).inv()).add(complex(0, -1/(2*Math.PI*C*frequencyList[freqCount])).inv())  ).inv();
			s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
			s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
			s12 = s21;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}
		sePaRLC.setspars(sparsArray);
		sePaRLC.setglobal(global);				
		return sePaRLC;
	}

	function lpfGen( filt =[50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50]) { // returns a table of spars for a low Pass Filter
		var i = 0;
		var filtTable = [];
		filt.pop();
		filt.shift();
		for (i = 0; i < filt.length; i++) {
			if (i % 2 === 0) {filtTable[i] = paC(filt[i]);}		if (i % 2 === 1) {filtTable[i] = seL(filt[i]);}	}	for (i = 0; i < filt.length - 1; i++) {
			filtTable[i+1] = filtTable[i].cas(filtTable[i+1]);
		}	return filtTable[ filtTable.length-1 ];
	}

	function Tee() { // a 3port dummy connection
		var Tee = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); complex(2,0); var freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(1e-7 + -1/3,0);
			s12 = complex(1e-7 + 2/3,0);
			s13 = s12;
			s21 = s12;
			s22 = s11;
			s23 = s12;
			s31 = s12;
			s32 = s12;
			s33 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s21, s22, s23, s31, s32, s33];
		}	
		Tee.setspars(sparsArray);
		Tee.setglobal(global);
		return Tee;
	}

	function Tee4() { // a 4-port dummy connection
		var Tee4 = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); complex(2,0); var freqCount = 0, s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = s22 = s33 = s44 = complex(1e-7 + -1/2,0);
			s12 = s13 = s14 = s21 = s23 = s24 = s31 = s32 = s34 = s41 = s42 = s43 = complex(1e-7 + 1/2,0);
			
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
		}	
		Tee4.setspars(sparsArray);
		Tee4.setglobal(global);
		return Tee4;
	}

	function Tee5() { // a 4-port dummy connection
		var Tee5 = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); complex(2,0); var freqCount = 0, s11, s12, s13, s14, s15, s21, s22, s23, s24, s25, s31, s32, s33, s34, s35, s41, s42, s43, s44, s45, s51, s52, s53, s54, s55, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = s22 = s33 = s44 = s55 = complex(1e-7 + -0.6,0);
			s12 = s13 = s14 = s15 = s21 = s23 = s24 = s25 = s31 = s32 = s34 = s35 = s41 = s42 = s43 = s45 = s51 = s52 = s53 = s54 = complex(1e-7 + 0.4,0);
			
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s15, s21, s22, s23, s24, s25, s31, s32, s33, s34, s35, s41, s42, s43, s44, s45, s51, s52, s53, s54, s55];
		}	
		Tee5.setspars(sparsArray);
		Tee5.setglobal(global);
		return Tee5;
	}

	function seriesTee() { // series resistor nPort object
		var seriesTee = new nPort;
		var e = 1e-7;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); complex(2,0); var freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(e + 1/3,0); s12 = complex(e + 2/3,0); s13 = complex(e +-2/3,0);
			s21 = complex(e + 2/3,0); s22 = complex(e + 1/3,0); s23 = complex(e + 2/3,0);
			s31 = complex(e +-2/3,0); s32 = complex(e + 2/3,0); s33 = complex(e + 1/3,0);

			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s21, s22, s23, s31, s32, s33];
		}	
		seriesTee.setspars(sparsArray);
		seriesTee.setglobal(global);
		return seriesTee;
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
		(function () { return dim(rowCol, rowCol, complex(0,0)); })();
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

	function cascade( ... nPorts) {
		var i = 0;
		var nPortsTable = nPorts;
		for (i = 0; i < nPortsTable.length - 1; i++) {
			nPortsTable[i+1] = nPortsTable[i].cas(nPortsTable[i+1]);
		}	return nPortsTable[ nPortsTable.length-1 ];
	}

	function Open() { // one port, open
		var Open = new nPort;
		var frequencyList = global.fList; global.Ro;
		var freqCount = 0, s11, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(1,0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11];
		}	
		Open.setspars(sparsArray);
		Open.setglobal(global);
		return Open;
	}

	function Short() { //  one port, Short
		var Short = new nPort;
		var frequencyList = global.fList; global.Ro;
		var freqCount = 0, s11, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(-1,0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11];
		}	
		Short.setspars(sparsArray);
		Short.setglobal(global);
		return Short;
	}

	function Load() { // one port, load
		var Load = new nPort;
		var frequencyList = global.fList; global.Ro;
		var freqCount = 0, s11, sparsArray = [];
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			s11 = complex(0,0);
			sparsArray[freqCount] =	[frequencyList[freqCount],s11];
		}	
		Load.setspars(sparsArray);
		Load.setglobal(global);
		return Load;
	}

	function tlin(Z = 60, Length = 0.5 * 0.0254) { // Z is in ohms and Length is in meters, sparameters of a physical transmission line
		var tlin = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); complex(1,0); var two = complex(2,0), freqCount = 0, Ztlin = [], s11, s12, s21, s22, sparsArray = [];
		var Atlin = {}, Btlin = {}, Ctlin = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			Ztlin = complex(Z, 0);
		
			Atlin = Ztlin.mul(Ztlin).sub(Zo.mul(Zo));
			Btlin = Ztlin.mul(Ztlin).add(Zo.mul(Zo));
			Ctlin = two.mul(Ztlin).mul(Zo);
			
			alpha = 0;
			beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
			gamma = complex(alpha * Length, beta * Length);

			Ds = Ctlin.mul(gamma.coshCplx()).add(Btlin.mul(gamma.sinhCplx()));

			s11 = Atlin.mul(gamma.sinhCplx()).div(Ds);
			s12 = Ctlin.div(Ds);	
			s21 = s12;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	tlin.setspars(sparsArray);
		tlin.setglobal(global);	
		return tlin;
	}

	function tclin(Zoe = 100, Zoo = 30, Length = 1.47 * 0.0254) { // 1.4732 is the quarter wavelength at 2GHz, (1.3412 at 2.2 GHz)
		var ctlin = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); complex(1,0); var two = complex(2,0), freqCount = 0, Zoetclin = [], Zootclin = [];
		var s11oe, s12oe, s21oe, s22oe;
		var s11oo, s12oo, s21oo, s22oo;
		var s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44;
		var sparsArray = [];
		var Aoe = {}, Boe = {}, Coe = {}, Dsoe = {};
		var Aoo = {}, Boo = {}, Coo = {}, Dsoo = {};
		var alpha = 0, beta = 0, gamma = {};
		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			// alpha beta gamma section
			alpha = 0;
			beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
			gamma = complex(alpha * Length, beta * Length);

			// Zoe section
			Zoetclin = complex(Zoe, 0);

			Aoe = Zoetclin.mul(Zoetclin).sub(Zo.mul(Zo));
			Boe = Zoetclin.mul(Zoetclin).add(Zo.mul(Zo));
			Coe = two.mul(Zoetclin).mul(Zo);

			Dsoe = Coe.mul(gamma.coshCplx()).add(Boe.mul(gamma.sinhCplx()));

			s11oe = Aoe.mul(gamma.sinhCplx()).div(Dsoe);
			s12oe = Coe.div(Dsoe);	
			s21oe = s12oe;
			s22oe = s11oe; 
			// Zoo section
			Zootclin = complex(Zoo, 0);

			Aoo = Zootclin.mul(Zootclin).sub(Zo.mul(Zo));
			Boo = Zootclin.mul(Zootclin).add(Zo.mul(Zo));
			Coo = two.mul(Zootclin).mul(Zo);

			Dsoo = Coo.mul(gamma.coshCplx()).add(Boo.mul(gamma.sinhCplx()));

			s11oo = Aoo.mul(gamma.sinhCplx()).div(Dsoo);
			s12oo = Coo.div(Dsoo);	
			s21oo = s12oo;
			s22oo = s11oo;
	 

			// put the 4 port together per Gupta page 331
			s44 = s11 = (s11oe.add(s11oo)).mul(complex(0.5,0));
			s33 = s22 = (s22oe.add(s22oo)).mul(complex(0.5,0));
			s34 = s21 = (s21oe.add(s21oo)).mul(complex(0.5,0));
			s43 = s12 = (s12oe.add(s12oo)).mul(complex(0.5,0));
			s13 = s42 = (s12oe.sub(s12oo)).mul(complex(0.5,0));
			s31 = s24 = (s21oe.sub(s21oo)).mul(complex(0.5,0));
			s14 = s41 = (s11oe.sub(s11oo)).mul(complex(0.5,0));
			s23 = s32 = (s22oe.sub(s22oo)).mul(complex(0.5,0));

			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
		}	ctlin.setspars(sparsArray);
		ctlin.setglobal(global);	
		return ctlin;
	}

	function mlin(Width = 0.023 * 0.0254, Height = 0.025 * 0.0254, Length = 0.5 * 0.025, Thickness = 0.00 * 0.0254, er = 10, rho = 0, tand = 0.000) {
		var mlin = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); complex(1,0); var two = complex(2,0), freqCount = 0, s11, s12, s21, s22, sparsArray = [];
		var Atlin = {}, Btlin = {}, Ctlin = {}, Zmlin = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};

		var pi = Math.PI;
		var f = 12e9;
		var wOverH = Width/Height;
		var delWOverH = Thickness > 0.0 ? ( wOverH <= 1/(2*pi) ? (1.25/pi)*(Thickness/Height)*(1+Math.log(4*pi*Width/Thickness)) : (1.25/pi)*(Thickness/Height)*(1+Math.log(2*Height/Thickness)) ) : 0.0;
		var weOverH = Width/Height + delWOverH;
		var Q = ((er-1)/4.6)*(Thickness/Height)*(1/Math.sqrt(Width/Height));
		var Fwh = 1/Math.sqrt(1+10*Width/Height);
		var ere = ((er+1)/2)+((er-1)/2)*Fwh-Q;
		var Z = Width/Height <= 1.0 ? (60/Math.sqrt(ere))*Math.log(8/weOverH+0.25*weOverH) : (376.7/Math.sqrt(ere))*(1/(weOverH+1.393+0.667*Math.log(weOverH+1.444 )));

		// compute dispersive ZoT ----- INTERLUDE per Gupta page 64, I need stripline version of Zo from pages 57 and 28 with b = 2h
		var b = 2*Height, x = Thickness/b, m = 2*(1/(1 + (2/3)*(x/(1-x))));
		var delW = (x/(pi*(1-x)))*(1-0.5*Math.log( (x/(2-x))**2 + (0.0796 * x/(Width/b + 1.1*x))**m )) * (b-Thickness);
		var wPrime = Width + delW;
		var ZoT = 2 * (1/Math.sqrt(er)) * 30 * Math.log( 1 + (4/pi) * (b-Thickness)/wPrime * ( 8/pi * (b-Thickness)/wPrime + Math.sqrt( (8/pi * (b-Thickness)/wPrime)**2 + 6.27)));
		// back to microstrip now that I have ZoT
		var hMils = Height * 1000/0.0254;
		var fpGHz = 15.66 * Z/hMils; // fGHz = f/1e9;
		var G = Math.sqrt( (Z-5)/60 ) + 0.004*Z;
		var Zf = 0;
		var eref = 0;

		// compute conductor and dielectric losses
		var B = Width/Height >= 1/(2*pi) ? Height : 2*pi*Width;
		var Rs = Math.sqrt(pi*f*4*pi*1e-7*rho*1.72e-8);
		var A = 1 + 1/weOverH * ( 1 + 1/pi * Math.log(2 * B/Thickness));
		var Ac = Width/Height <= 1.0 ? 1.38*A*(Rs/(Height*Z))*(32-weOverH)**2/(32+weOverH)**2 : 6.1e-5*A*(Rs*Z*ere/Height)*(weOverH+(0.667*weOverH)/(weOverH+1.44));
		var Ad = 27.3*er/(er-1)*(ere-1)/Math.sqrt(ere)*tand/0.05;

		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {

			Zf = ZoT - (ZoT-Z)/(1+G*(  (frequencyList[freqCount]/1e9) /fpGHz)**2);
			eref = er - (er-ere)/(1+G*(  (frequencyList[freqCount]/1e9)   /fpGHz)**2);

			Zmlin = complex(Zf, 0);

			Atlin = Zmlin.mul(Zmlin).sub(Zo.mul(Zo));
			Btlin = Zmlin.mul(Zmlin).add(Zo.mul(Zo));
			Ctlin = two.mul(Zmlin).mul(Zo);

			alpha = (Ac + Ad)/8.68588;
			beta = Math.sqrt(eref)*2*Math.PI*frequencyList[freqCount]/2.997925e8;
			gamma = complex(alpha * Length, beta * Length);

			Ds = Ctlin.mul(gamma.coshCplx()).add(Btlin.mul(gamma.sinhCplx()));

			s11 = Atlin.mul(gamma.sinhCplx()).div(Ds);
			s12 = Ctlin.div(Ds);	
			s21 = s12;
			s22 = s11;
			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
		}	mlin.setspars(sparsArray);
		mlin.setglobal(global);	
		return mlin;
	}

	function mclin(Width = 10 * 0.0254, Space = 63 * 0.0254, Height = 63 * 0.0254, Thickness = 0.0012 * 0.0254, Length = 0.180 * 0.0254, er = 4, rho = 1, tand = 0.001 ) { // 1.4732 is the quarter wavelength at 2GHz, (1.3412 at 2.2 GHz)
		var ctlin = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); complex(1,0); var two = complex(2,0), freqCount = 0, Zoemclin = [], Zoomclin = [];
		var s11oe, s12oe, s21oe, s22oe;
		var s11oo, s12oo, s21oo, s22oo;
		var s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44;
		var sparsArray = [];
		var Aoe = {}, Boe = {}, Coe = {}, Dsoe = {};
		var Aoo = {}, Boo = {}, Coo = {}, Dsoo = {};
		var alpha = 0, beta = 0, gamma = {};

		// come up with Zo and eref of a microstrip line for a given Width/Height
		var pi = Math.PI;
		var delWOverH = Thickness > 0.0 ? ( Width/Height <= 1/(2*pi) ? (1.25/pi)*(Thickness/Height)*(1+Math.log(4*pi*Width/Thickness)) : (1.25/pi)*(Thickness/Height)*(1+Math.log(2*Height/Thickness)) ) : 0.0;
		var weOverH = Width/Height + delWOverH;
		var Q = ((er-1)/4.6)*(Thickness/Height)*(1/Math.sqrt(Width/Height));
		var Fwh = 1/Math.sqrt(1+10*Width/Height);
		var ere = ((er+1)/2)+((er-1)/2)*Fwh-Q;
		var ZoER = Width/Height <= 1.0 ? (60/Math.sqrt(ere))*Math.log(8/weOverH+0.25*weOverH) : (376.7/Math.sqrt(ere))*(1/(weOverH+1.393+0.667*Math.log(weOverH+1.444 )));

		// come up with even and odd mode W/H due to strip thickness
		var delThickness = Height * ( 1/er ) * (Thickness/Height)/(Space/Height);
		var delWidth = delWOverH/Height;
		var WtoeOverH = Thickness > 0.0 ? Width/Height + delWOverH*(1 - 0.5*Math.exp(-0.69*delWidth/delThickness)) : Width/Height;
		var WtooOverH = WtoeOverH + delThickness/Height;

		// come up with Zo and ere of a microstrip line for given Width/Height with er = 1, ie air.
		var ZoAIR = Width/Height <= 1.0 ? (60/Math.sqrt(1))*Math.log(8/weOverH+0.25*weOverH) : (376.7/Math.sqrt(1))*(1/(weOverH+1.393+0.667*Math.log(weOverH+1.444 )));

		// come up with even and odd mode capacitances with er = ER
		var CpoeER = 8.854187817e-12 * er * WtoeOverH;
		var CpooER = 8.854187817e-12 * er * WtooOverH;
		var CpoeAIR = 8.854187817e-12 * 1 * WtoeOverH;
		var CpooAIR = 8.854187817e-12 * 1 * WtooOverH;
		var CfoeER = 0.5 * Math.sqrt(ere)/(2.992925e8*ZoER) - CpoeER;
		var CfooER = 0.5 * Math.sqrt(ere)/(2.992925e8*ZoER) - CpooER;
		var CfoeAIR = 0.5 * Math.sqrt(1)/(2.992925e8*ZoAIR) - CpoeAIR;
		var CfooAIR = 0.5 * Math.sqrt(1)/(2.992925e8*ZoAIR) - CpooAIR;
		var Aoecaps = Math.exp( -0.1 * Math.exp(2.33 - 2.53 * WtoeOverH));
		var CfoePrimeER = CfoeER/(1 + Aoecaps * (Height/Space) * Math.tanh(10 * Space/Height )) * Math.sqrt(er/ere);
		var CfoePrimeAIR = CfoeAIR/(1 + Aoecaps * (Height/Space) * Math.tanh(10 * Space/Height )) * Math.sqrt(1/1);
		var koo = (Space/Height)/( (Space/Height) + 2 * WtooOverH);
		var kooPrime = Math.sqrt(1-koo**2);
		var CgooAIR = 8.8541817e-12 * ( koo <= 0.7 ? 1/( (1/pi) * Math.log( 2 * ( 1 + Math.sqrt(kooPrime))/( 1 - Math.sqrt(kooPrime)))) : (1/pi) * Math.log( 2 * ( 1 + Math.sqrt(koo))/( 1 - Math.sqrt(koo))) );
		var CgooER = (8.8541817e-12*er/pi) * Math.log( Math.cosh( pi*Space/(4 * Height))) + 0.65 * CfooER * ( (0.02/(Space/Height)) * Math.sqrt(er) + 1.0 - (1/er**2));
		var CoeER = CpoeER + CfoeER + CfoePrimeER;
		var CoeAIR = CpoeAIR + CfoeAIR + CfoePrimeAIR;
		var CooER = CpooER + CfooER + CgooAIR + CgooER;
		var CooAIR = CpooAIR + CfooAIR + CgooAIR + CgooER;

		// come up with even and odd mode impedances and effective dielectric constants
		var Zoe = 1/(2.992925e8 * Math.sqrt(CoeER * CoeAIR));
		var Zoo = 1/(2.992925e8 * Math.sqrt(CooER * CooAIR));
		var ereoe = CoeER/CoeAIR;
		var ereoo = CooER/CooAIR;
		console.log(Zoe);
		console.log(Zoo);
		console.log(ereoe);
		console.log(ereoo);


		for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
			// alpha beta gamma section
			alpha = 0;
			beta = 2*Math.PI*frequencyList[freqCount]/2.997925e8;
			gamma = complex(alpha * Length, beta * Length);

			// Zoe section
			Zoemclin = complex(Zoe, 0);

			Aoe = Zoemclin.mul(Zoemclin).sub(Zo.mul(Zo));
			Boe = Zoemclin.mul(Zoemclin).add(Zo.mul(Zo));
			Coe = two.mul(Zoemclin).mul(Zo);

			Dsoe = Coe.mul(gamma.coshCplx()).add(Boe.mul(gamma.sinhCplx()));

			s11oe = Aoe.mul(gamma.sinhCplx()).div(Dsoe);
			s12oe = Coe.div(Dsoe);	
			s21oe = s12oe;
			s22oe = s11oe; 
			// Zoo section
			Zoomclin = complex(Zoo, 0);

			Aoo = Zoomclin.mul(Zoomclin).sub(Zo.mul(Zo));
			Boo = Zoomclin.mul(Zoomclin).add(Zo.mul(Zo));
			Coo = two.mul(Zoomclin).mul(Zo);

			Dsoo = Coo.mul(gamma.coshCplx()).add(Boo.mul(gamma.sinhCplx()));

			s11oo = Aoo.mul(gamma.sinhCplx()).div(Dsoo);
			s12oo = Coo.div(Dsoo);	
			s21oo = s12oo;
			s22oo = s11oo;


			// put the 4 port together per Gupta page 331
			s44 = s11 = (s11oe.add(s11oo)).mul(complex(0.5,0));
			s33 = s22 = (s22oe.add(s22oo)).mul(complex(0.5,0));
			s34 = s21 = (s21oe.add(s21oo)).mul(complex(0.5,0));
			s43 = s12 = (s12oe.add(s12oo)).mul(complex(0.5,0));
			s13 = s42 = (s12oe.sub(s12oo)).mul(complex(0.5,0));
			s31 = s24 = (s21oe.sub(s21oo)).mul(complex(0.5,0));
			s14 = s41 = (s11oe.sub(s11oo)).mul(complex(0.5,0));
			s23 = s32 = (s22oe.sub(s22oo)).mul(complex(0.5,0));

			sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
		}	ctlin.setspars(sparsArray);
		ctlin.setglobal(global);	
		return ctlin;
	}

	function mtee(w1 = 0.186*0.0254, w2 = 0.334*0.0254, er = 2.55, h = 0.125*0.0254) { // series resistor nPort object
		var mtee = new nPort;
		var frequencyList = global.fList, Ro = global.Ro;
		var Zo = complex(Ro,0); Zo.inv(); complex(2,0); var freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];

		//microstrip calcs
		var eta = 120*Math.PI;
		var ere = (er+1)/2 + ( (er-1)/2 * 1/Math.sqrt(1+10*h/w1) );
		var zo  = function () {
			if (w1/h < 1) {
				return eta/((2*Math.PI)*Math.sqrt(ere)) * Math.log(8*h/w1 + 0.25*w1/h)
			}
			else {
				return eta/Math.sqrt(ere) * 1/(w1/h + 1.393 + 0.667 * Math.log(w1/h + 1.444));
			}
		}();
		var Ct = (100/Math.tanh(0.0072 * zo) + 0.64 * zo - 261)*w1*1e-12;
		
		
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
		mtee.setspars(sparsArray);
		mtee.setglobal(global);
		return Ct;
	}

	function getCircuitTitle() {
		var circuitTitle = document.getElementById('circuitTitle').innerHTML;
	document.getElementsByClassName('circuitTitle')[0].innerHTML = circuitTitle;

	}// check comment

	exports.editor = void 0;

	function callCodemirror (textAreaId) {
		var myTextarea = document.getElementById(textAreaId);
		exports.editor = CodeMirror.fromTextArea(myTextarea, {
			lineNumbers: true
		});

	}
	function removeNodes (nodeClass) {
		var removed = document.getElementsByClassName(nodeClass);
		var i = 0;
		var nodes = JSON.parse(JSON.stringify(removed.length));
		for (i; i < nodes; i++) {
			removed[0].remove();
		}}
	function doIt () {
		var headID = document.getElementsByTagName("head")[0];
		var newScript = document.createElement("script");
		newScript.setAttribute('id', 'circuit');
		newScript.type = "text/javascript";
		newScript.innerHTML = exports.editor.getValue();
		headID.appendChild(newScript);
	}
	function run() {
			removeNodes('remove');	
			setTimeout(doIt, 100);
	}
	function runButton (button) {
		document.getElementById(button).addEventListener('click', run);
	}
	function bodyWidth () {
		var width = document.getElementsByTagName('body')[0].clientWidth;
		return width;
	}

	exports.Load = Load;
	exports.Open = Open;
	exports.Short = Short;
	exports.Tee = Tee;
	exports.Tee4 = Tee4;
	exports.Tee5 = Tee5;
	exports.bodyWidth = bodyWidth;
	exports.callCodemirror = callCodemirror;
	exports.cascade = cascade;
	exports.chebyLPLCs = chebyLPLCs;
	exports.chebyLPNsec = chebyLPNsec;
	exports.chebyLPgk = chebyLPgk;
	exports.complex = complex;
	exports.dim = dim;
	exports.dup = dup;
	exports.getCircuitTitle = getCircuitTitle;
	exports.global = global;
	exports.lineChart = lineChart;
	exports.lineTable = lineTable;
	exports.log = log;
	exports.lpfGen = lpfGen;
	exports.matrix = matrix;
	exports.mclin = mclin;
	exports.mlin = mlin;
	exports.mtee = mtee;
	exports.nodal = nodal;
	exports.paC = paC;
	exports.paL = paL;
	exports.paPaLC = paPaLC;
	exports.paPaRC = paPaRC;
	exports.paPaRL = paPaRL;
	exports.paPaRLC = paPaRLC;
	exports.paR = paR;
	exports.paSeLC = paSeLC;
	exports.paSeRC = paSeRC;
	exports.paSeRL = paSeRL;
	exports.paSeRLC = paSeRLC;
	exports.run = run;
	exports.runButton = runButton;
	exports.seC = seC;
	exports.seL = seL;
	exports.sePaLC = sePaLC;
	exports.sePaRC = sePaRC;
	exports.sePaRL = sePaRL;
	exports.sePaRLC = sePaRLC;
	exports.seR = seR;
	exports.seSeLC = seSeLC;
	exports.seSeRC = seSeRC;
	exports.seSeRL = seSeRL;
	exports.seSeRLC = seSeRLC;
	exports.seriesTee = seriesTee;
	exports.tclin = tclin;
	exports.tlin = tlin;
	exports.trf = trf;
	exports.trf4Port = trf4Port;
	exports.version = version;

}));
