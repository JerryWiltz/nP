function Complex() {}

Complex.prototype = {
	constructor: Complex,
	set: function(real, imaginary) { this.x = real; this.y = imaginary; return this; },

	getR: function () {return this.x;},
	getI: function () {return this.y;},

	setR: function (R) {this.x = R; return this;},
	setI: function (I) {this.y = I; return this;},

	add: function (c2) {return complex(this.x + c2.x, this.y + c2.y);},
	sub: function (c2) {return complex(this.x - c2.x, this.y - c2.y);},
	mul: function (c2) {return complex(this.x * c2.x - this.y * c2.y, this.x * c2.y + this.y * c2.x);},
	div: function (c2) {
		var denominator = c2.x * c2.x + c2.y * c2.y;
		return complex(
			(this.x * c2.x + this.y * c2.y) / denominator,
			(c2.x * this.y - this.x * c2.y) / denominator
		);
	},
	inv: function () {
		var denominator = this.x * this.x + this.y * this.y;
		return complex(this.x / denominator, -this.y / denominator);
	},
	neg: function () {return complex(-this.x, -this.y);},
	copy: function () {return complex(this.x, this.y);},

	mag: function () {return Math.sqrt(this.x * this.x + this.y * this.y);},
	ang: function () {return Math.atan2(this.y, this.x) * (180/Math.PI);},
	mag10dB: function () {return 10 * Math.log(this.mag()) / Math.LN10;},
	mag20dB: function () {return 20 * Math.log(this.mag()) / Math.LN10;},

	sinhCplx: function () {return complex(Math.sinh(this.x) * Math.cos(this.y), Math.cosh(this.x) * Math.sin(this.y));},
	coshCplx: function () {return complex(Math.cosh(this.x) * Math.cos(this.y), Math.sinh(this.x) * Math.sin(this.y));}
};

function complex(real, imaginary) {
	var complexNumber = new Complex;
	complexNumber.set(real, imaginary);
	return complexNumber;
}

// Modified: 2026-07-14

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
			B = matrixB.m,
			C = dim(A.length, A[0].length, 0),
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


	solveGaussFB : function solveGaussFB() {
		var A = dup(this.m),
			a = 0, numRows = A.length, numCols = A[0].length, constRow = 0,
			row = 0, col = 0, accum = 0;

		for(constRow = 0; constRow < numRows; constRow++) { // FORWARD ELIMINATION - this row stays the same
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


	solveGaussFBCplx : function solveGaussFBCplx() {
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
		for(row = 0; row < numRows; row++) { // get to the right column of A
			for ( col = 0; col < numCols -1; col++) {
				A[row].shift();
			}		}		return matrix(A);
	},


	invert : function invert() {
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

	invertCplx : function invertCplx() {
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

		// add diagonal 1s to appended array, A
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
	var matrixObject = new Matrix;
	matrixObject.set(mat);
	return matrixObject;
}

// Modified: 2026-07-14
// Generates an array of Chebyshev values based on the number of sections and ripple
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

// Modified: 2026-07-14
// Generates an array of parallel capacitors and series inductors based on Chebyshev values
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

// Modified: 2026-07-14
// Computes the number of sections in a Chebyshev low-pass filter
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

class InternMap extends Map {
  constructor(entries, key = keyof) {
    super();
    Object.defineProperties(this, {_intern: {value: new Map()}, _key: {value: key}});
    if (entries != null) for (const [key, value] of entries) this.set(key, value);
  }
  get(key) {
    return super.get(intern_get(this, key));
  }
  has(key) {
    return super.has(intern_get(this, key));
  }
  set(key, value) {
    return super.set(intern_set(this, key), value);
  }
  delete(key) {
    return super.delete(intern_delete(this, key));
  }
}

function intern_get({_intern, _key}, value) {
  const key = _key(value);
  return _intern.has(key) ? _intern.get(key) : value;
}

function intern_set({_intern, _key}, value) {
  const key = _key(value);
  if (_intern.has(key)) return _intern.get(key);
  _intern.set(key, value);
  return value;
}

function intern_delete({_intern, _key}, value) {
  const key = _key(value);
  if (_intern.has(key)) {
    value = _intern.get(key);
    _intern.delete(key);
  }
  return value;
}

function keyof(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value;
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
    epsilon$2 = 1e-6;

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
          .attr("opacity", epsilon$2)
          .attr("transform", function(d) { return isFinite(d = position(d)) ? transform(d + offset) : this.getAttribute("transform"); });

      tickEnter
          .attr("opacity", epsilon$2)
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

function axisTop(scale) {
  return axis(top, scale);
}

function axisRight(scale) {
  return axis(right, scale);
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

function sourceEvent(event) {
  let sourceEvent;
  while (sourceEvent = event.sourceEvent) event = sourceEvent;
  return event;
}

function pointer(event, node) {
  event = sourceEvent(event);
  if (node === undefined) node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}

function selectAll(selector) {
  return typeof selector === "string"
      ? new Selection$1([document.querySelectorAll(selector)], [document.documentElement])
      : new Selection$1([array$1(selector)], root);
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

function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0
      + (4 - 6 * t2 + 3 * t3) * v1
      + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
      + t3 * v3) / 6;
}

function basis$1(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
        v1 = values[i],
        v2 = values[i + 1],
        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
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

function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length,
        r = new Array(n),
        g = new Array(n),
        b = new Array(n),
        i, color;
    for (i = 0; i < n; ++i) {
      color = rgb(colors[i]);
      r[i] = color.r || 0;
      g[i] = color.g || 0;
      b[i] = color.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color.opacity = 1;
    return function(t) {
      color.r = r(t);
      color.g = g(t);
      color.b = b(t);
      return color + "";
    };
  };
}

var rgbBasis = rgbSpline(basis$1);

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

const pi$8 = Math.PI,
    tau = 2 * pi$8,
    epsilon$1 = 1e-6,
    tauEpsilon = tau - epsilon$1;

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
    else if (!(l01_2 > epsilon$1));

    // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
    // Equivalently, is (x1,y1) coincident with (x2,y2)?
    // Or, is the radius zero? Line to (x1,y1).
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon$1) || !r) {
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
          l = r * Math.tan((pi$8 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
          t01 = l / l01,
          t21 = l / l21;

      // If the start tangent is not coincident with (x0,y0), line to.
      if (Math.abs(t01 - 1) > epsilon$1) {
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
    else if (Math.abs(this._x1 - x0) > epsilon$1 || Math.abs(this._y1 - y0) > epsilon$1) {
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
    else if (da > epsilon$1) {
      this._append`A${r},${r},0,${+(da >= pi$8)},${cw},${this._x1 = x + r * Math.cos(a1)},${this._y1 = y + r * Math.sin(a1)}`;
    }
  }
  rect(x, y, w, h) {
    this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}h${w = +w}v${+h}h${-w}Z`;
  }
  toString() {
    return this._;
  }
}

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

const implicit = Symbol("implicit");

function ordinal() {
  var index = new InternMap(),
      domain = [],
      range = [],
      unknown = implicit;

  function scale(d) {
    let i = index.get(d);
    if (i === undefined) {
      if (unknown !== implicit) return unknown;
      index.set(d, i = domain.push(d) - 1);
    }
    return range[i % range.length];
  }

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = new InternMap();
    for (const value of _) {
      if (index.has(value)) continue;
      index.set(value, domain.push(value) - 1);
    }
    return scale;
  };

  scale.range = function(_) {
    return arguments.length ? (range = Array.from(_), scale) : range.slice();
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function() {
    return ordinal(domain, range).unknown(unknown);
  };

  initRange.apply(scale, arguments);

  return scale;
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

function nice(domain, interval) {
  domain = domain.slice();

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }

  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
}

function transformLog(x) {
  return Math.log(x);
}

function transformExp(x) {
  return Math.exp(x);
}

function transformLogn(x) {
  return -Math.log(-x);
}

function transformExpn(x) {
  return -Math.exp(-x);
}

function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}

function powp(base) {
  return base === 10 ? pow10
      : base === Math.E ? Math.exp
      : x => Math.pow(base, x);
}

function logp(base) {
  return base === Math.E ? Math.log
      : base === 10 && Math.log10
      || base === 2 && Math.log2
      || (base = Math.log(base), x => Math.log(x) / base);
}

function reflect(f) {
  return (x, k) => -f(-x, k);
}

function loggish(transform) {
  const scale = transform(transformLog, transformExp);
  const domain = scale.domain;
  let base = 10;
  let logs;
  let pows;

  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) {
      logs = reflect(logs), pows = reflect(pows);
      transform(transformLogn, transformExpn);
    } else {
      transform(transformLog, transformExp);
    }
    return scale;
  }

  scale.base = function(_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.ticks = count => {
    const d = domain();
    let u = d[0];
    let v = d[d.length - 1];
    const r = v < u;

    if (r) ([u, v] = [v, u]);

    let i = logs(u);
    let j = logs(v);
    let k;
    let t;
    const n = count == null ? 10 : +count;
    let z = [];

    if (!(base % 1) && j - i < n) {
      i = Math.floor(i), j = Math.ceil(j);
      if (u > 0) for (; i <= j; ++i) {
        for (k = 1; k < base; ++k) {
          t = i < 0 ? k / pows(-i) : k * pows(i);
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      } else for (; i <= j; ++i) {
        for (k = base - 1; k >= 1; --k) {
          t = i > 0 ? k / pows(-i) : k * pows(i);
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      }
      if (z.length * 2 < n) z = ticks(u, v, n);
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(pows);
    }
    return r ? z.reverse() : z;
  };

  scale.tickFormat = (count, specifier) => {
    if (count == null) count = 10;
    if (specifier == null) specifier = base === 10 ? "s" : ",";
    if (typeof specifier !== "function") {
      if (!(base % 1) && (specifier = formatSpecifier(specifier)).precision == null) specifier.trim = true;
      specifier = format(specifier);
    }
    if (count === Infinity) return specifier;
    const k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
    return d => {
      let i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? specifier(d) : "";
    };
  };

  scale.nice = () => {
    return domain(nice(domain(), {
      floor: x => pows(Math.floor(logs(x))),
      ceil: x => pows(Math.ceil(logs(x)))
    }));
  };

  return scale;
}

function log$1() {
  const scale = loggish(transformer()).domain([1, 10]);
  scale.copy = () => copy(scale, log$1()).base(scale.base());
  initRange.apply(scale, arguments);
  return scale;
}

function colors(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}

var category10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

var ramp = scheme => rgbBasis(scheme[scheme.length - 1]);

var scheme = new Array(3).concat(
  "f0f0f0bdbdbd636363",
  "f7f7f7cccccc969696525252",
  "f7f7f7cccccc969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000"
).map(colors);

ramp(scheme);

function constant(x) {
  return function constant() {
    return x;
  };
}

const epsilon = 1e-12;

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

function point$1(that, x, y) {
  that._context.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x),
    that._y2 + that._k * (that._y1 - y),
    that._x2,
    that._y2
  );
}

function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

Cardinal.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x2, this._y2); break;
      case 3: point$1(this, this._x1, this._y1); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; this._x1 = x, this._y1 = y; break;
      case 2: this._point = 3; // falls through
      default: point$1(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

((function custom(tension) {

  function cardinal(context) {
    return new Cardinal(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
}))(0);

function point(that, x, y) {
  var x1 = that._x1,
      y1 = that._y1,
      x2 = that._x2,
      y2 = that._y2;

  if (that._l01_a > epsilon) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
        n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }

  if (that._l23_a > epsilon) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
        m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
  }

  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
}

function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRom.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x2, this._y2); break;
      case 3: this.point(this._x2, this._y2); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; // falls through
      default: point(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRom = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

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

// Modified: 2026-06-27

function lineChart(options = {}) {
            // ======== Options & defaults ========
            const {
                // Default inputTable
                inputTable = [[
                    ['Freq', 's21dB', 's23dB'],
                    [0, -3.52, -3.52],
                    [600000000, -3.51, -4.19],
                    [1200000000, -3.47, -5.72],
                    [1800000000, -3.42, -7.46],
                    [2400000000, -3.35, -9.21],
                    [3000000000, -3.27, -11.01],
                    [3600000000, -3.19, -13.04],
                    [4200000000, -3.12, -15.53],
                    [4800000000, -3.06, -18.99],
                    [5400000000, -3.02, -24.83],
                    [6000000000, -3.01, -53.9],
                    [6600000000, -3.02, -25.46],
                    [7200000000, -3.05, -19.3],
                    [7800000000, -3.11, -15.74],
                    [8400000000, -3.18, -13.2],
                    [9000000000, -3.26, -11.15],
                    [9600000000, -3.34, -9.34],
                    [10200000000, -3.41, -7.59],
                    [10800000000, -3.47, -5.85],
                    [11400000000, -3.5, -4.28],
                    [12000000000, -3.52, -3.52]
                ]],

	                // Where to append the container. Defaults to <body>.
	                mount = 'body',
	                containerId,
	                svgId,

                // Default Settings
                title = '',
                chartTitle,
                xAxisTitle = 'Frequency',
                yAxisTitle = 'dB',
                xScale = 'linear',
                yScale = 'linear',
                xAxisPosition = 'bottom',
                yAxisPosition = 'left',
                metricPrefix = 'giga',
                showPoints = true,
                showLabels = true,
                showGrid = true,
                gridColor = '#e0e0e0',
                traceColor = true, // true for color, false for gray
                traceWidth = 2,
                pointRadius = 3,
                labelFontSize = 11,
                labelColor,
                width = 700,
                height = 450,
                margin = { top: 35, right: 80, bottom: 55, left: 75 },
                plotBorderColor = 'black',
                plotBorderWidth = 1,

                // Raw ranges (may be undefined, handled later)
                xRange: rawXRange,
                yRange: rawYRange,

                // Default Font Size
                fontFamily = 'sans-serif',
                fontSize = 14,
                containerFontSizePx,

                // Default background
                backgroundColor,
                pngBackground = 'transparent'

            } = options;

            // Starting font sizes since d3.axisBottom and d3.axisLeft will override the container styles
            const effectiveTitle = chartTitle ?? title;
            const effectiveFontSize = containerFontSizePx ?? fontSize;
            const effectiveBackgroundColor = backgroundColor ?? pngBackground;
            const axisFontPx = effectiveFontSize;
            let txtLabels = selectAll([]);

            // Metric Scale
            const pickScale = {
                tera: 1e12, giga: 1e9, mega: 1e6, kilo: 1e3,
                none: 1, one: 1, deci: 1e-1, centi: 1e-2,
                milli: 1e-3, micro: 1e-6, nano: 1e-9, pico: 1e-12
            }[metricPrefix] || 1e9;

            // Format Data
            const formattedData = inputTable.map(table => {
                const headers = table[0];
                return headers.slice(1).map(yName => ({
                    yName,
                    yValues: table.slice(1).map(row => ({
                        xValue: row[0] / pickScale,
                        yValue: row[headers.indexOf(yName)]
                    }))
                }));
            }).flat();

            // Extract values
            const xValues = formattedData.flatMap(d => d.yValues.map(v => v.xValue));
            const yValues = formattedData.flatMap(d => d.yValues.map(v => v.yValue));

            const xRange = rawXRange
                ? rawXRange.map(v => v / pickScale)
                : extent(xValues);

            const yRange = rawYRange || extent(yValues);

            // Dimensions
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            function makeScale(scaleType, domain, range, axisName) {
                const effectiveScaleType = String(scaleType).toLowerCase();

                if (effectiveScaleType === 'log') {
                    if (domain[0] <= 0 || domain[1] <= 0) {
                        throw new Error(`${axisName}Scale: log scale requires a positive domain.`);
                    }
                    return log$1().domain(domain).nice().range(range);
                }

                return linear().domain(domain).nice().range(range);
            }

            // Scales
            const x = makeScale(xScale, xRange, [0, innerWidth], 'x');
            const y = makeScale(yScale, yRange, [innerHeight, 0], 'y');

            const xDomain = x.domain();
            const yDomain = y.domain();

            function domainIncludesZero(domain) {
                return domain[0] <= 0 && domain[1] >= 0;
            }

            const effectiveXAxisPosition = String(xAxisPosition).toLowerCase();
            const effectiveYAxisPosition = String(yAxisPosition).toLowerCase();

            const xAxisY = effectiveXAxisPosition === 'top'
                ? 0
                : effectiveXAxisPosition === 'origin' && domainIncludesZero(yDomain)
                    ? y(0)
                    : innerHeight;

            const yAxisX = effectiveYAxisPosition === 'right'
                ? innerWidth
                : effectiveYAxisPosition === 'origin' && domainIncludesZero(xDomain)
                    ? x(0)
                    : 0;

            const xAxisGenerator = effectiveXAxisPosition === 'top'
                ? axisTop(x).ticks(10)
                : axisBottom(x).ticks(10);

            const yAxisGenerator = effectiveYAxisPosition === 'right'
                ? axisRight(y).ticks(10)
                : axisLeft(y).ticks(10);


            // color or gray plots
            const n = Math.max(3, Math.min(9, formattedData.length));

            const color = traceColor
                ? ordinal(category10)
                : ordinal(scheme[n]);

            // Container DIV (position relative for button)
            const container = select(mount)
                .append('div')
                .style('position', 'relative')
                .style('display', 'inline-block')
                .style('padding', '5px')
	                .style('font-family', fontFamily)
	                .style('font-size', `${effectiveFontSize}px`)
	                .attr('id', containerId || null)
	                .attr('class', 'containerClass');

            // Add SVG
            const svg = container.append('svg')
	                .attr('width', width)
	                .attr('height', height)
	                .attr('id', svgId || null)
	                .attr('class', 'svgContainerClass');

            // SVG background so on-screen matches PNG
            const chartBackground = svg.insert('rect', ':first-child')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', width)
                .attr('height', height)
                .attr('fill', effectiveBackgroundColor === 'transparent' ? 'none' : effectiveBackgroundColor)
                .attr('class', 'svgRectClass');

            // Ensure container is positioned correctly
            container.style('position', 'relative');

            // Button
            const button = container.append('button')
                .attr('aria-label', 'Copy')
                .style('position', 'absolute')
                .style('top', '5px')
                .style('right', '100px')
                .style('background', 'none')
                .style('border', 'none')
                .style('padding', '4px 8px')
                .style('cursor', 'pointer')
                .style('display', 'inline-flex')
                .style('align-items', 'center')
                .style('gap', '4px')
                .style('border-radius', '6px')
                .on('mouseover', function () { select(this).style('background', '#ccf2ff'); })  //#ccf2ff
                .on('mouseout', function () { select(this).style('background', 'none'); })
                .on('mousedown', function () { select(this).style('background', '#00ace6'); }) //#00ace6
                .on('mouseup', function () { select(this).style('background', '#ccf2ff'); });

            // Button icon + text
            button.html(`
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667C1.83496 9.978 1.83432 9.42091 1.87109 8.9707C1.90851 8.5127 1.98772 8.10625 2.17969 7.72949L2.30176 7.51172C2.60586 7.0159 3.04236 6.6122 3.56348 6.34668L3.70606 6.28027C4.04237 6.136 4.40303 6.07083 4.80371 6.03809C5.14051 6.01057 5.53708 6.00551 6.00391 6.00391C6.00551 5.53708 6.01057 5.14051 6.03809 4.80371C6.0755 4.34588 6.15483 3.94012 6.34668 3.56348L6.46875 3.34473C6.77282 2.84912 7.20856 2.44514 7.72949 2.17969L7.87207 2.11328C8.20855 1.96886 8.56979 1.90385 8.9707 1.87109C9.42091 1.83432 9.978 1.83496 10.667 1.83496H13.5C14.1891 1.83496 14.746 1.83431 15.1963 1.87109C15.6541 1.90851 16.0599 1.98788 16.4365 2.17969L16.6553 2.30176C17.151 2.60585 17.5548 3.04244 17.8203 3.56348L17.8867 3.70606C18.031 4.04235 18.0962 4.40306 18.1289 4.80371C18.1657 5.25395 18.165 5.81091 18.165 6.5V9.33301Z">
        </path>
      </svg>Copy as png
    `);

            // New button function fire
            button.on('click', copyPNG);

            // --- One function to copy the current SVG as PNG to clipboard ---
            function copyPNG() {
                const containerDiv = container.node();
                const svgElement = containerDiv.querySelector('svg');

                const serializer = new XMLSerializer();
                const svgString = serializer.serializeToString(svgElement);

                const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(svgBlob);

                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement("canvas");
                    // Use rendered size
                    canvas.width = svgElement.clientWidth || +svgElement.getAttribute('width') || 800;
                    canvas.height = svgElement.clientHeight || +svgElement.getAttribute('height') || 600;

                    const ctx = canvas.getContext("2d");

                    // ------ NEW: optional background fill (defaults to transparent) ------
                    if (effectiveBackgroundColor && effectiveBackgroundColor !== 'transparent') {
                        ctx.save();
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillStyle = effectiveBackgroundColor;    // e.g., 'white', '#fff', 'rgba(0,0,0,0.5)'
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.restore();
                    }
                    // --------------------------------------------------------------------

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    URL.revokeObjectURL(url);

                    canvas.toBlob(async (blob) => {
                        try {
                            await navigator.clipboard.write([
                                new ClipboardItem({ "image/png": blob })
                            ]);
                            //console.log("Image copied to clipboard!");
                        } catch (err) {
                            //console.error("Failed to copy image:", err);
                        }
                    }, "image/png");
                };
                img.onerror = (e) => {
                    URL.revokeObjectURL(url);
                    console.error("Failed to load serialized SVG into Image", e);
                };
                img.src = url;
            }

            // Chart Title
            const txtChartTitle = svg.append('text')
                .attr('x', 10)
                .attr('y', 15)
                .style('visibility', effectiveTitle ? 'visible' : 'hidden')
                .text(effectiveTitle);

            // Chart group
            const g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`)
                .attr('class', 'svgPlotAreaClass');

            const xGridGroup = g.append('g')
                .attr('transform', `translate(0,${innerHeight})`)
                .attr('class', 'xGrid')
                .style('visibility', showGrid ? 'visible' : 'hidden')
                .call(axisBottom(x).ticks(10).tickSize(-innerHeight).tickFormat(''));

            xGridGroup.selectAll('path')
                .attr('stroke', 'none');

            xGridGroup.selectAll('line')
                .attr('class', 'xGridLine')
                .attr('stroke', gridColor)
                .attr('stroke-width', 1);

            const yGridGroup = g.append('g')
                .attr('class', 'yGrid')
                .style('visibility', showGrid ? 'visible' : 'hidden')
                .call(axisLeft(y).ticks(10).tickSize(-innerWidth).tickFormat(''));

            yGridGroup.selectAll('path')
                .attr('stroke', 'none');

            yGridGroup.selectAll('line')
                .attr('class', 'yGridLine')
                .attr('stroke', gridColor)
                .attr('stroke-width', 1);

            // Plot border
            const plotBorder = g.append('rect')
                .attr('width', innerWidth)
                .attr('height', innerHeight)
                .attr('fill', 'none')
                .attr('stroke', plotBorderColor)
                .attr('stroke-width', plotBorderWidth);

            const xAxisGroup = g.append('g')
                .attr('transform', `translate(0,${xAxisY})`)
                .attr('class', 'xAxis')
                .call(xAxisGenerator);

            xAxisGroup.selectAll('text')
                .attr('class', 'txtXAxisNumbers')
                .style('font-size', `${axisFontPx}px`);

            xAxisGroup.selectAll('path,line')
                .attr('class', 'xAxisLine');

            const yAxisGroup = g.append('g')
                .attr('transform', `translate(${yAxisX},0)`)
                .attr('class', 'yAxis')
                .call(yAxisGenerator);

            yAxisGroup.selectAll('text')
                .attr('class', 'txtYAxisNumbers')
                .style('font-size', `${axisFontPx}px`);

            yAxisGroup.selectAll('path,line')
                .attr('class', 'yAxisLine');

            const txtXAxisTitle = svg.append('text')
                .attr('x', margin.left + innerWidth / 2)
                .attr('y', height - 10)
                .attr('text-anchor', 'middle')
                .attr('class', 'txtXAxisTitle')
                .style('font-size', `${axisFontPx}px`)
                .text(xAxisTitle);

            const txtYAxisTitle = svg.append('text')
                .attr('x', -(margin.top + innerHeight / 2))
                .attr('y', 15)
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90)')
                .attr('class', 'txtYAxisTitle')
                .style('font-size', `${axisFontPx}px`)
                .text(yAxisTitle);

            // Line generator
            const line$1 = line()
                .x(d => x(d.xValue))
                .y(d => y(d.yValue));

            // Draw Lines & Points
            const groups = g.selectAll('.lineGroup')
                .data(formattedData)
                .join('g')
                .attr('class', 'lineGroup');

            // Lines
            groups.append('path')
                .attr('d', d => line$1(d.yValues))
                .attr('fill', 'none')
                .attr('stroke', d => color(d.yName))
                .attr('stroke-width', traceWidth);

            // Points
            if (showPoints) {
                let tooltip; // shared between handlers

                groups.selectAll('circle')
                    .data(d => d.yValues)
                    .join('circle')
                    .attr('cx', d => x(d.xValue))
                    .attr('cy', d => y(d.yValue))
                    .attr('r', pointRadius)
                    .attr('fill', function (d, i, nodes) {
                        const groupData = select(nodes[i].parentNode).datum();
                        return color(groupData.yName);
                    })
                    .on('mouseenter', (event, d) => {
                        // ensure only one tooltip
                        container.select('.tooltip').remove();

                        const [px, py] = pointer(event, container.node());
                        tooltip = container.append('div')
                            .attr('class', 'tooltip')
                            .style('position', 'absolute')
                            .style('background', 'white')
                            .style('border', '1px solid #aaa')
                            .style('padding', '3px 6px')
                            .style('white-space', 'nowrap')
                            .style('pointer-events', 'none')
                            .style('z-index', 10)
                            .style('left', `${px + 10}px`)
                            .style('top', `${py - 20}px`)
                            .html(`${xAxisTitle}: ${d.xValue.toPrecision(3)}<br>${yAxisTitle}: ${d.yValue.toPrecision(3)}`);
                    })
                    .on('mousemove', (event) => {
                        if (!tooltip) return;
                        const [px, py] = pointer(event, container.node());
                        tooltip.style('left', `${px + 10}px`).style('top', `${py - 20}px`);
                    })
                    .on('mouseleave', () => {
                        if (tooltip) { tooltip.remove(); tooltip = null; }
                    });
            }

            // Labels
            if (showLabels) {
                txtLabels = groups.append('text')
                    .attr('x', d => {
                        const last = d.yValues[d.yValues.length - 1];
                        return x(last.xValue) + 6;
                    })
                    .attr('y', d => {
                        const last = d.yValues[d.yValues.length - 1];
                        return y(last.yValue);
                    })
                    .attr('dy', '0.35em')
                    .attr('class', 'txtLabel')
                    .style('font-size', `${labelFontSize}px`)
                    .style('fill', labelColor || null)
                    .text(d => d.yName);
            }

            // Returned API methods
            function cssPropertyToJsName(propertyName) {
                return propertyName.replace(/-([a-z])/g, function (_, letter) {
                    return letter.toUpperCase();
                });
            }

            function applyStyleToElement(element, style) {
                if (!element) return;

                if (typeof style === "string") {
                    const currentStyle = element.getAttribute("style") || "";
                    element.setAttribute("style", currentStyle ? currentStyle + ";" + style : style);
                } else if (typeof style === "object" && style !== null) {
                    for (const [key, value] of Object.entries(style)) {
                        element.style[cssPropertyToJsName(key)] = value;
                    }
                }
            }

            function applyStyleToSelection(selection, style) {
                selection.each(function () {
                    applyStyleToElement(this, style);
                });
            }

            // Chart Title
            function setTxtChartTitleStyle(style) {
                applyStyleToElement(txtChartTitle.node(), style);
            }

            function setChartBackgroundStyle(style) {
                applyStyleToElement(chartBackground.node(), style);
            }

            function setPlotBorderStyle(style) {
                applyStyleToElement(plotBorder.node(), style);
            }

            // X-Axis
            function setTxtXAxisTitleStyle(style) {
                applyStyleToElement(txtXAxisTitle.node(), style);
            }

            function setTxtXAxisNumbersStyle(style) {
                applyStyleToSelection(xAxisGroup.selectAll('text'), style);
            }

            function setXAxisLineStyle(style) {
                applyStyleToSelection(xAxisGroup.selectAll('path,line'), style);
            }

            function setXGridLineStyle(style) {
                applyStyleToSelection(xGridGroup.selectAll('line'), style);
            }

            // Y-Axis
            function setTxtYAxisTitleStyle(style) {
                applyStyleToElement(txtYAxisTitle.node(), style);
            }

            function setTxtYAxisNumbersStyle(style) {
                applyStyleToSelection(yAxisGroup.selectAll('text'), style);
            }

            function setYAxisLineStyle(style) {
                applyStyleToSelection(yAxisGroup.selectAll('path,line'), style);
            }

            function setYGridLineStyle(style) {
                applyStyleToSelection(yGridGroup.selectAll('line'), style);
            }

            // Labels
            function setTxtChartLabelsStyle(style) {
                applyStyleToSelection(txtLabels, style);
            }

            // Returning an API to the user
            // There are exposed elements for super users
            // There are exposed setter methods to change the style
            // ---> You can pass an object to a setter: { fill: "red", fontStyle: "italic" }
            // ---> Or you can pass a string to a setter: "fill:red; font-style:italic;"
            // Either will work

            return {
                // return elements
                container: container.node(),
                svg: svg.node(),
                chartBackground: chartBackground.node(),
                plotBorder: plotBorder.node(),
                txtChartTitle: txtChartTitle.node(),
                txtXAxisTitle: txtXAxisTitle.node(),
                txtYAxisTitle: txtYAxisTitle.node(),
                txtChartLabels: txtLabels.nodes(),
                xAxisGroup: xAxisGroup.node(),
                yAxisGroup: yAxisGroup.node(),
                xGridGroup: xGridGroup.node(),
                yGridGroup: yGridGroup.node(),

                // return setters
                setTxtChartTitleStyle: setTxtChartTitleStyle,
                setChartBackgroundStyle: setChartBackgroundStyle,
                setPlotBorderStyle: setPlotBorderStyle,

                setTxtXAxisTitleStyle: setTxtXAxisTitleStyle,
                setTxtXAxisNumbersStyle: setTxtXAxisNumbersStyle,
                setXAxisLineStyle: setXAxisLineStyle,
                setXGridLineStyle: setXGridLineStyle,

                setTxtYAxisTitleStyle: setTxtYAxisTitleStyle,
                setTxtYAxisNumbersStyle: setTxtYAxisNumbersStyle,
                setYAxisLineStyle: setYAxisLineStyle,
                setYGridLineStyle: setYGridLineStyle,

                setTxtChartLabelsStyle: setTxtChartLabelsStyle
            }

        }

// Modified: 2026-06-27

function smithChart(options = {}) {
	// ======== Options & defaults ========
	const {
		inputTable = [[
			['Freq', 's11Re', 's11Im'],
			[100000000, -0.5, 0.2],
			[200000000, -0.35, 0.35],
			[300000000, -0.1, 0.45],
			[400000000, 0.15, 0.35],
			[500000000, 0.35, 0.1],
			[600000000, 0.45, -0.15]
		]],
		mount = 'body',
		containerId,
		svgId,
		title = '',
		chartTitle,
		metricPrefix = 'giga',
		showPoints = true,
		showLabels = true,
		showGrid = true,
		gridColor = '#b8b8b8',
		traceColor = true,
		traceWidth = 2,
		pointRadius = 3,
		labelFontSize = 11,
		labelColor,
		width = 600,
		height = 600,
		margin = { top: 40, right: 40, bottom: 40, left: 40 },
		unitCircleColor = 'black',
		unitCircleWidth = 1.5,
		fontFamily = 'sans-serif',
		fontSize = 14,
		containerFontSizePx,
		backgroundColor,
		pngBackground = 'transparent'
	} = options;

	const effectiveTitle = chartTitle ?? title;
	const effectiveFontSize = containerFontSizePx ?? fontSize;
	const effectiveBackgroundColor = backgroundColor ?? pngBackground;
	let txtLabels = selectAll([]);

	const pickScale = {
		tera: 1e12, giga: 1e9, mega: 1e6, kilo: 1e3,
		none: 1, one: 1, deci: 1e-1, centi: 1e-2,
		milli: 1e-3, micro: 1e-6, nano: 1e-9, pico: 1e-12
	}[metricPrefix] || 1e9;

	function stripComplexSuffix(header) {
		return String(header).replace(/(?:Re|Im)$/i, '');
	}

	function formatData(tables) {
		return tables.flatMap(table => {
			const headers = table[0];
			const traces = [];

			for (let i = 1; i < headers.length; i += 2) {
				const reHeader = headers[i];
				const imHeader = headers[i + 1];
				if (!imHeader) continue;

				const traceName = stripComplexSuffix(reHeader);
				traces.push({
					traceName,
					values: table.slice(1).map(row => ({
						frequency: row[0] / pickScale,
						re: row[i],
						im: row[i + 1]
					})).filter(point =>
						Number.isFinite(point.re) && Number.isFinite(point.im)
					)
				});
			}

			return traces;
		});
	}

	const formattedData = formatData(inputTable);
	const n = Math.max(3, Math.min(9, formattedData.length));
	const color = traceColor
		? ordinal(category10)
		: ordinal(scheme[n]);

	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	const plotSize = Math.min(innerWidth, innerHeight);
	const plotLeft = margin.left + (innerWidth - plotSize) / 2;
	const plotTop = margin.top + (innerHeight - plotSize) / 2;
	const center = plotSize / 2;
	const radius = plotSize / 2;

	function gammaToPoint(gamma) {
		return [
			center + gamma.re * radius,
			center - gamma.im * radius
		];
	}

	const line$1 = line()
		.x(d => gammaToPoint(d)[0])
		.y(d => gammaToPoint(d)[1])
		.curve(catmullRom.alpha(0.5));

	const container = select(mount)
		.append('div')
		.style('position', 'relative')
		.style('display', 'inline-block')
		.style('padding', '5px')
		.style('font-family', fontFamily)
		.style('font-size', `${effectiveFontSize}px`)
		.attr('id', containerId || null)
		.attr('class', 'smith-chart-container');

	const svg = container.append('svg')
		.attr('width', width)
		.attr('height', height)
		.attr('id', svgId || null)
		.attr('class', 'smith-chart-svg');

	const chartBackground = svg.insert('rect', ':first-child')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', width)
		.attr('height', height)
		.attr('fill', effectiveBackgroundColor === 'transparent' ? 'none' : effectiveBackgroundColor)
		.attr('class', 'smith-chart-background');

	container.style('position', 'relative');

	const button = container.append('button')
		.attr('aria-label', 'Copy')
		.style('position', 'absolute')
		.style('top', '5px')
		.style('right', '100px')
		.style('background', 'none')
		.style('border', 'none')
		.style('padding', '4px 8px')
		.style('cursor', 'pointer')
		.style('display', 'inline-flex')
		.style('align-items', 'center')
		.style('gap', '4px')
		.style('border-radius', '6px')
		.on('mouseover', function () { select(this).style('background', '#ccf2ff'); })
		.on('mouseout', function () { select(this).style('background', 'none'); })
		.on('mousedown', function () { select(this).style('background', '#00ace6'); })
		.on('mouseup', function () { select(this).style('background', '#ccf2ff'); });

	button.html(`
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667C1.83496 9.978 1.83432 9.42091 1.87109 8.9707C1.90851 8.5127 1.98772 8.10625 2.17969 7.72949L2.30176 7.51172C2.60586 7.0159 3.04236 6.6122 3.56348 6.34668L3.70606 6.28027C4.04237 6.136 4.40303 6.07083 4.80371 6.03809C5.14051 6.01057 5.53708 6.00551 6.00391 6.00391C6.00551 5.53708 6.01057 5.14051 6.03809 4.80371C6.0755 4.34588 6.15483 3.94012 6.34668 3.56348L6.46875 3.34473C6.77282 2.84912 7.20856 2.44514 7.72949 2.17969L7.87207 2.11328C8.20855 1.96886 8.56979 1.90385 8.9707 1.87109C9.42091 1.83432 9.978 1.83496 10.667 1.83496H13.5C14.1891 1.83496 14.746 1.83431 15.1963 1.87109C15.6541 1.90851 16.0599 1.98788 16.4365 2.17969L16.6553 2.30176C17.151 2.60585 17.5548 3.04244 17.8203 3.56348L17.8867 3.70606C18.031 4.04235 18.0962 4.40306 18.1289 4.80371C18.1657 5.25395 18.165 5.81091 18.165 6.5V9.33301Z">
        </path>
      </svg>Copy as png
    `);

	// New button function fire
	button.on('click', copyPNG);

	function copyPNG() {
		const containerDiv = container.node();
		const svgElement = containerDiv.querySelector('svg');

		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svgElement);

		const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(svgBlob);

		const img = new Image();
		img.onload = async () => {
			const canvas = document.createElement('canvas');
			// Use rendered size
			canvas.width = svgElement.clientWidth || +svgElement.getAttribute('width') || 800;
			canvas.height = svgElement.clientHeight || +svgElement.getAttribute('height') || 600;

			const ctx = canvas.getContext('2d');

			// ------ NEW: optional background fill (defaults to transparent) ------
			if (effectiveBackgroundColor && effectiveBackgroundColor !== 'transparent') {
				ctx.save();
				ctx.globalCompositeOperation = 'source-over';
				ctx.fillStyle = effectiveBackgroundColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.restore();
			}
			// --------------------------------------------------------------------

			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			URL.revokeObjectURL(url);

			canvas.toBlob(async (blob) => {
				try {
					await navigator.clipboard.write([
						new ClipboardItem({ 'image/png': blob })
					]);
					//console.log("Image copied to clipboard!");
				} catch (err) {
					//console.error("Failed to copy image:", err);
				}
			}, 'image/png');
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			console.error("Failed to load serialized SVG into Image", e);
		};
		img.src = url;
	}

	const txtChartTitle = svg.append('text')
		.attr('x', 10)
		.attr('y', 18)
		.style('visibility', effectiveTitle ? 'visible' : 'hidden')
		.text(effectiveTitle);

	const g = svg.append('g')
		.attr('transform', `translate(${plotLeft},${plotTop})`)
		.attr('class', 'smith-chart-plot-area');

	const clipId = `smith-clip-${Math.random().toString(36).slice(2)}`;
	svg.append('defs')
		.append('clipPath')
		.attr('id', clipId)
		.append('circle')
		.attr('cx', center)
		.attr('cy', center)
		.attr('r', radius);

	const smithGridGroup = g.append('g')
		.attr('class', 'smith-grid')
		.style('visibility', showGrid ? 'visible' : 'hidden')
		.attr('clip-path', `url(#${clipId})`);

	smithGridGroup.append('line')
		.attr('x1', 0)
		.attr('y1', center)
		.attr('x2', plotSize)
		.attr('y2', center)
		.attr('stroke', gridColor)
		.attr('stroke-width', 1);

	[0.2, 0.5, 1, 2, 5].forEach(r => {
		smithGridGroup.append('circle')
			.attr('cx', center + (r / (r + 1)) * radius)
			.attr('cy', center)
			.attr('r', (1 / (r + 1)) * radius)
			.attr('fill', 'none')
			.attr('stroke', gridColor)
			.attr('stroke-width', 1);
	});

	[0.2, 0.5, 1, 2, 5].forEach(x => {
		[x, -x].forEach(value => {
			smithGridGroup.append('circle')
				.attr('cx', center + radius)
				.attr('cy', center - (1 / value) * radius)
				.attr('r', Math.abs((1 / value) * radius))
				.attr('fill', 'none')
				.attr('stroke', gridColor)
				.attr('stroke-width', 1);
		});
	});

	const unitCircle = g.append('circle')
		.attr('cx', center)
		.attr('cy', center)
		.attr('r', radius)
		.attr('fill', 'none')
		.attr('stroke', unitCircleColor)
		.attr('stroke-width', unitCircleWidth)
		.attr('class', 'smith-unit-circle');

	const traceGroup = g.append('g')
		.attr('class', 'smith-traces')
		.attr('clip-path', `url(#${clipId})`);

	const labelGroup = g.append('g')
		.attr('class', 'smith-labels');

	const groups = traceGroup.selectAll('.smith-trace-group')
		.data(formattedData)
		.join('g')
		.attr('class', 'smith-trace-group');

	groups.append('path')
		.attr('d', d => line$1(d.values))
		.attr('fill', 'none')
		.attr('stroke', d => color(d.traceName))
		.attr('stroke-width', traceWidth);

	if (showPoints) {
		let tooltip;

		groups.selectAll('circle')
			.data(d => d.values.map(point => ({ ...point, traceName: d.traceName })))
			.join('circle')
			.attr('cx', d => gammaToPoint(d)[0])
			.attr('cy', d => gammaToPoint(d)[1])
			.attr('r', pointRadius)
			.attr('fill', d => color(d.traceName))
			.on('mouseenter', (event, d) => {
				container.select('.tooltip').remove();

				const [px, py] = pointer(event, container.node());
				tooltip = container.append('div')
					.attr('class', 'tooltip')
					.style('position', 'absolute')
					.style('background', 'white')
					.style('border', '1px solid #aaa')
					.style('padding', '3px 6px')
					.style('white-space', 'nowrap')
					.style('pointer-events', 'none')
					.style('z-index', 10)
					.style('left', `${px + 10}px`)
					.style('top', `${py - 20}px`)
					.html(`${d.traceName}<br>Freq: ${d.frequency.toPrecision(3)}<br>Re: ${d.re.toPrecision(3)}<br>Im: ${d.im.toPrecision(3)}<br>Mag: ${Math.hypot(d.re, d.im).toPrecision(3)}<br>Ang: ${(Math.atan2(d.im, d.re) * 180 / Math.PI).toPrecision(3)} deg`);
			})
			.on('mousemove', (event) => {
				if (!tooltip) return;
				const [px, py] = pointer(event, container.node());
				tooltip.style('left', `${px + 10}px`).style('top', `${py - 20}px`);
			})
			.on('mouseleave', () => {
				if (tooltip) { tooltip.remove(); tooltip = null; }
			});
	}

	if (showLabels) {
		txtLabels = labelGroup.selectAll('.txtLabel')
			.data(formattedData)
			.join('text')
			.attr('x', d => {
				const last = d.values[d.values.length - 1];
				return gammaToPoint(last)[0] + 6;
			})
			.attr('y', d => {
				const last = d.values[d.values.length - 1];
				return gammaToPoint(last)[1];
			})
			.attr('dy', '0.35em')
			.attr('class', 'txtLabel')
			.style('font-size', `${labelFontSize}px`)
			.style('fill', labelColor || null)
			.text(d => d.traceName);
	}

	function cssPropertyToJsName(propertyName) {
		return propertyName.replace(/-([a-z])/g, function (_, letter) {
			return letter.toUpperCase();
		});
	}

	function applyStyleToElement(element, style) {
		if (!element) return;

		if (typeof style === 'string') {
			const currentStyle = element.getAttribute('style') || '';
			element.setAttribute('style', currentStyle ? currentStyle + ';' + style : style);
		} else if (typeof style === 'object' && style !== null) {
			for (const [key, value] of Object.entries(style)) {
				element.style[cssPropertyToJsName(key)] = value;
			}
		}
	}

	function applyStyleToSelection(selection, style) {
		selection.each(function () {
			applyStyleToElement(this, style);
		});
	}

	function setTxtChartTitleStyle(style) {
		applyStyleToElement(txtChartTitle.node(), style);
	}

	function setChartBackgroundStyle(style) {
		applyStyleToElement(chartBackground.node(), style);
	}

	function setUnitCircleStyle(style) {
		applyStyleToElement(unitCircle.node(), style);
	}

	function setSmithGridStyle(style) {
		applyStyleToSelection(smithGridGroup.selectAll('circle,line'), style);
	}

	function setTxtChartLabelsStyle(style) {
		applyStyleToSelection(txtLabels, style);
	}

	return {
		// return elements
		container: container.node(),
		svg: svg.node(),
		chartBackground: chartBackground.node(),
		txtChartTitle: txtChartTitle.node(),
		unitCircle: unitCircle.node(),
		smithGridGroup: smithGridGroup.node(),
		traceGroup: traceGroup.node(),
		labelGroup: labelGroup.node(),
		txtChartLabels: txtLabels.nodes(),

		// return setters
		setTxtChartTitleStyle: setTxtChartTitleStyle,
		setChartBackgroundStyle: setChartBackgroundStyle,
		setUnitCircleStyle: setUnitCircleStyle,
		setSmithGridStyle: setSmithGridStyle,
		setTxtChartLabelsStyle: setTxtChartLabelsStyle
	};
}

// Modified: 2026-07-13
const version = '0.0.47';

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

// Modified: 2026-06-27

function lineTable(options = {}) {
		// ======== Options & defaults ========
		const {
			// data: array of tables; each table is a 2D array; row 0 is header strings
			inputTable = [[
				['Freq', 's21dB', 's23dB'],
				[0, -3.52182, -3.52182],
				[600000000, -3.51008, -4.19455],
				[1200000000, -3.47582, -5.72534],
				[1800000000, -3.42189, -7.46851],
				[2400000000, -3.35291, -9.21548],
				[3000000000, -3.27504, -11.01964],
				[3600000000, -3.19561, -13.04088],
				[4200000000, -3.12248, -15.53461],
				[4800000000, -3.06328, -18.99038],
				[5400000000, -3.02443, -24.83689],
				[6000000000, -3.01031, -53.90094],
				[6600000000, -3.02253, -25.46905],
				[7200000000, -3.05969, -19.30541],
				[7800000000, -3.11761, -15.74536],
				[8400000000, -3.18997, -13.20271],
				[9000000000, -3.26921, -11.15721],
				[9600000000, -3.34745, -9.34356],
				[10200000000, -3.41731, -7.596],
				[10800000000, -3.47251, -5.85015],
				[11400000000, -3.50832, -4.28704],
				[12000000000, -3.52176, -3.52571]
			]],
			// Where to append the container. Defaults to <body>.
			mount = 'body',
			// Optional explicit IDs
			containerId,
			svgId,
			// Visuals / behavior
			metricPrefix = 'giga',
			title = '',
			tableTitle,
			headColor = 'color', // 'color' (blue) | 'gray'
			headerColor,
			headerFill,
			cellFill = 'white',
			cellBorderColor = 'black',
			cellBorderWidth = 1,
			tableBorderColor = 'none',
			tableBorderWidth = 1,
			showWHAlert = false, // true => alert width/height
			// Sizing
			columnWidth = 100,
			rowHeight = 20,
			margin = { left: 20, top: 36, right: 20, bottom: 20 },
			fontFamily = 'sans-serif',
			fontSize = 14,
			containerFontSizePx,
			backgroundColor,
			pngBackground = 'white'
		} = options;

		const effectiveTitle = tableTitle ?? title;
		const effectiveFontSize = containerFontSizePx ?? fontSize;
		const effectiveBackgroundColor = backgroundColor ?? pngBackground;
		const effectiveHeaderColor = headerColor ?? headColor;

		// ======== Helpers ========
		const pickScale = (p) => ({
			tera: 1e12, giga: 1e9, mega: 1e6, kilo: 1e3,
			none: 1, one: 1, deci: 1e-1, centi: 1e-2,
			milli: 1e-3, micro: 1e-6,
			nano: 1e-9, pico: 1e-12
		}[String(p).toLowerCase()] ?? 1e9);

		const metricPrefixLabel = (p) => ({
			tera: 'tera', giga: 'giga', mega: 'mega', kilo: 'kilo',
			deci: 'deci', centi: 'centi', milli: 'milli',
			micro: 'micro', nano: 'nano', pico: 'pico'
		}[String(p).toLowerCase()] ?? 'giga');

		// Copy tables and rows before scaling the frequency column.
		const data = inputTable.map(table =>
			table.map(row => row.slice())
		);
		const freqScale = pickScale(metricPrefix);
		const freqPrefixLabel = metricPrefixLabel(metricPrefix);
		data.forEach(tbl => {
			if (tbl[0] && typeof tbl[0][0] === 'string' && freqPrefixLabel) {
				tbl[0][0] = `${tbl[0][0]} ${freqPrefixLabel}`;
			}
			for (let r = 1; r < tbl.length; r++) {
				if (Number.isFinite(tbl[r][0])) tbl[r][0] = tbl[r][0] / freqScale;
			}
		});

		// Table shape calc
		const tablesCount = data.length;
		const rowsPerTable = data.map(t => t.length);
		const totalRows = rowsPerTable.reduce((a, b) => a + b, 0);
		const totalCols = data.reduce((max, t) => {
			const localMax = Math.max(...t.map(row => row.length));
			return Math.max(max, localMax);
		}, 0);

		const tableWidth = totalCols * (columnWidth + 3) + 1;
		const tableHeight = totalRows * (rowHeight + 1) + (tablesCount - 1) + 1;
		const titleWidth = effectiveTitle ? effectiveTitle.length * effectiveFontSize * 0.65 : 0;
		const controlsWidth = 280;
		const minOuterWidth = Math.ceil(titleWidth + controlsWidth);
		const outerWidth = Math.max(margin.left + tableWidth + margin.right, minOuterWidth);
		const outerHeight = margin.top + tableHeight + margin.bottom;

		if (showWHAlert) {
			// eslint-disable-next-line no-alert
			alert(`The table dimensions: Width is ${outerWidth}, Height is ${outerHeight}`);
		}

		const effectiveHeaderFill = headerFill ?? (effectiveHeaderColor === 'gray' ? '#d4d4d4' : '#add8e6');
		const titleVisible = effectiveTitle ? 'visible' : 'hidden';

		// Y offsets for each stacked table (inside the drawing area)
		const x0 = margin.left;
		const yOffsets = [];
		for (let i = 0; i < tablesCount; i++) {
			const prev = i === 0 ? 0 : yOffsets[i - 1] + rowsPerTable[i - 1] * (rowHeight + 1) + 1;
			yOffsets.push(prev);
		}
		const y0 = margin.top;

		// ======== Mount points & elements ========

			const container = select(mount)
				.append('div')
				.attr('id', containerId || null)
				.attr('class', 'line-table-container')
				.style('display', 'inline-block')
				.style('position', 'relative')        // anchor for absolute button
				.style('font-family', fontFamily)
				.style('font-size', `${effectiveFontSize}px`)
				.style('padding-top', '0');

		// ======== PNG copy (keeps SVG in place) ========
		async function svgToPngBlob(svgNode, width, height) {
			const doctype = `<?xml version="1.0" standalone="no"?>` +
				`<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`;
			const source = (new XMLSerializer()).serializeToString(svgNode);
			const svgBlob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' });
			const url = URL.createObjectURL(svgBlob);

			try {
				const img = new Image();
				// Important for some browsers to render local SVG properly
				img.decoding = 'async';
				img.loading = 'eager';

				const loadPromise = new Promise((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = (e) => reject(e);
				});
				img.src = url;
				await loadPromise;

					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext('2d', { willReadFrequently: false });
					if (effectiveBackgroundColor && effectiveBackgroundColor !== 'transparent') {
						ctx.fillStyle = effectiveBackgroundColor;
						ctx.fillRect(0, 0, width, height);
					}
					ctx.drawImage(img, 0, 0);

				const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
				return blob;
			} finally {
				URL.revokeObjectURL(url);
			}
		}

		async function copyPNG() {
			const node = svg.node();
			try {
				const blob = await svgToPngBlob(node, outerWidth, outerHeight);
				if (!blob) throw new Error('Failed to create PNG blob');

				if (!navigator.clipboard || !window.ClipboardItem) {
					throw new Error('Clipboard API for images is not supported in this browser/context.');
				}

				await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

				//console.log("Image copied to clipboard!");

			} catch (err) {
				//console.error(err);
				//console.error("Failed to copy image:", err);
			}
		}

		function tsvEscape(val) {
			const s = (val ?? '').toString();
			return s.replace(/\t/g, ' ').replace(/[\n\r]/g, ' ');
		}

		async function copyTSV() {
			try {
				const tsvChunks = data.map(tbl => {
					const cols = Math.max(...tbl.map(r => r.length));
					const lines = [];
					for (let r = 0; r < tbl.length; r++) {
						const row = [];
						for (let c = 0; c < cols; c++) {
							const val = (tbl[r] || [])[c];
							const formatted = (typeof val === 'string')
								? val
								: Number.isFinite(val) ? val.toFixed(5) : '';
							row.push(tsvEscape(formatted));
						}
						lines.push(row.join('\t'));
					}
					return lines.join('\n');
				});

				const tsvText = tsvChunks.join('\n\n'); // blank line between tables

				if (!navigator.clipboard || !navigator.clipboard.writeText) {
					throw new Error('Clipboard text API not available.');
				}

				await navigator.clipboard.writeText(tsvText);

				//console.log("copied to clipboard");


			} catch (err) {
				//console.error("Failed to copy image:", err);
			}
		}

		// ======== Button (direct child of container) ========
		const button = container.append('button')
			//.attr('id', 'copyImage')
			.attr('aria-label', 'Copy')
			.style('position', 'absolute')
			.style('top', '0')
			.style('right', '10px')
			.style('background', 'none')
			.style('border', 'none')
			.style('padding', '4px 8px')
			.style('cursor', 'pointer')
			.style('display', 'inline-flex')
			.style('align-items', 'center')
			.style('gap', '4px')
			.style('border-radius', '6px')
			.on('mouseover', function () { select(this).style('background', '#ccf2ff'); })  //#ccf2ff
			.on('mouseout', function () { select(this).style('background', 'none'); })
			.on('mousedown', function () { select(this).style('background', '#00ace6'); })  //#00ace6
			.on('mouseup', function () { select(this).style('background', '#ccf2ff'); })
			.on('click', copyPNG);

		button.html(`
    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667C1.83496 9.978 1.83432 9.42091 1.87109 8.9707C1.90851 8.5127 1.98772 8.10625 2.17969 7.72949L2.30176 7.51172C2.60586 7.0159 3.04236 6.6122 3.56348 6.34668L3.70606 6.28027C4.04237 6.136 4.40303 6.07083 4.80371 6.03809C5.14051 6.01057 5.53708 6.00551 6.00391 6.00391C6.00551 5.53708 6.01057 5.14051 6.03809 4.80371C6.0755 4.34588 6.15483 3.94012 6.34668 3.56348L6.46875 3.34473C6.77282 2.84912 7.20856 2.44514 7.72949 2.17969L7.87207 2.11328C8.20855 1.96886 8.56979 1.90385 8.9707 1.87109C9.42091 1.83432 9.978 1.83496 10.667 1.83496H13.5C14.1891 1.83496 14.746 1.83431 15.1963 1.87109C15.6541 1.90851 16.0599 1.98788 16.4365 2.17969L16.6553 2.30176C17.151 2.60585 17.5548 3.04244 17.8203 3.56348L17.8867 3.70606C18.031 4.04235 18.0962 4.40306 18.1289 4.80371C18.1657 5.25395 18.165 5.81091 18.165 6.5V9.33301Z">
      </path>
    </svg>Copy as png
  `);

		const tsvBtn = container.append('button')
			//.attr('id', 'copyTsv')
			.attr('aria-label', 'Copy TSV')
			.style('position', 'absolute')
			.style('top', '0')
			.style('right', '150px')  // adjust so it doesn’t overlap your PNG button
			.style('background', 'none')
			.style('border', 'none')
			.style('padding', '4px 8px')
			.style('cursor', 'pointer')
			.style('display', 'inline-flex')
			.style('align-items', 'center')
			.style('gap', '4px')
			.style('border-radius', '6px')
			.on('mouseover', function () { select(this).style('background', '#ccf2ff'); })
			.on('mouseout', function () { select(this).style('background', 'none'); })
			.on('mousedown', function () { select(this).style('background', '#00ace6'); })
			.on('mouseup', function () { select(this).style('background', '#ccf2ff'); })
			.on('click', copyTSV);

		tsvBtn.html([
			'<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">',
			'  <path d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667C1.83496 9.978 1.83432 9.42091 1.87109 8.9707C1.90851 8.5127 1.98772 8.10625 2.17969 7.72949L2.30176 7.51172C2.60586 7.0159 3.04236 6.6122 3.56348 6.34668L3.70606 6.28027C4.04237 6.136 4.40303 6.07083 4.80371 6.03809C5.14051 6.01057 5.53708 6.00551 6.00391 6.00391C6.00551 5.53708 6.01057 5.14051 6.03809 4.80371C6.0755 4.34588 6.15483 3.94012 6.34668 3.56348L6.46875 3.34473C6.77282 2.84912 7.20856 2.44514 7.72949 2.17969L7.87207 2.11328C8.20855 1.96886 8.56979 1.90385 8.9707 1.87109C9.42091 1.83432 9.978 1.83496 10.667 1.83496H13.5C14.1891 1.83496 14.746 1.83431 15.1963 1.87109C15.6541 1.90851 16.0599 1.98788 16.4365 2.17969L16.6553 2.30176C17.151 2.60585 17.5548 3.04244 17.8203 3.56348L17.8867 3.70606C18.031 4.04235 18.0962 4.40306 18.1289 4.80371C18.1657 5.25395 18.165 5.81091 18.165 6.5V9.33301Z"></path>',
			'</svg>Copy as tsv'
		].join(''));


		// ======== The SVG itself ========
			const svg = container.append('svg')
				.attr('id', svgId || null)
				.style('user-select', 'text')
			.style('-webkit-user-select', 'text')
			.style('-ms-user-select', 'text')
				.attr('class', 'line-table-svg')
				.attr('width', outerWidth)
				.attr('height', outerHeight)
				.style('background-color', effectiveBackgroundColor === 'transparent' ? 'transparent' : effectiveBackgroundColor);

			const tableBackground = svg.insert('rect', ':first-child')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', outerWidth)
				.attr('height', outerHeight)
				.attr('fill', effectiveBackgroundColor === 'transparent' ? 'none' : effectiveBackgroundColor)
				.attr('class', 'line-table-background');

		// Border
		const tableBorder = svg.append('rect')
			.attr('width', outerWidth)
			.attr('height', outerHeight)
			.attr('class', 'line-table-border')
			.attr('fill', 'none')
			.attr('stroke', tableBorderColor)
			.attr('stroke-width', tableBorderWidth);

		// Title
		const txtTableTitle = svg.append('text')
				.attr('x', 2)
				.attr('y', 18)
				.style('visibility', titleVisible)
				.style('font', `${effectiveFontSize}px ${fontFamily}`)
				.style('user-select', 'none')
				.style('-webkit-user-select', 'none')
				.style('-ms-user-select', 'none')
				.style('pointer-events', 'none')
				.text(effectiveTitle);

		const txtHeaders = [];
		const txtData = [];

		function cssPropertyToJsName(propertyName) {
			return propertyName.replace(/-([a-z])/g, function (_, letter) {
				return letter.toUpperCase();
			});
		}

		function applyStyleToElement(element, style) {
			if (!element) return;

			if (typeof style === 'string') {
				const currentStyle = element.getAttribute('style') || '';
				element.setAttribute('style', currentStyle ? currentStyle + ';' + style : style);
			} else if (typeof style === 'object' && style !== null) {
				for (const [key, value] of Object.entries(style)) {
					element.style[cssPropertyToJsName(key)] = value;
				}
			}
		}

		function applyTextStyle(elements, style) {
			elements.forEach((el) => {
				applyStyleToElement(el, style);
			});
		}

		// ======== Pure-SVG table renderer ========
		function drawTable(myArray, originX, originY) {
			const cols = Math.max(...myArray.map(r => r.length));
			for (let row = 0; row < myArray.length; row++) {
				for (let col = 0; col < cols; col++) {
					const val = (myArray[row] || [])[col];
					const isHeader = row === 0; // your format uses row 0 as headers
					const fill = isHeader ? effectiveHeaderFill : cellFill;
					const x = originX + (columnWidth + 3) * col;
					const y = originY + (rowHeight + 1) * row;

					// Cell rect
					svg.append('rect')
						.attr('x', x)
						.attr('y', y)
						.attr('width', (col === cols - 1 ? columnWidth + 3 - 1 : columnWidth + 3)) // last cell a tad narrower for outer stroke symmetry
						.attr('height', rowHeight + 1)
						.attr('fill', fill)
						.attr('stroke', cellBorderColor)
						.attr('stroke-width', cellBorderWidth)
						.attr('pointer-events', 'none');   // allow text selection

					// Cell text
					const txt = (typeof val === 'string')
						? val
						: Number.isFinite(val) ? val.toFixed(5) : '';

					const textX = isHeader
						? x + Math.max(3, Math.round(columnWidth / 2 - (String(txt).length * columnWidth) / 28)) // crude center
						: x + 3;

					const text = svg.append('text')
							.attr('x', textX)
							.attr('y', y + 16) // baseline adjustment
							.attr('class', 'line-table-text')
							.style('font', `${effectiveFontSize}px ${fontFamily}`)
						.text(txt)
						.style('user-select', 'text')
						.style('-webkit-user-select', 'text')
						.style('-ms-user-select', 'text')
						.style('cursor', 'text');

					if (isHeader) {
						txtHeaders.push(text.node());
					} else {
						txtData.push(text.node());
					}
				}
			}
		}

		// Draw all tables stacked
		data.forEach((tbl, i) => {
			drawTable(tbl, x0, y0 + yOffsets[i]);
		});

		function setTxtTableTitleStyle(style) {
			applyStyleToElement(txtTableTitle.node(), style);
		}

		function setTableBackgroundStyle(style) {
			applyStyleToElement(tableBackground.node(), style);
		}

		function setTableBorderStyle(style) {
			applyStyleToElement(tableBorder.node(), style);
		}

		function setTxtTableHeadersStyle(style) {
			applyTextStyle(txtHeaders, style);
		}

		function setTxtTableDataStyle(style) {
			applyTextStyle(txtData, style);
		}

		// Returning an API to the user
		// There are exposed elements for super users
		// There are exposed setter methods to change the style
		// ---> You can pass an object to a setter: { fill: "red", fontStyle: "italic" }
		// ---> Or you can pass a string to a setter: "fill:red; font-style:italic;"
		// Either will work

		return {
			// return elements
			container: container.node(),
			svg: svg.node(),
			tableBackground: tableBackground.node(),
			tableBorder: tableBorder.node(),
			txtTableTitle: txtTableTitle.node(),
			txtHeaders: txtHeaders,
			txtData: txtData,

			// return setters
			setTxtTableTitleStyle: setTxtTableTitleStyle,
			setTableBackgroundStyle: setTableBackgroundStyle,
			setTableBorderStyle: setTableBorderStyle,
			setTxtTableHeadersStyle: setTxtTableHeadersStyle,
			setTxtTableDataStyle: setTxtTableDataStyle
		};

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

function R(R = 75) { // series resistor nPort object
	var rPort = new nPort;
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
	rPort.setspars(sparsArray);
	rPort.setglobal(global);
	return rPort;
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

function L(L = 5e-9) { // series inductor nPort object
	var lPort = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(0, 2*Math.PI*L*frequencyList[freqCount]);
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}	lPort.setspars(sparsArray);
	lPort.setglobal(global);
	return lPort;
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

function seC(C = 1e-12) { // series capacitor nPort object
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

function C(C = 1e-12) { // series inductor nPort object
	var cPort = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro,0); Zo.inv(); var two = complex(2,0), freqCount = 0, Z = [], s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		Z[freqCount] = complex(0, -1/(2*Math.PI*C*frequencyList[freqCount]));
		s11 = Z[freqCount].div(Z[freqCount].add(Zo.add(Zo)));
		s21 = (two.mul(Zo)).div(Z[freqCount].add(Zo.add(Zo)));
		s12 = s21;
		s22 = s11;
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}	cPort.setspars(sparsArray);
	cPort.setglobal(global);
	return cPort;
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

// Modified: 2026-06-27

function trf(N = 0.5) { // ideal transformer nPort object
	var trf = new nPort;
	var frequencyList = global.fList; global.Ro;
	var freqCount = 0, s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex((N ** 2 - 1) / (N ** 2 + 1), 0);
		s12 = complex(2 * N / (N ** 2 + 1), 0);
		s21 = complex(2 * N / (N ** 2 + 1), 0);
		s22 = complex((1 - N ** 2) / (N ** 2 + 1), 0);
		sparsArray[freqCount] = [frequencyList[freqCount], s11, s12, s21, s22];
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

// Modified: 2026-07-14

function paSeRC(R = 75, C = 1e-12) { // parallel series-RC nPort object
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

// Modified: 2026-07-01

function Shift90() { // lossless matched two-port with +90 degree through phase
	var Shift90 = new nPort;
	var frequencyList = global.fList; global.Ro;
	var freqCount = 0, s11, s12, s21, s22, sparsArray = [];
	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		s11 = complex(0,0);
		s12 = complex(0,1);
		s21 = complex(0,1);
		s22 = complex(0,0);
		sparsArray[freqCount] =	[frequencyList[freqCount],s11, s12, s21, s22];
	}
	Shift90.setspars(sparsArray);
	Shift90.setglobal(global);
	return Shift90;
}

function Tlin(Z = 60, Length = 0.5 * 0.0254) { // Z is in ohms and Length is in meters, sparameters of a physical transmission line
	var Tlin = new nPort;
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
	}	Tlin.setspars(sparsArray);
	Tlin.setglobal(global);
	return Tlin;
}

function Tclin(Zoe = 100, Zoo = 30, Length = 1.47 * 0.0254) { // 1.4732 is the quarter wavelength at 2GHz, (1.3412 at 2.2 GHz)
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

// Modified: 2026-06-27

const INCH_TO_METER = 0.0254;
const MIL_TO_METER = 0.001 * INCH_TO_METER;

const C0 = 2.99792458e8;
const EPSILON0 = 8.854187817e-12;
const MU0 = 4 * Math.PI * 1e-7;
const VACUUM_IMPEDANCE = 120 * Math.PI;

const COPPER_RESISTIVITY = 1.72e-8;

// Modified: 2026-07-01

var pi$7 = Math.PI;

var square$4 = function (x) { return x * x; };
var cube$4 = function (x) { return x * x * x; };
var fourth$4 = function (x) { return x * x * x * x; };

var hammerstadAB$4 = function (u, er) {
	var u2 = square$4(u);
	var u3 = cube$4(u);
	var u4 = fourth$4(u);
	var a = 1 + Math.log((u4 + u2 / 2704) / (u4 + 0.432)) / 49 + Math.log(1 + u3 / 5929.741) / 18.7;
	var b = 0.564 * ((er - 0.9) / (er + 3)) ** 0.053;
	return {a, b};
};

var hammerstadEr$4 = function (u, er) {
	var ab = hammerstadAB$4(u, er);
	return (er + 1) / 2 + (er - 1) / 2 * (1 + 10 / u) ** (-ab.a * ab.b);
};

var homogeneousZ0$4 = function (u) {
	var f = 6 + (2 * pi$7 - 6) * Math.exp(-((30.666 / u) ** 0.7528));
	return (VACUUM_IMPEDANCE / (2 * pi$7)) * Math.log(f / u + Math.sqrt(1 + 4 / square$4(u)));
};

var deltaUThicknessSingle$4 = function (u, thicknessOverHeight) {
	if (thicknessOverHeight <= 0.0) {
		return 0.0;
	}

	return (1.25 * thicknessOverHeight / pi$7) *
		(1 + Math.log((2 + (4 * pi$7 * u - 2) / (1 + Math.exp(-100 * (u - 1 / (2 * pi$7))))) / thicknessOverHeight));
};

var singleLine$1 = function (u, er) {
	var erEff = hammerstadEr$4(u, er);
	var z0 = homogeneousZ0$4(u) / Math.sqrt(erEff);
	return {erEff, z0};
};

var singleLineDispersion$1 = function (u, er, erEff0, z0, frequency, Height) {
	var fn = frequency * Height / 1e6; // GHz-mm when frequency is Hz and Height is meters.
	var p1 = 0.27488 + u * (0.6315 + 0.525 / (1 + 0.0157 * fn) ** 20) - 0.065683 * Math.exp(-8.7513 * u);
	var p2 = 0.33622 * (1 - Math.exp(-0.03442 * er));
	var p3 = 0.0363 * Math.exp(-4.6 * u) * (1 - Math.exp(-((fn / 38.7) ** 4.97)));
	var p4 = 1 + 2.751 * (1 - Math.exp(-((er / 15.916) ** 8)));
	var p = p1 * p2 * ((p3 * p4 + 0.1844) * fn) ** 1.5763;
	var erEff = er - (er - erEff0) / (1 + p);

	var r1 = 0.03891 * er ** 1.4;
	var r2 = 0.267 * u ** 7;
	var r3 = 4.766 * Math.exp(-3.228 * u ** 0.641);
	var r4 = 0.016 + (0.0514 * er) ** 4.524;
	var r5 = (fn / 28.843) ** 12;
	var r6 = 22.2 * u ** 1.92;
	var r7 = 1.206 - 0.3144 * Math.exp(-r1) * (1 - Math.exp(-r2));
	var r8 = 1 + 1.275 * (1 - Math.exp(-4625e-6 * r3 * er ** 1.674 * (fn / 18.365) ** 2.745));
	var r9Base = (er - 1) ** 6;
	var r9 = 5.086 * r4 * (r5 / (0.3838 + 0.386 * r4)) * (Math.exp(-r6) / (1 + 1.2992 * r5)) * (r9Base / (1 + 10 * r9Base));
	var r10 = 0.00044 * er ** 2.136 + 0.0184;
	var r11Base = (fn / 19.47) ** 6;
	var r11 = r11Base / (1 + 0.0962 * r11Base);
	var r12 = 1 / (1 + 0.00245 * square$4(u));
	var r13 = 0.9408 * erEff ** r8 - 0.9603;
	var r14 = (0.9408 - r9) * erEff0 ** r8 - 0.9603;
	var r15 = 0.707 * r10 * (fn / 12.3) ** 1.097;
	var r16 = 1 + 0.0503 * square$4(er) * r11 * (1 - Math.exp(-((u / 15) ** 6)));
	var r17 = r7 * (1 - 1.1241 * (r12 / r16) * Math.exp(-0.026 * fn ** 1.15656 - r15));
	var z0Frequency = z0 * (r13 / r14) ** r17;

	return {erEff, z0Frequency};
};

function mlin(Width = 0.023 * INCH_TO_METER, Height = 0.025 * INCH_TO_METER, Length = 0.5 * INCH_TO_METER, Thickness = 0.0000125 * INCH_TO_METER, er = 10, rho = 1, tand = 0.001, roughnessRms = 0) {
	var mlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro, 0), two = complex(2, 0), freqCount = 0, s11, s12, s21, s22, sparsArray = [];
	var Atlin = {}, Btlin = {}, Ctlin = {}, Zmlin = {}, Ds = {}, alpha = 0, beta = 0, gamma = {};

	var wOverH = Width / Height;
	var thicknessOverHeight = Thickness / Height;
	var deltaU = deltaUThicknessSingle$4(wOverH, thicknessOverHeight);
	var effectiveWOverH = wOverH + deltaU;
	var quasiStatic = singleLine$1(effectiveWOverH, er);
	var Z = quasiStatic.z0;
	var ere = quasiStatic.erEff;
	var Zf = 0;
	var eref = 0;
	var analysis = [];

	// compute conductor loss terms
	var B = Width / Height >= 1 / (2 * pi$7) ? Height : 2 * pi$7 * Width;
	var A = Thickness > 0.0 ? 1 + 1 / effectiveWOverH * (1 + 1 / pi$7 * Math.log(2 * B / Thickness)) : 0.0;

	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var skinDepth = rho > 0.0 ? Math.sqrt(COPPER_RESISTIVITY * rho / (pi$7 * frequencyList[freqCount] * MU0)) : 0.0;
		var Rs = Math.sqrt(pi$7 * frequencyList[freqCount] * MU0 * rho * COPPER_RESISTIVITY);
		if (roughnessRms > 0.0 && skinDepth > 0.0) {
			Rs *= 1 + (2 / pi$7) * Math.atan(1.4 * (roughnessRms / skinDepth) ** 2);
		}
		var Ac = Thickness > 0.0 && rho > 0.0 ? (Width / Height <= 1.0 ? 1.38 * A * (Rs / (Height * Z)) * (32 - effectiveWOverH) ** 2 / (32 + effectiveWOverH) ** 2 : 6.1e-5 * A * (Rs * Z * ere / Height) * (effectiveWOverH + (0.667 * effectiveWOverH) / (effectiveWOverH + 1.44))) : 0.0;

		var dispersion = singleLineDispersion$1(effectiveWOverH, er, ere, Z, frequencyList[freqCount], Height);
		Zf = dispersion.z0Frequency;
		eref = dispersion.erEff;
		var lambda0 = C0 / frequencyList[freqCount];
		var Ad = tand > 0.0 && er > 1.0 ? 27.3 * er / (er - 1) * (eref - 1) / Math.sqrt(eref) * tand / lambda0 : 0.0;
		analysis[freqCount] = {
			frequency: frequencyList[freqCount],
			Z: Zf,
			ere: eref,
			conductorLossDbPerMeter: Ac,
			dielectricLossDbPerMeter: Ad,
			skinDepth
		};

		Zmlin = complex(Zf, 0);

		Atlin = Zmlin.mul(Zmlin).sub(Zo.mul(Zo));
		Btlin = Zmlin.mul(Zmlin).add(Zo.mul(Zo));
		Ctlin = two.mul(Zmlin).mul(Zo);

		alpha = (Ac + Ad) / 8.68588;
		beta = Math.sqrt(eref) * 2 * Math.PI * frequencyList[freqCount] / C0;
		gamma = complex(alpha * Length, beta * Length);

		Ds = Ctlin.mul(gamma.coshCplx()).add(Btlin.mul(gamma.sinhCplx()));

		s11 = Atlin.mul(gamma.sinhCplx()).div(Ds);
		s12 = Ctlin.div(Ds);
		s21 = s12;
		s22 = s11;
		sparsArray[freqCount] = [frequencyList[freqCount], s11, s12, s21, s22];
	}	mlin.setspars(sparsArray);
	mlin.setglobal(global);
	mlin.microstrip = {
		Width,
		Height,
		Length,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		Z: analysis[0] ? analysis[0].Z : Z,
		ere: analysis[0] ? analysis[0].ere : ere,
		ZQuasiStatic: Z,
		ereQuasiStatic: ere,
		analysis
	};
	return mlin;
}

// Modified: 2026-06-30

var pi$6 = Math.PI;

var square$3 = function (x) { return x * x; };
var cube$3 = function (x) { return x * x * x; };
var fourth$3 = function (x) { return x * x * x * x; };

var hammerstadAB$3 = function (u, er) {
	var u2 = square$3(u);
	var u3 = cube$3(u);
	var u4 = fourth$3(u);
	var a = 1 + Math.log((u4 + u2 / 2704) / (u4 + 0.432)) / 49 + Math.log(1 + u3 / 5929.741) / 18.7;
	var b = 0.564 * ((er - 0.9) / (er + 3)) ** 0.053;
	return {a, b};
};

var hammerstadEr$3 = function (u, er) {
	var ab = hammerstadAB$3(u, er);
	return (er + 1) / 2 + (er - 1) / 2 * (1 + 10 / u) ** (-ab.a * ab.b);
};

var homogeneousZ0$3 = function (u) {
	var f = 6 + (2 * pi$6 - 6) * Math.exp(-((30.666 / u) ** 0.7528));
	return (VACUUM_IMPEDANCE / (2 * pi$6)) * Math.log(f / u + Math.sqrt(1 + 4 / square$3(u)));
};

var deltaUThicknessSingle$3 = function (u, thicknessOverHeight) {
	if (thicknessOverHeight <= 0.0) {
		return 0.0;
	}

	return (1.25 * thicknessOverHeight / pi$6) *
		(1 + Math.log((2 + (4 * pi$6 * u - 2) / (1 + Math.exp(-100 * (u - 1 / (2 * pi$6))))) / thicknessOverHeight));
};

var singleLine = function (u, er) {
	var erEff = hammerstadEr$3(u, er);
	var z0 = homogeneousZ0$3(u) / Math.sqrt(erEff);
	return {erEff, z0};
};

var singleLineDispersion = function (u, er, erEff0, z0, frequency, Height) {
	var fn = frequency * Height / 1e6; // GHz-mm when frequency is Hz and Height is meters.
	var p1 = 0.27488 + u * (0.6315 + 0.525 / (1 + 0.0157 * fn) ** 20) - 0.065683 * Math.exp(-8.7513 * u);
	var p2 = 0.33622 * (1 - Math.exp(-0.03442 * er));
	var p3 = 0.0363 * Math.exp(-4.6 * u) * (1 - Math.exp(-((fn / 38.7) ** 4.97)));
	var p4 = 1 + 2.751 * (1 - Math.exp(-((er / 15.916) ** 8)));
	var p = p1 * p2 * ((p3 * p4 + 0.1844) * fn) ** 1.5763;
	var erEff = er - (er - erEff0) / (1 + p);

	var r1 = 0.03891 * er ** 1.4;
	var r2 = 0.267 * u ** 7;
	var r3 = 4.766 * Math.exp(-3.228 * u ** 0.641);
	var r4 = 0.016 + (0.0514 * er) ** 4.524;
	var r5 = (fn / 28.843) ** 12;
	var r6 = 22.2 * u ** 1.92;
	var r7 = 1.206 - 0.3144 * Math.exp(-r1) * (1 - Math.exp(-r2));
	var r8 = 1 + 1.275 * (1 - Math.exp(-4625e-6 * r3 * er ** 1.674 * (fn / 18.365) ** 2.745));
	var r9Base = (er - 1) ** 6;
	var r9 = 5.086 * r4 * (r5 / (0.3838 + 0.386 * r4)) * (Math.exp(-r6) / (1 + 1.2992 * r5)) * (r9Base / (1 + 10 * r9Base));
	var r10 = 0.00044 * er ** 2.136 + 0.0184;
	var r11Base = (fn / 19.47) ** 6;
	var r11 = r11Base / (1 + 0.0962 * r11Base);
	var r12 = 1 / (1 + 0.00245 * square$3(u));
	var r13 = 0.9408 * erEff ** r8 - 0.9603;
	var r14 = (0.9408 - r9) * erEff0 ** r8 - 0.9603;
	var r15 = 0.707 * r10 * (fn / 12.3) ** 1.097;
	var r16 = 1 + 0.0503 * square$3(er) * r11 * (1 - Math.exp(-((u / 15) ** 6)));
	var r17 = r7 * (1 - 1.1241 * (r12 / r16) * Math.exp(-0.026 * fn ** 1.15656 - r15));
	var z0Frequency = z0 * (r13 / r14) ** r17;

	return {erEff, z0Frequency};
};

var quasiStaticCoupledLine = function (Width, Space, Height, Thickness, er) {
	var u = Width / Height;
	var g = Space / Height;
	var thicknessOverHeight = Thickness / Height;
	var deltaU = deltaUThicknessSingle$3(u, thicknessOverHeight);
	var deltaT = thicknessOverHeight > 0.0 ? thicknessOverHeight / (g * er) : 0.0;
	var deltaUEven = thicknessOverHeight > 0.0 ? deltaU * (1 - 0.5 * Math.exp(-0.69 * deltaU / deltaT)) : 0.0;
	var deltaUOdd = thicknessOverHeight > 0.0 ? deltaUEven + deltaT : 0.0;
	var uEven = u + deltaUEven;
	var uOdd = u + deltaUOdd;

	var single = singleLine(u, er);
	var singleOdd = singleLine(uOdd, er);

	var v = uEven * (20 + square$3(g)) / (10 + square$3(g)) + g * Math.exp(-g);
	var erEven = hammerstadEr$3(v, er);

	var bo = 0.747 * er / (0.15 + er);
	var co = bo - (bo - 0.207) * Math.exp(-0.414 * uOdd);
	var d = 0.593 + 0.694 * Math.exp(-0.562 * uOdd);
	var ao = 0.7287 * (singleOdd.erEff - (er + 1) / 2) * (1 - Math.exp(-0.179 * uOdd));
	var erOdd = ((er + 1) / 2 + ao - singleOdd.erEff) * Math.exp(-co * g ** d) + singleOdd.erEff;

	var q1 = 0.8695 * uEven ** 0.194;
	var q2 = 1 + 0.7519 * g + 0.189 * g ** 2.31;
	var q3 = 0.1975 + (16.6 + (8.4 / g) ** 6) ** -0.387 + Math.log(g ** 10 / (1 + (g / 3.4) ** 10)) / 241;
	var q4 = 2 * q1 / (q2 * (Math.exp(-g) * uEven ** q3 + (2 - Math.exp(-g)) * uEven ** -q3));
	var Zoe = single.z0 * Math.sqrt(single.erEff / erEven) / (1 - Math.sqrt(single.erEff) * q4 * single.z0 / VACUUM_IMPEDANCE);

	var q5 = 1.794 + 1.14 * Math.log(1 + 0.638 / (g + 0.517 * g ** 2.43));
	var q6 = 0.2305 + Math.log(g ** 10 / (1 + (g / 5.8) ** 10)) / 281.3 + Math.log(1 + 0.598 * g ** 1.154) / 5.1;
	var q7 = (10 + 190 * square$3(g)) / (1 + 82.3 * cube$3(g));
	var q8 = Math.exp(-6.5 - 0.95 * Math.log(g) - (g / 0.15) ** 5);
	var q9 = Math.log(q7) * (q8 + 1 / 16.5);
	var q10 = (q2 * q4 - q5 * Math.exp(Math.log(uOdd) * q6 * uOdd ** -q9)) / q2;
	var Zoo = single.z0 * Math.sqrt(single.erEff / erOdd) / (1 - Math.sqrt(single.erEff) * q10 * single.z0 / VACUUM_IMPEDANCE);

	return {u, g, uEven, uOdd, single, Zoe, Zoo, ereoe: erEven, ereoo: erOdd};
};

var dispersiveCoupledLine = function (quasiStatic, Width, Space, Height, er, frequency) {
	var u = Width / Height;
	var g = Space / Height;
	var fn = frequency * Height / 1e6; // GHz-mm when frequency is Hz and Height is meters.
	var singleDispersion = singleLineDispersion(u, er, quasiStatic.single.erEff, quasiStatic.single.z0, frequency, Height);

	var p1 = 0.27488 + u * (0.6315 + 0.525 / (1 + 0.0157 * fn) ** 20) - 0.065683 * Math.exp(-8.7513 * u);
	var p2 = 0.33622 * (1 - Math.exp(-0.03442 * er));
	var p3 = 0.0363 * Math.exp(-4.6 * u) * (1 - Math.exp(-((fn / 38.7) ** 4.97)));
	var p4 = 1 + 2.751 * (1 - Math.exp(-((er / 15.916) ** 8)));
	var p5 = 0.334 * Math.exp(-3.3 * (er / 15) ** 3) + 0.746;
	var p6 = p5 * Math.exp(-((fn / 18) ** 0.368));
	var p7 = 1 + 4.069 * p6 * g ** 0.479 * Math.exp(-1.347 * g ** 0.595 - 0.17 * g ** 2.5);
	var fe = p1 * p2 * ((p3 * p4 + 0.1844 * p7) * fn) ** 1.5763;
	var ereoe = er - (er - quasiStatic.ereoe) / (1 + fe);

	var p8 = 0.7168 * (1 + 1.076 / (1 + 0.0576 * (er - 1)));
	var p9 = p8 - 0.7913 * (1 - Math.exp(-((fn / 20) ** 1.424))) * Math.atan(2.481 * (er / 8) ** 0.946);
	var p10 = 0.242 * (er - 1) ** 0.55;
	var p11 = 0.6366 * (Math.exp(-0.3401 * fn) - 1) * Math.atan(1.263 * (u / 3) ** 1.629);
	var p12 = p9 + (1 - p9) / (1 + 1.183 * u ** 1.376);
	var p13 = 1.695 * p10 / (0.414 + 1.605 * p10);
	var p14 = 0.8928 + 0.1072 * (1 - Math.exp(-0.42 * (fn / 20) ** 3.215));
	var p15 = Math.abs(1 - 0.8928 * (1 + p11) * p12 * Math.exp(-p13 * g ** 1.092) / p14);
	var fo = p1 * p2 * ((p3 * p4 + 0.1844) * fn * p15) ** 1.5763;
	var ereoo = er - (er - quasiStatic.ereoo) / (1 + fo);

	var q11 = 0.893 * (1 - 0.3 / (1 + 0.7 * (er - 1)));
	var q12 = 2.121 * ((fn / 20) ** 4.91 / (1 + q11 * (fn / 20) ** 4.91)) * Math.exp(-2.87 * g) * g ** 0.902;
	var q13 = 1 + 0.038 * (er / 8) ** 5.1;
	var q14 = 1 + 1.203 * (er / 15) ** 4 / (1 + (er / 15) ** 4);
	var q15 = 1.887 * Math.exp(-1.5 * g ** 0.84) * g ** q14 / (1 + 0.41 * (fn / 15) ** 3 * u ** (2 / q13) / (0.125 + u ** (1.626 / q13)));
	var q16 = (1 + 9 / (1 + 0.403 * square$3(er - 1))) * q15;
	var q17 = 0.394 * (1 - Math.exp(-1.47 * (u / 7) ** 0.672)) * (1 - Math.exp(-4.25 * (fn / 20) ** 1.87));
	var q18 = 0.61 * (1 - Math.exp(-2.13 * (u / 8) ** 1.593)) / (1 + 6.544 * g ** 4.17);
	var q19 = 0.21 * fourth$3(g) / ((1 + 0.18 * g ** 4.9) * (1 + 0.1 * square$3(u)) * (1 + (fn / 24) ** 3));
	var q20 = (0.09 + 1 / (1 + 0.1 * (er - 1) ** 2.7)) * q19;
	var q21 = Math.abs(1 - 42.54 * g ** 0.133 * Math.exp(-0.812 * g) * u ** 2.5 / (1 + 0.033 * u ** 2.5));
	var re = (fn / 28.843) ** 12;
	var qe = 0.016 + (0.0514 * er * q21) ** 4.524;
	var pe = 4.766 * Math.exp(-3.228 * u ** 0.641);
	var de = 5.086 * qe * (re / (0.3838 + 0.386 * qe)) * (Math.exp(-22.2 * u ** 1.92) / (1 + 1.2992 * re)) * ((er - 1) ** 6 / (1 + 10 * (er - 1) ** 6));
	var ce = 1 + 1.275 * (1 - Math.exp(-4625e-6 * pe * er ** 1.674 * (fn / 18.365) ** 2.745)) - q12 + q16 - q17 + q18 + q20;

	var r1 = 0.03891 * er ** 1.4;
	var r2 = 0.267 * u ** 7;
	var r7 = 1.206 - 0.3144 * Math.exp(-r1) * (1 - Math.exp(-r2));
	var r10 = 0.00044 * er ** 2.136 + 0.0184;
	var r11Base = (fn / 19.47) ** 6;
	var r11 = r11Base / (1 + 0.0962 * r11Base);
	var r12 = 1 / (1 + 0.00245 * square$3(u));
	var r15 = 0.707 * r10 * (fn / 12.3) ** 1.097;
	var r16 = 1 + 0.0503 * square$3(er) * r11 * (1 - Math.exp(-((u / 15) ** 6)));
	var q0 = r7 * (1 - 1.1241 * (r12 / r16) * Math.exp(-0.026 * fn ** 1.15656 - r15));
	var Zoe = quasiStatic.Zoe * ((0.9408 * singleDispersion.erEff ** ce - 0.9603) / ((0.9408 - de) * quasiStatic.single.erEff ** ce - 0.9603)) ** q0;

	var q29 = 15.16 / (1 + 0.196 * square$3(er - 1));
	var q28 = 0.149 * cube$3(er - 1) / (94.5 + 0.038 * cube$3(er - 1));
	var q27 = 0.4 * g ** 0.84 * (1 + 2.5 * (er - 1) ** 1.5 / (5 + (er - 1) ** 1.5));
	var q26 = 30 - 22.2 * (((er - 1) / 13) ** 12 / (1 + 3 * ((er - 1) / 13) ** 12)) - q29;
	var q25 = 0.3 * square$3(fn) / (10 + square$3(fn)) * (1 + 2.333 * square$3(er - 1) / (5 + square$3(er - 1)));
	var q24 = 2.506 * q28 * u ** 0.894 * ((1 + 1.3 * u) * fn / 99.25) ** 4.29 / (3.575 + u ** 0.894);
	var q23 = 1 + 0.005 * fn * q27 / ((1 + 0.812 * (fn / 15) ** 1.9) * (1 + 0.025 * square$3(u)));
	var q22 = 0.925 * (fn / q26) ** 1.536 / (1 + 0.3 * (fn / 30) ** 1.536);
	var Zoo = singleDispersion.z0Frequency + (quasiStatic.Zoo * (ereoo / quasiStatic.ereoo) ** q22 - singleDispersion.z0Frequency * q23) / (1 + q24 + (0.46 * g) ** 2.2 * q25);

	return {Zoe, Zoo, ereoe, ereoo};
};

var modeLosses = function (Width, Height, Thickness, Length, er, rho, tand, frequency, modeZ0, modeErEff, otherModeZ0, otherModeErEff, roughnessRms) {
	var conductorDb = 0.0;
	var dielectricDb = 0.0;

	if (frequency > 0.0 && Width > 0.0 && Height > 0.0 && modeZ0 > 0.0 && modeErEff > 0.0) {
		var z0Homogeneous = modeZ0 * Math.sqrt(modeErEff);
		var otherZ0Homogeneous = otherModeZ0 * Math.sqrt(otherModeErEff);
		var skinDepth = rho > 0.0 ? Math.sqrt(COPPER_RESISTIVITY * rho / (pi$6 * frequency * MU0)) : 0.0;

		if (Thickness > 0.0 && rho > 0.0 && skinDepth > 0.0) {
			var currentFactor = Math.exp(-1.2 * ((z0Homogeneous + otherZ0Homogeneous) / (2 * VACUUM_IMPEDANCE)) ** 0.7);
			var surfaceResistance = Math.sqrt(pi$6 * frequency * MU0 * rho * COPPER_RESISTIVITY);
			if (roughnessRms > 0.0) {
				surfaceResistance *= 1 + (2 / pi$6) * Math.atan(1.4 * square$3(roughnessRms / skinDepth));
			}
			var conductorQ = pi$6 * z0Homogeneous * Width * frequency / (surfaceResistance * C0 * currentFactor);
			conductorDb = (20 * pi$6 / Math.log(10)) * frequency * Math.sqrt(modeErEff) / (C0 * conductorQ) * Length;
		}

		if (tand > 0.0 && er > 1.0) {
			dielectricDb = (20 * pi$6 / Math.log(10)) * (frequency / C0) * (er / Math.sqrt(modeErEff)) * ((modeErEff - 1) / (er - 1)) * tand * Length;
		}
	}

	return {conductorDb, dielectricDb, alphaNepers: (conductorDb + dielectricDb) / 8.68588};
};

function mclin(Width = 19.1155 * MIL_TO_METER, Space = 5.82185 * MIL_TO_METER, Height = 25 * MIL_TO_METER, Thickness = 0.0000125 * INCH_TO_METER, Length = 719.794 * MIL_TO_METER, er = 10, rho = 1, tand = 0.001, roughnessRms = 0) {
	var ctlin = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var Zo = complex(Ro, 0), two = complex(2, 0), freqCount = 0, Zoemclin = [], Zoomclin = [];
	var s11oe, s12oe, s21oe, s22oe;
	var s11oo, s12oo, s21oo, s22oo;
	var s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44;
	var sparsArray = [];
	var Aoe = {}, Boe = {}, Coe = {}, Dsoe = {};
	var Aoo = {}, Boo = {}, Coo = {}, Dsoo = {};
	var alphaOe = 0, alphaOo = 0, betaOe = 0, betaOo = 0, gammaOe = {}, gammaOo = {};

	// Kirschning/Jansen equal-width coupled microstrip model, using Qucs as
	// a cross-check and the published equation family as the implementation basis.
	var quasiStatic = quasiStaticCoupledLine(Width, Space, Height, Thickness, er);
	var dispersion = [];

	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var mode = dispersiveCoupledLine(quasiStatic, Width, Space, Height, er, frequency);
		var evenLoss = modeLosses(Width, Height, Thickness, Length, er, rho, tand, frequency, mode.Zoe, mode.ereoe, mode.Zoo, mode.ereoo, roughnessRms);
		var oddLoss = modeLosses(Width, Height, Thickness, Length, er, rho, tand, frequency, mode.Zoo, mode.ereoo, mode.Zoe, mode.ereoe, roughnessRms);

		alphaOe = evenLoss.alphaNepers;
		alphaOo = oddLoss.alphaNepers;
		betaOe = Math.sqrt(mode.ereoe) * 2 * pi$6 * frequency / C0;
		betaOo = Math.sqrt(mode.ereoo) * 2 * pi$6 * frequency / C0;
		gammaOe = complex(alphaOe, betaOe * Length);
		gammaOo = complex(alphaOo, betaOo * Length);
		dispersion[freqCount] = {
			frequency,
			Zoe: mode.Zoe,
			Zoo: mode.Zoo,
			ereoe: mode.ereoe,
			ereoo: mode.ereoo,
			evenConductorLossDb: evenLoss.conductorDb,
			oddConductorLossDb: oddLoss.conductorDb,
			evenDielectricLossDb: evenLoss.dielectricDb,
			oddDielectricLossDb: oddLoss.dielectricDb
		};

		// Even-mode two-port section.
		Zoemclin = complex(mode.Zoe, 0);

		Aoe = Zoemclin.mul(Zoemclin).sub(Zo.mul(Zo));
		Boe = Zoemclin.mul(Zoemclin).add(Zo.mul(Zo));
		Coe = two.mul(Zoemclin).mul(Zo);

		Dsoe = Coe.mul(gammaOe.coshCplx()).add(Boe.mul(gammaOe.sinhCplx()));

		s11oe = Aoe.mul(gammaOe.sinhCplx()).div(Dsoe);
		s12oe = Coe.div(Dsoe);
		s21oe = s12oe;
		s22oe = s11oe;

		// Odd-mode two-port section.
		Zoomclin = complex(mode.Zoo, 0);

		Aoo = Zoomclin.mul(Zoomclin).sub(Zo.mul(Zo));
		Boo = Zoomclin.mul(Zoomclin).add(Zo.mul(Zo));
		Coo = two.mul(Zoomclin).mul(Zo);

		Dsoo = Coo.mul(gammaOo.coshCplx()).add(Boo.mul(gammaOo.sinhCplx()));

		s11oo = Aoo.mul(gammaOo.sinhCplx()).div(Dsoo);
		s12oo = Coo.div(Dsoo);
		s21oo = s12oo;
		s22oo = s11oo;

		s44 = s11 = (s11oe.add(s11oo)).mul(complex(0.5, 0));
		s33 = s22 = (s22oe.add(s22oo)).mul(complex(0.5, 0));
		s34 = s21 = (s21oe.add(s21oo)).mul(complex(0.5, 0));
		s43 = s12 = (s12oe.add(s12oo)).mul(complex(0.5, 0));
		s13 = s42 = (s12oe.sub(s12oo)).mul(complex(0.5, 0));
		s31 = s24 = (s21oe.sub(s21oo)).mul(complex(0.5, 0));
		s14 = s41 = (s11oe.sub(s11oo)).mul(complex(0.5, 0));
		s23 = s32 = (s22oe.sub(s22oo)).mul(complex(0.5, 0));

		sparsArray[freqCount] = [frequencyList[freqCount], s11, s12, s13, s14, s21, s22, s23, s24, s31, s32, s33, s34, s41, s42, s43, s44];
	}

	ctlin.setspars(sparsArray);
	ctlin.setglobal(global);
	var firstDispersion = dispersion[0] || {Zoe: quasiStatic.Zoe, Zoo: quasiStatic.Zoo, ereoe: quasiStatic.ereoe, ereoo: quasiStatic.ereoo};
	ctlin.microstrip = {
		Width,
		Space,
		Height,
		Thickness,
		Length,
		er,
		rho,
		tand,
		roughnessRms,
		Zoe: firstDispersion.Zoe,
		Zoo: firstDispersion.Zoo,
		ereoe: firstDispersion.ereoe,
		ereoo: firstDispersion.ereoo,
		ZoeQuasiStatic: quasiStatic.Zoe,
		ZooQuasiStatic: quasiStatic.Zoo,
		ereoeQuasiStatic: quasiStatic.ereoe,
		ereooQuasiStatic: quasiStatic.ereoo,
		dispersion
	};
	return ctlin;
}

// Modified: 2026-07-08

var pi$5 = Math.PI;

var square$2 = function (x) { return x * x; };
var cube$2 = function (x) { return x * x * x; };
var fourth$2 = function (x) { return x * x * x * x; };

var hammerstadAB$2 = function (u, er) {
	var u2 = square$2(u);
	var u3 = cube$2(u);
	var u4 = fourth$2(u);
	var a = 1 + Math.log((u4 + u2 / 2704) / (u4 + 0.432)) / 49 + Math.log(1 + u3 / 5929.741) / 18.7;
	var b = 0.564 * ((er - 0.9) / (er + 3)) ** 0.053;
	return {a, b};
};

var hammerstadEr$2 = function (u, er) {
	var ab = hammerstadAB$2(u, er);
	return (er + 1) / 2 + (er - 1) / 2 * (1 + 10 / u) ** (-ab.a * ab.b);
};

var homogeneousZ0$2 = function (u) {
	var f = 6 + (2 * pi$5 - 6) * Math.exp(-((30.666 / u) ** 0.7528));
	return (VACUUM_IMPEDANCE / (2 * pi$5)) * Math.log(f / u + Math.sqrt(1 + 4 / square$2(u)));
};

var deltaUThicknessSingle$2 = function (u, thicknessOverHeight) {
	if (thicknessOverHeight <= 0.0) {
		return 0.0;
	}

	return (1.25 * thicknessOverHeight / pi$5) *
		(1 + Math.log((2 + (4 * pi$5 * u - 2) / (1 + Math.exp(-100 * (u - 1 / (2 * pi$5))))) / thicknessOverHeight));
};

var microstripLine$2 = function (width, Height, Thickness, er) {
	// Arm baseline follows Hammerstad/Jensen-style single microstrip equations.
	var u = width / Height;
	var effectiveU = u + deltaUThicknessSingle$2(u, Thickness / Height);
	var ere = hammerstadEr$2(effectiveU, er);
	var Z = homogeneousZ0$2(effectiveU) / Math.sqrt(ere);

	return {
		width: width,
		u: u,
		effectiveU: effectiveU,
		ere: ere,
		Z: Z,
		D: VACUUM_IMPEDANCE / Math.sqrt(ere) * Height / Z,
		fp: 4e5 * Z / Height
	};
};

function mtee({
	commonWidth = 0.023 * INCH_TO_METER,
	branch1Width = 0.023 * INCH_TO_METER,
	branch2Width = 0.023 * INCH_TO_METER,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	rho = 1,
	tand = 0.001,
	roughnessRms = 0
} = {}) { // microstrip tee nPort object
	var mtee = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var freqCount = 0, s11, s12, s13, s21, s22, s23, s31, s32, s33, sparsArray = [];
	var WidthA = branch1Width, WidthB = branch2Width, WidthSide = commonWidth;
	var analysis = [];

	var armA = microstripLine$2(WidthA, Height, Thickness, er);
	var armB = microstripLine$2(WidthB, Height, Thickness, er);
	var armSide = microstripLine$2(WidthSide, Height, Thickness, er);


	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		// QUCS technical manual, Microstrip tee junction, eqs. 11.207 through 11.224.
		var freq = frequencyList[freqCount];
		var lambdaA = C0 / (Math.sqrt(armA.ere) * freq);
		var lambdaB = C0 / (Math.sqrt(armB.ere) * freq);
		var R = Math.sqrt(armA.Z * armB.Z) / armSide.Z;
		var Q = freq ** 2 / (armA.fp * armB.fp);
		var da = 0.055 * armSide.D * armA.Z / armSide.Z * (1 - 2 * armA.Z / armSide.Z * (freq / armA.fp) ** 2);
		var db = 0.055 * armSide.D * armB.Z / armSide.Z * (1 - 2 * armB.Z / armSide.Z * (freq / armB.fp) ** 2);
		var d2 = Math.sqrt(armA.D * armB.D) * (0.5 - R * (0.05 + 0.7 * Math.exp(-1.6 * R) + 0.25 * R * Q - 0.17 * Math.log(R)));
		var Ta2 = 1 - pi$5 * (freq / armA.fp) ** 2 * ((1 / 12) * (armA.Z / armSide.Z) ** 2 + (0.5 - d2 / armA.D) ** 2);
		var Tb2 = 1 - pi$5 * (freq / armB.fp) ** 2 * ((1 / 12) * (armB.Z / armSide.Z) ** 2 + (0.5 - d2 / armB.D) ** 2);
		var na = Math.sqrt(Math.max(Ta2, 1e-6));
		var nb = Math.sqrt(Math.max(Tb2, 1e-6));
		var BT = 5.5 * Math.sqrt((armA.D * armB.D) / (lambdaA * lambdaB)) * ((er + 2) / er) * (1 / (armSide.Z * na * nb)) * (Math.sqrt(Math.max(da * db, 0)) / armSide.D) * (1 + 0.9 * Math.log(R) + 4.5 * R * Q - 4.4 * Math.exp(-1.3 * R) - 20 * (armSide.Z / VACUUM_IMPEDANCE) ** 2);
		var jBTZ0 = complex(0, BT * Ro);
		var one = complex(1, 0);

		var Saa = one.sub(complex(na ** 2, 0).mul(jBTZ0.add(complex(1 / nb ** 2 + 1, 0)))).div(one.add(complex(na ** 2, 0).mul(jBTZ0.add(complex(1 / nb ** 2 + 1, 0)))));
		var Sbb = one.sub(complex(nb ** 2, 0).mul(jBTZ0.add(complex(1 / na ** 2 + 1, 0)))).div(one.add(complex(nb ** 2, 0).mul(jBTZ0.add(complex(1 / na ** 2 + 1, 0)))));
		var Scc = one.sub(jBTZ0.add(complex(1 / na ** 2 + 1 / nb ** 2, 0))).div(one.add(jBTZ0.add(complex(1 / na ** 2 + 1 / nb ** 2, 0))));
		var Sac = complex(2 * na, 0).div(complex(na ** 2, 0).mul(jBTZ0.add(complex(1 / nb ** 2 + 1, 0))).add(one));
		var Sca = Sac;
		var Sbc = complex(2 * nb, 0).div(complex(nb ** 2, 0).mul(jBTZ0.add(complex(1 / na ** 2 + 1, 0))).add(one));
		var Scb = Sbc;
		var Sab = complex(2, 0).div(complex(na * nb, 0).mul(jBTZ0.add(one)).add(complex(na / nb + nb / na, 0)));
		var Sba = Sab;

		// Hammerstad order is [branch1, branch2, common]. nP Tee order is [common, branch1, branch2].
		s11 = Scc;
		s12 = Sca;
		s13 = Scb;
		s21 = Sac;
		s22 = Saa;
		s23 = Sab;
		s31 = Sbc;
		s32 = Sba;
		s33 = Sbb;
		sparsArray[freqCount] = [frequencyList[freqCount], s11, s12, s13, s21, s22, s23, s31, s32, s33];
		analysis[freqCount] = {
			frequency: freq,
			R: R,
			Q: Q,
			da: da,
			db: db,
			d2: d2,
			Ta2: Ta2,
			Tb2: Tb2,
			na: na,
			nb: nb,
			BT: BT
		};
	}
	mtee.setspars(sparsArray);
	mtee.setglobal(global);
	mtee.Ct = (100 / Math.tanh(0.0072 * armSide.Z) + 0.64 * armSide.Z - 261) * WidthSide * 1e-12;
	mtee.microstrip = {
		commonWidth,
		branch1Width,
		branch2Width,
		Height,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		commonArm: armSide,
		branch1Arm: armA,
		branch2Arm: armB,
		Ct: mtee.Ct,
		source: 'QUCS microstrip tee equations 11.207 through 11.224; Edwards/Steer section 9.6.1 captures the same T-junction equivalent-circuit family, reference-plane shifts, transformer ratio, and shunt capacitance limits.',
		validity: {
			modelFamily: 'Hammerstad/Bekkadal-style tee reference-plane and transformer model as presented by QUCS and discussed by Edwards/Steer section 9.6.1',
			limitations: 'Edwards/Steer note no quoted accuracy for tee shunt-capacitance expressions and increasing discrepancy when 2 * effectiveWidth / guidedWavelength > 0.3 or impedance ratio exceeds about 2.'
		},
		analysis
	};
	return mtee;
}

// Modified: 2026-07-08

var pi$4 = Math.PI;

var square$1 = function (x) { return x * x; };
var cube$1 = function (x) { return x * x * x; };
var fourth$1 = function (x) { return x * x * x * x; };

var hammerstadAB$1 = function (u, er) {
	var u2 = square$1(u);
	var u3 = cube$1(u);
	var u4 = fourth$1(u);
	var a = 1 + Math.log((u4 + u2 / 2704) / (u4 + 0.432)) / 49 + Math.log(1 + u3 / 5929.741) / 18.7;
	var b = 0.564 * ((er - 0.9) / (er + 3)) ** 0.053;
	return {a, b};
};

var hammerstadEr$1 = function (u, er) {
	var ab = hammerstadAB$1(u, er);
	return (er + 1) / 2 + (er - 1) / 2 * (1 + 10 / u) ** (-ab.a * ab.b);
};

var homogeneousZ0$1 = function (u) {
	var f = 6 + (2 * pi$4 - 6) * Math.exp(-((30.666 / u) ** 0.7528));
	return (VACUUM_IMPEDANCE / (2 * pi$4)) * Math.log(f / u + Math.sqrt(1 + 4 / square$1(u)));
};

var deltaUThicknessSingle$1 = function (u, thicknessOverHeight) {
	if (thicknessOverHeight <= 0.0) {
		return 0.0;
	}

	return (1.25 * thicknessOverHeight / pi$4) *
		(1 + Math.log((2 + (4 * pi$4 * u - 2) / (1 + Math.exp(-100 * (u - 1 / (2 * pi$4))))) / thicknessOverHeight));
};

var microstripLine$1 = function (width, Height, Thickness, er) {
	var u = width / Height;
	var effectiveU = u + deltaUThicknessSingle$1(u, Thickness / Height);
	var ere = hammerstadEr$1(effectiveU, er);
	var Z = homogeneousZ0$1(effectiveU) / Math.sqrt(ere);

	return {
		width: width,
		u: u,
		effectiveU: effectiveU,
		ere: ere,
		Z: Z,
		D: VACUUM_IMPEDANCE / Math.sqrt(ere) * Height / Z,
		fp: 4e5 * Z / Height
	};
};

var emptyCplxMatrix = function (size) {
	var out = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			out[row][col] = complex(0, 0);
		}
	}
	return out;
};

var stampAdmittance = function (Y, nodeA, nodeB, admittance) {
	if (nodeB === null) {
		Y[nodeA][nodeA] = Y[nodeA][nodeA].add(admittance);
		return;
	}

	Y[nodeA][nodeA] = Y[nodeA][nodeA].add(admittance);
	Y[nodeB][nodeB] = Y[nodeB][nodeB].add(admittance);
	Y[nodeA][nodeB] = Y[nodeA][nodeB].sub(admittance);
	Y[nodeB][nodeA] = Y[nodeB][nodeA].sub(admittance);
};

var subMatrix = function (source, rows, cols) {
	var out = dim(rows.length, cols.length, complex(0, 0));
	for (var row = 0; row < rows.length; row++) {
		for (var col = 0; col < cols.length; col++) {
			out[row][col] = source[rows[row]][cols[col]];
		}
	}
	return matrix(out);
};

var reducedExternalY = function (Y) {
	var ports = [0, 1, 2, 3];
	var internal = [4, 5];
	var Ypp = subMatrix(Y, ports, ports);
	var Ypi = subMatrix(Y, ports, internal);
	var Yip = subMatrix(Y, internal, ports);
	var Yii = subMatrix(Y, internal, internal);
	return Ypp.subCplx(Ypi.mulCplx(Yii.invertCplx()).mulCplx(Yip));
};

var identityCplx$2 = function (size) {
	var out = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			out[row][col] = row === col ? complex(1, 0) : complex(0, 0);
		}
	}
	return matrix(out);
};

var yToS = function (Y, Ro) {
	var size = Y.m.length;
	var I = identityCplx$2(size);
	var normalizedY = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			normalizedY[row][col] = Y.m[row][col].mul(complex(Ro, 0));
		}
	}
	var y = matrix(normalizedY);
	return I.subCplx(y).mulCplx(I.addCplx(y).invertCplx());
};

var crossCapacitanceBase = function (width, crossingWidth, Height) {
	// QUCS technical manual, Microstrip cross, eqs. 11.226 and 11.227.
	var widthOverHeight = width / Height;
	var crossingOverHeight = crossingWidth / Height;
	var X = Math.log10(widthOverHeight) *
		(86.6 * crossingOverHeight - 30.9 * Math.sqrt(crossingOverHeight) + 367) +
		cube$1(crossingOverHeight) + 74 * crossingOverHeight + 130;
	return 1e-12 * width *
		(0.25 * X * widthOverHeight ** (-1 / 3) - 60 +
		1 / (2 * crossingOverHeight) -
		0.375 * widthOverHeight * (1 - crossingOverHeight));
};

var capCorrection = function (width, Height, Thickness, er) {
	// QUCS technical manual, Microstrip cross, eq. 11.231.
	var reference = microstripLine$1(width, Height, Thickness, 9.9);
	var actual = microstripLine$1(width, Height, Thickness, er);
	return reference.Z / actual.Z * Math.sqrt(actual.ere / reference.ere);
};

var armCapacitance = function (width, crossingWidth, Height, Thickness, er) {
	return crossCapacitanceBase(width, crossingWidth, Height) *
		capCorrection(width, Height, Thickness, er);
};

var armInductance = function (width, crossingWidth, Height) {
	// QUCS technical manual, Microstrip cross, eqs. 11.228 and 11.229.
	var widthOverHeight = width / Height;
	var crossingOverHeight = crossingWidth / Height;
	var Y = 165.6 * crossingOverHeight + 31.2 * Math.sqrt(crossingOverHeight) - 11.8 * square$1(crossingOverHeight);
	return 1e-9 * Height *
		(Y * widthOverHeight - 32 * crossingOverHeight + 3) *
		widthOverHeight ** -1.5;
};

var centerInductance = function (horizontalWidth, verticalWidth, Height) {
	// QUCS technical manual, Microstrip cross, eq. 11.230 with the 0.8 correction noted there.
	var horizontalOverHeight = horizontalWidth / Height;
	var verticalOverHeight = verticalWidth / Height;
	var L = 1e-9 * Height *
		(5 * verticalOverHeight * Math.cos(pi$4 / 2 * (1.5 - horizontalOverHeight)) -
		(1 + 7 / horizontalOverHeight) / verticalOverHeight -
		337.5);
	return 0.8 * L;
};

function mcross({
	leftWidth = 0.023 * INCH_TO_METER,
	topWidth = 0.023 * INCH_TO_METER,
	rightWidth = 0.023 * INCH_TO_METER,
	bottomWidth = 0.023 * INCH_TO_METER,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	rho = 1,
	tand = 0.001,
	roughnessRms = 0
} = {}) {
	var cross = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var widths = [leftWidth, topWidth, rightWidth, bottomWidth];
	var arms = widths.map(function (width) { return microstripLine$1(width, Height, Thickness, er); });
	var sparsArray = [];
	var analysis = [];
	var horizontalWidth = 0.5 * (leftWidth + rightWidth);
	var verticalWidth = 0.5 * (topWidth + bottomWidth);
	var armCaps = [
		armCapacitance(leftWidth, verticalWidth, Height, Thickness, er),
		armCapacitance(topWidth, horizontalWidth, Height, Thickness, er),
		armCapacitance(rightWidth, verticalWidth, Height, Thickness, er),
		armCapacitance(bottomWidth, horizontalWidth, Height, Thickness, er)
	];
	var armInds = [
		armInductance(leftWidth, verticalWidth, Height),
		armInductance(topWidth, horizontalWidth, Height),
		armInductance(rightWidth, verticalWidth, Height),
		armInductance(bottomWidth, horizontalWidth, Height)
	];
	var Lcenter = centerInductance(horizontalWidth, verticalWidth, Height);
	var Ct = armCaps.reduce(function (sum, cap) { return sum + cap; }, 0);

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var freq = frequencyList[freqCount];
		var omega = 2 * pi$4 * freq;
		var Y = emptyCplxMatrix(6);

		stampAdmittance(Y, 0, 4, complex(0, -1 / (omega * armInds[0])));
		stampAdmittance(Y, 1, 5, complex(0, -1 / (omega * armInds[1])));
		stampAdmittance(Y, 2, 4, complex(0, -1 / (omega * armInds[2])));
		stampAdmittance(Y, 3, 5, complex(0, -1 / (omega * armInds[3])));
		stampAdmittance(Y, 4, 5, complex(0, -1 / (omega * Lcenter)));

		for (var i = 0; i < arms.length; i++) {
			stampAdmittance(Y, i, null, complex(0, omega * armCaps[i]));
		}

		var externalY = reducedExternalY(Y);
		var S = yToS(externalY, Ro);
		var row = [freq];
		for (var sRow = 0; sRow < 4; sRow++) {
			for (var sCol = 0; sCol < 4; sCol++) {
				row.push(S.m[sRow][sCol]);
			}
		}

		sparsArray[freqCount] = row;
		analysis[freqCount] = {
			frequency: freq,
			armCaps: armCaps.slice(),
			armInds: armInds.slice(),
			Lcenter: Lcenter,
			Ct: Ct,
			Y: externalY.m
		};
	}

	cross.setspars(sparsArray);
	cross.setglobal(global);
	cross.Ct = Ct;
	cross.microstrip = {
		leftWidth,
		topWidth,
		rightWidth,
		bottomWidth,
		Height,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		leftArm: arms[0],
		topArm: arms[1],
		rightArm: arms[2],
		bottomArm: arms[3],
		armCaps,
		armInds,
		Lcenter,
		Ct,
		source: 'QUCS microstrip cross equations 11.226 through 11.231; Edwards/Steer section 9.6.3 captures cross-junction equivalent-circuit shape and warns that theory/experiment agreement is weak, especially for inductance parameters.',
		validity: {
			modelFamily: 'First-order cross-junction equivalent circuit with arm capacitances, arm inductances, and center inductance.',
			limitations: 'Edwards/Steer describe practical asymmetric crosses as important and note weak theory/experiment agreement. Treat asymmetric width behavior as engineering approximation until benchmarked.'
		},
		analysis
	};
	return cross;
}

// Modified: 2026-07-08

var pi$3 = Math.PI;

var square = function (x) { return x * x; };
var cube = function (x) { return x * x * x; };
var fourth = function (x) { return x * x * x * x; };

var hammerstadAB = function (u, er) {
	var u2 = square(u);
	var u3 = cube(u);
	var u4 = fourth(u);
	var a = 1 + Math.log((u4 + u2 / 2704) / (u4 + 0.432)) / 49 + Math.log(1 + u3 / 5929.741) / 18.7;
	var b = 0.564 * ((er - 0.9) / (er + 3)) ** 0.053;
	return {a, b};
};

var hammerstadEr = function (u, er) {
	var ab = hammerstadAB(u, er);
	return (er + 1) / 2 + (er - 1) / 2 * (1 + 10 / u) ** (-ab.a * ab.b);
};

var homogeneousZ0 = function (u) {
	var f = 6 + (2 * pi$3 - 6) * Math.exp(-((30.666 / u) ** 0.7528));
	return (VACUUM_IMPEDANCE / (2 * pi$3)) * Math.log(f / u + Math.sqrt(1 + 4 / square(u)));
};

var deltaUThicknessSingle = function (u, thicknessOverHeight) {
	if (thicknessOverHeight <= 0.0) {
		return 0.0;
	}

	return (1.25 * thicknessOverHeight / pi$3) *
		(1 + Math.log((2 + (4 * pi$3 * u - 2) / (1 + Math.exp(-100 * (u - 1 / (2 * pi$3))))) / thicknessOverHeight));
};

var microstripLine = function (width, Height, Thickness, er) {
	var u = width / Height;
	var effectiveU = u + deltaUThicknessSingle(u, Thickness / Height);
	var ere = hammerstadEr(effectiveU, er);
	var Z = homogeneousZ0(effectiveU) / Math.sqrt(ere);

	return {
		width: width,
		u: u,
		effectiveU: effectiveU,
		ere: ere,
		Z: Z,
		lineInductancePerMeter: Z * Math.sqrt(ere) / C0
	};
};

var identityCplx$1 = function (size) {
	var out = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			out[row][col] = row === col ? complex(1, 0) : complex(0, 0);
		}
	}
	return matrix(out);
};

var zToS$1 = function (Z, Ro) {
	var size = Z.m.length;
	var I = identityCplx$1(size);
	var normalizedZ = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			normalizedZ[row][col] = Z.m[row][col].div(complex(Ro, 0));
		}
	}
	var z = matrix(normalizedZ);
	return z.subCplx(I).mulCplx(z.addCplx(I).invertCplx());
};

var stepCapacitance = function (wideWidth, narrowWidth, er) {
	var ratio = wideWidth / narrowWidth;
	var capacitancePerRootWidth;
	var equation;
	var validity;

	if (Math.abs(er - 9.6) < 1e-12 && ratio >= 3.5 && ratio <= 10) {
		// Edwards/Steer, Foundations for Microstrip Circuit Design, eq. 9.33.
		capacitancePerRootWidth = 130 * Math.log10(ratio) - 44;
		equation = 'Edwards/Steer 9.33, Garg/Bahl large step capacitance';
		validity = 'er = 9.6, 3.5 <= max(width1,width2) / min(width1,width2) <= 10';
	} else {
		// Edwards/Steer, Foundations for Microstrip Circuit Design, eq. 9.32.
		// Also matches QUCS technical manual, Microstrip impedance step, eq. 11.202.
		var logEr = Math.log10(er);
		capacitancePerRootWidth = (10.1 * logEr + 2.33) * ratio - 12.6 * logEr - 3.17;
		equation = 'Edwards/Steer 9.32, Garg/Bahl slight step capacitance';
		validity = 'er <= 10, 1.5 <= max(width1,width2) / min(width1,width2) <= 3.5';
	}

	return {
		valuePf: Math.sqrt(wideWidth * narrowWidth) * capacitancePerRootWidth,
		capacitancePerRootWidth,
		equation,
		validity
	};
};

var stepInductanceNh = function (wideWidth, narrowWidth, Height) {
	// Edwards/Steer, Foundations for Microstrip Circuit Design, eq. 9.34.
	// Also matches QUCS technical manual, Microstrip impedance step, eq. 11.206.
	var ratio = wideWidth / narrowWidth;
	var ratioMinusOne = ratio - 1;
	return Height * (ratioMinusOne * (40.5 + 0.2 * ratioMinusOne) - 75 * Math.log10(ratio));
};

function mstep({
	width1 = 0.046 * INCH_TO_METER,
	width2 = 0.023 * INCH_TO_METER,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	rho = 1,
	tand = 0.001,
	roughnessRms = 0
} = {}) {
	var step = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var port1Line = microstripLine(width1, Height, Thickness, er);
	var port2Line = microstripLine(width2, Height, Thickness, er);
	var wideWidth = Math.max(width1, width2);
	var narrowWidth = Math.min(width1, width2);
	var capacitance = stepCapacitance(wideWidth, narrowWidth, er);
	var CsPf = capacitance.valuePf;
	var LsNh = stepInductanceNh(wideWidth, narrowWidth, Height);
	var lineInductanceSum = port1Line.lineInductancePerMeter + port2Line.lineInductancePerMeter;
	var L1Nh = LsNh * port1Line.lineInductancePerMeter / lineInductanceSum;
	var L2Nh = LsNh * port2Line.lineInductancePerMeter / lineInductanceSum;
	var sparsArray = [];
	var analysis = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var z21 = complex(0, -1 / (2 * pi$3 * frequency * CsPf * 1e-12));
		var z11 = complex(0, 2 * pi$3 * frequency * L1Nh * 1e-9).add(z21);
		var z22 = complex(0, 2 * pi$3 * frequency * L2Nh * 1e-9).add(z21);
		var Z = matrix([
			[z11, z21],
			[z21, z22]
		]);
		var S = zToS$1(Z, Ro);

		sparsArray[freqCount] = [frequency, S.m[0][0], S.m[0][1], S.m[1][0], S.m[1][1]];
		analysis[freqCount] = {
			frequency,
			CsPf,
			LsNh,
			L1Nh,
			L2Nh,
			Z: Z.m
		};
	}

	step.setspars(sparsArray);
	step.setglobal(global);
	step.microstrip = {
		width1,
		width2,
		Height,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		port1Line,
		port2Line,
		CsPf,
		capacitancePerRootWidth: capacitance.capacitancePerRootWidth,
		capacitanceEquation: capacitance.equation,
		LsNh,
		L1Nh,
		L2Nh,
		validity: {
			capacitanceRatio: capacitance.validity,
			inductanceRatio: 'max(width1,width2) / min(width1,width2) <= 5, best stated for narrowWidth / Height = 1',
			source: 'Edwards/Steer section 9.4, equations 9.28 through 9.35; QUCS node80 equivalent equations 11.202 through 11.206'
		},
		analysis
	};
	return step;
}

// Modified: 2026-07-02

var pi$2 = Math.PI;

var identityCplx = function (size) {
	var out = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			out[row][col] = row === col ? complex(1, 0) : complex(0, 0);
		}
	}
	return matrix(out);
};

var zToS = function (Z, Ro) {
	var size = Z.m.length;
	var I = identityCplx(size);
	var normalizedZ = dim(size, size, complex(0, 0));
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			normalizedZ[row][col] = Z.m[row][col].div(complex(Ro, 0));
		}
	}
	var z = matrix(normalizedZ);
	return z.subCplx(I).mulCplx(z.addCplx(I).invertCplx());
};

var edwardsSteerBend = function (Width, Height, er) {
	// Edwards/Steer, Foundations for Microstrip Circuit Design, 2016, eqs. 9.24 through 9.26.
	var widthOverHeight = Width / Height;
	var capacitancePerWidth = widthOverHeight < 1
		? ((14 * er + 12.5) * widthOverHeight - (1.83 * er - 2.25)) / Math.sqrt(widthOverHeight)
		: (9.5 * er + 1.25) * widthOverHeight + 5.2 * er + 7.0;

	return {
		CpF: Width * capacitancePerWidth,
		LnH: Height * 100 * (4 * Math.sqrt(widthOverHeight) - 4.21)
	};
};

function mbend({
	Width = 0.023 * INCH_TO_METER,
	miterLength,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	rho = 1,
	tand = 0.001,
	roughnessRms = 0
} = {}) {
	var bend = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var recommendedMiterFraction = 0.6;
	var defaultMiterLength = 0;
	var actualMiterLength = miterLength === undefined ? defaultMiterLength : miterLength;
	var miterFraction = actualMiterLength / (Math.SQRT2 * Width);
	var equivalent = edwardsSteerBend(Width, Height, er);
	var CpF = equivalent.CpF;
	var LnH = equivalent.LnH;
	var sparsArray = [];
	var analysis = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var z21 = complex(0, -1 / (2 * pi$2 * frequency * CpF * 1e-12));
		var z11 = complex(0, 2 * pi$2 * frequency * LnH * 1e-9).add(z21);
		var Z = matrix([
			[z11, z21],
			[z21, z11]
		]);
		var S = zToS(Z, Ro);

		sparsArray[freqCount] = [frequency, S.m[0][0], S.m[0][1], S.m[1][0], S.m[1][1]];
		analysis[freqCount] = {
			frequency,
			CpF,
			LnH,
			Z: Z.m
		};
	}

	bend.setspars(sparsArray);
	bend.setglobal(global);
	bend.microstrip = {
		Width,
		miterLength: actualMiterLength,
		defaultMiterLength,
		recommendedMiterFraction,
		recommendedMiterLength: recommendedMiterFraction * Math.SQRT2 * Width,
		miterFraction,
		Height,
		Thickness,
		er,
		rho,
		tand,
		roughnessRms,
		CpF,
		LnH,
		equivalent,
		validity: {
			capacitance: '2.5 <= er <= 15 and 0.1 <= Width / Height <= 5.0',
			inductance: 'best stated for 0.5 <= Width / Height <= 2.0',
			miter: 'Edwards/Steer recommend chamfer fraction near 0.6 for many alumina-like cases; current C/L equations are for the unmitered bend.'
		},
		analysis
	};
	return bend;
}

// Modified: 2026-07-03

function mtfr({
	ohmsPerSquare = 50,
	Width = 10 * MIL_TO_METER,
	Length = 10 * MIL_TO_METER,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	er = 10,
	tand = 0.001,
	temperatureCoefficient = 0,
	temperatureReference = 25,
	sections
} = {}) {
	var Temp = global.Temp;
	var squares = Length / Width;
	var resistanceAtReference = ohmsPerSquare * squares;
	var resistance = resistanceAtReference * (1 + temperatureCoefficient * (Temp - temperatureReference));
	var automaticSections = Math.min(200, Math.max(10, Math.ceil(squares * 10)));
	var sectionCount = sections === undefined ? automaticSections : Math.max(1, Math.floor(sections));
	var resistancePerSection = resistance / sectionCount;
	var halfLineLength = Length / (2 * sectionCount);
	var halfLine = mlin(Width, Height, halfLineLength, Thickness, er, 0, tand, 0);
	var resistorSection = R(resistancePerSection);
	var nPorts = [];

	for (var section = 0; section < sectionCount; section++) {
		nPorts.push(halfLine);
		nPorts.push(resistorSection);
		nPorts.push(halfLine);
	}

	var filmResistor = cascade(...nPorts);
	filmResistor.filmResistor = {
		ohmsPerSquare,
		Width,
		Length,
		Height,
		Thickness,
		er,
		tand,
		squares,
		resistanceAtReference,
		resistance,
		sections: sectionCount,
		automaticSections,
		resistancePerSection,
		halfLineLength,
		temperatureCoefficient,
		temperatureReference,
		temperature: Temp,
		model: 'distributed film resistor: cascaded mlin half-sections with sheet-resistance sections'
	};
	return filmResistor;
}

// Modified: 2026-07-02

var pi$1 = Math.PI;

var viaInductance$1 = function (Height, radius) {
	// QUCS technical manual, Microstrip via hole, Goldfarb/Pucel model, eq. 11.232.
	var a = Math.sqrt(radius * radius + Height * Height);
	return (MU0 / (2 * pi$1)) *
		(Height * Math.log((Height + a) / radius) + 1.5 * (radius - a));
};

var viaResistanceDc$1 = function (Height, radius, Thickness, rho) {
	var innerRadius = Math.max(radius - Thickness, 0);
	var metalArea = pi$1 * (radius * radius - innerRadius * innerRadius);
	return rho * Height / metalArea;
};

function mvgnd({
	Diameter = 100e-6,
	Height = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	rho = COPPER_RESISTIVITY
} = {}) {
	var via = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var radius = Diameter / 2;
	var L = viaInductance$1(Height, radius);
	var Rdc = viaResistanceDc$1(Height, radius, Thickness, rho);
	// QUCS technical manual, Microstrip via hole, eqs. 11.233 and 11.234.
	var fdelta = rho / (pi$1 * MU0 * Thickness * Thickness);
	var sparsArray = [];
	var analysis = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var R = Rdc * Math.sqrt(1 + frequency / fdelta);
		var Z = complex(R, 2 * pi$1 * frequency * L);
		var s11 = Z.sub(complex(Ro, 0)).div(Z.add(complex(Ro, 0)));
		sparsArray[freqCount] = [frequency, s11];
		analysis[freqCount] = {
			frequency,
			R,
			X: 2 * pi$1 * frequency * L,
			Z
		};
	}

	via.setspars(sparsArray);
	via.setglobal(global);
	via.microstrip = {
		Diameter,
		radius,
		Height,
		Thickness,
		rho,
		Rdc,
		L,
		fdelta,
		validity: 'Goldfarb/Pucel via model stated for Height < 0.03 * lambda0',
		analysis
	};
	return via;
}

// Modified: 2026-07-02

var pi = Math.PI;

var viaInductance = function (Height, radius) {
	// QUCS technical manual, Microstrip via hole, Goldfarb/Pucel model, eq. 11.232.
	var a = Math.sqrt(radius * radius + Height * Height);
	return (MU0 / (2 * pi)) *
		(Height * Math.log((Height + a) / radius) + 1.5 * (radius - a));
};

var viaResistanceDc = function (Height, radius, Thickness, rho) {
	var innerRadius = Math.max(radius - Thickness, 0);
	var metalArea = pi * (radius * radius - innerRadius * innerRadius);
	return rho * Height / metalArea;
};

var annularCapacitance = function (padDiameter, antipadDiameter, Height, er) {
	if (padDiameter <= 0 || antipadDiameter <= padDiameter || Height <= 0) {
		return 0;
	}
	var padRadius = padDiameter / 2;
	var antipadRadius = antipadDiameter / 2;
	return 2 * pi * EPSILON0 * er * Height / Math.log(antipadRadius / padRadius);
};

var shunt = function (Y) {
	return {
		A: complex(1, 0),
		B: complex(0, 0),
		C: Y,
		D: complex(1, 0)
	};
};

var series = function (Z) {
	return {
		A: complex(1, 0),
		B: Z,
		C: complex(0, 0),
		D: complex(1, 0)
	};
};

var multiplyAbcd = function (left, right) {
	return {
		A: left.A.mul(right.A).add(left.B.mul(right.C)),
		B: left.A.mul(right.B).add(left.B.mul(right.D)),
		C: left.C.mul(right.A).add(left.D.mul(right.C)),
		D: left.C.mul(right.B).add(left.D.mul(right.D))
	};
};

var abcdToS = function (abcd, Ro) {
	var A = abcd.A, B = abcd.B, C = abcd.C, D = abcd.D;
	var Bnorm = B.div(complex(Ro, 0));
	var Cnorm = C.mul(complex(Ro, 0));
	var denominator = A.add(Bnorm).add(Cnorm).add(D);
	var s11 = A.add(Bnorm).sub(Cnorm).sub(D).div(denominator);
	var s21 = complex(2, 0).div(denominator);
	var s12 = complex(2, 0).mul(A.mul(D).sub(B.mul(C))).div(denominator);
	var s22 = D.add(Bnorm).sub(Cnorm).sub(A).div(denominator);
	return {s11, s12, s21, s22};
};

function mvia({
	Diameter = 100e-6,
	connectionHeight = 0.025 * INCH_TO_METER,
	Thickness = 0.0000125 * INCH_TO_METER,
	rho = COPPER_RESISTIVITY,
	er = 10,
	padDiameter = 0,
	antipadDiameter = 0,
	topPadHeight = 0,
	bottomPadHeight = 0,
	topStubLength = 0,
	bottomStubLength = 0
} = {}) {
	var via = new nPort;
	var frequencyList = global.fList, Ro = global.Ro;
	var radius = Diameter / 2;
	var Lbarrel = viaInductance(connectionHeight, radius);
	var Rdc = viaResistanceDc(connectionHeight, radius, Thickness, rho);
	// QUCS technical manual, Microstrip via hole, eqs. 11.233 and 11.234.
	var fdelta = rho / (pi * MU0 * Thickness * Thickness);
	var topPadCapacitance = annularCapacitance(padDiameter, antipadDiameter, topPadHeight, er);
	var bottomPadCapacitance = annularCapacitance(padDiameter, antipadDiameter, bottomPadHeight, er);
	var topStubCapacitance = topStubLength > 0 ? annularCapacitance(Diameter, antipadDiameter || 2 * Diameter, topStubLength, er) : 0;
	var bottomStubCapacitance = bottomStubLength > 0 ? annularCapacitance(Diameter, antipadDiameter || 2 * Diameter, bottomStubLength, er) : 0;
	var sparsArray = [];
	var analysis = [];

	for (var freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		var frequency = frequencyList[freqCount];
		var omega = 2 * pi * frequency;
		var R = Rdc * Math.sqrt(1 + frequency / fdelta);
		var X = omega * Lbarrel;
		var Zbarrel = complex(R, X);
		var Yin = complex(0, omega * (topPadCapacitance + topStubCapacitance));
		var Yout = complex(0, omega * (bottomPadCapacitance + bottomStubCapacitance));
		var network = multiplyAbcd(multiplyAbcd(shunt(Yin), series(Zbarrel)), shunt(Yout));
		var S = abcdToS(network, Ro);

		sparsArray[freqCount] = [frequency, S.s11, S.s12, S.s21, S.s22];
		analysis[freqCount] = {
			frequency,
			R,
			X,
			Zbarrel,
			Yin,
			Yout
		};
	}

	via.setspars(sparsArray);
	via.setglobal(global);
	via.microstrip = {
		Diameter,
		radius,
		connectionHeight,
		Thickness,
		rho,
		er,
		padDiameter,
		antipadDiameter,
		topPadHeight,
		bottomPadHeight,
		topStubLength,
		bottomStubLength,
		Rdc,
		Lbarrel,
		fdelta,
		topPadCapacitance,
		bottomPadCapacitance,
		topStubCapacitance,
		bottomStubCapacitance,
		model: 'two-port via barrel with optional pad/antipad and unused-stub shunt capacitance',
		validity: 'Barrel R/L follows the Goldfarb/Pucel via model; pad and stub capacitances are first-order coaxial approximations.',
		analysis
	};
	return via;
}

// Modified: 2026-07-09

const Q = 1.602176634e-19;
const K = 1.380649e-23;

function thermalVoltage(temperatureK) {
	return K * temperatureK / Q;
}

function normalizeOptions(options) {
	return {
		is: options.is ?? 2.75e-11,
		n: options.n ?? 2,
		rs: options.rs ?? 0.568,
		cj0: options.cj0 ?? 4e-12,
		vj: options.vj ?? 0.75,
		m: options.m ?? 0.5,
		tt: options.tt ?? 4e-9,
		leakageResistance: options.leakageResistance ?? 4e9,
		breakdownVoltage: options.breakdownVoltage ?? 100,
		breakdownCurrent: options.breakdownCurrent ?? 100e-6,
		breakdownSoftness: options.breakdownSoftness ?? 2,
		biasVoltage: options.biasVoltage ?? 0,
		temperatureK: options.temperatureK ?? global.Temp,
		ivStart: options.ivStart ?? -110,
		ivStop: options.ivStop ?? 1,
		ivPoints: options.ivPoints ?? 401
	};
}

function junctionCapacitance(voltage, cj0, vj, m) {
	if (voltage < vj) {
		return cj0 / Math.pow(1 - voltage / vj, m);
	}

	return cj0 / Math.pow(1e-12, m);
}

function breakdownCurrent(junctionVoltage, p) {
	var excessVoltage = Math.max(-junctionVoltage - p.breakdownVoltage, 0);

	return -p.breakdownCurrent * (Math.exp(excessVoltage / p.breakdownSoftness) - 1);
}

function breakdownConductance(junctionVoltage, p) {
	if (-junctionVoltage <= p.breakdownVoltage) {
		return 0;
	}

	return p.breakdownCurrent * Math.exp((-junctionVoltage - p.breakdownVoltage) / p.breakdownSoftness) / p.breakdownSoftness;
}

function diodeCurrentAtVoltage(voltage, p) {
	var vt = thermalVoltage(p.temperatureK);
	var current = voltage >= 0 ? voltage / Math.max(p.rs + p.n * vt / p.is, 1) : -p.is;
	var iteration;
	var limitedExp;
	var junctionVoltage;
	var expTerm;
	var f;
	var df;
	var next;
	var avalancheCurrent;
	var avalancheConductance;

	for (iteration = 0; iteration < 60; iteration++) {
		junctionVoltage = voltage - current * p.rs;
		limitedExp = Math.min(junctionVoltage / (p.n * vt), 80);
		expTerm = Math.exp(limitedExp);
		avalancheCurrent = breakdownCurrent(junctionVoltage, p);
		avalancheConductance = breakdownConductance(junctionVoltage, p);
		f = current - p.is * (expTerm - 1) - junctionVoltage / p.leakageResistance - avalancheCurrent;
		df = 1 + p.rs * p.is * expTerm / (p.n * vt) + p.rs / p.leakageResistance + p.rs * avalancheConductance;
		next = current - f / df;

		if (Math.abs(next - current) <= Math.max(1e-15, Math.abs(next) * 1e-12)) {
			return next;
		}

		current = next;
	}

	return current;
}

function diodeAdmittanceAtBias(p) {
	var vt = thermalVoltage(p.temperatureK);
	var current = diodeCurrentAtVoltage(p.biasVoltage, p);
	var junctionVoltage = p.biasVoltage - current * p.rs;
	var limitedExp = Math.min(junctionVoltage / (p.n * vt), 80);
	var conductance = p.is * Math.exp(limitedExp) / (p.n * vt) + 1 / p.leakageResistance + breakdownConductance(junctionVoltage, p);

	return {
		current,
		junctionVoltage,
		conductance,
		resistance: conductance > 0 ? 1 / conductance : Number.POSITIVE_INFINITY
	};
}

function seriesTwoPortFromImpedance(frequency, impedance, ro) {
	complex(ro, 0);
	var twoZo = complex(2 * ro, 0);
	var denominator = impedance.add(twoZo);
	var s11 = impedance.div(denominator);
	var s21 = twoZo.div(denominator);

	return [frequency, s11, s21, s21, s11];
}

function diode1N4148(options = {}) {
	var p = normalizeOptions(options);
	var diodePort = new nPort();
	var frequencyList = global.fList;
	var ro = global.Ro;
	var dc = diodeAdmittanceAtBias(p);
	var cj = junctionCapacitance(dc.junctionVoltage, p.cj0, p.vj, p.m);
	var diffusionCapacitance = p.tt * dc.conductance;
	var capacitance = cj + diffusionCapacitance;
	var sparsArray = [];
	var freqCount;
	var frequency;
	var omega;
	var admittance;
	var junctionImpedance;
	var totalImpedance;

	for (freqCount = 0; freqCount < frequencyList.length; freqCount++) {
		frequency = frequencyList[freqCount];
		omega = 2 * Math.PI * frequency;
		admittance = complex(dc.conductance, omega * capacitance);
		junctionImpedance = admittance.inv();
		totalImpedance = complex(p.rs, 0).add(junctionImpedance);
		sparsArray[freqCount] = seriesTwoPortFromImpedance(frequency, totalImpedance, ro);
	}

	diodePort.setspars(sparsArray);
	diodePort.setglobal(global);
	diodePort.diode = {
		partNumber: '1N4148',
		model: 'small-signal RF series diode with Shockley DC I-V',
		source: 'Vishay 1N4148 Rev. 1.6, 07-Nov-2024; onsemi 1N91x, 1N4x48 Rev. 6, September 2024',
		parameters: p,
		bias: {
			voltage: p.biasVoltage,
			current: dc.current,
			junctionVoltage: dc.junctionVoltage,
			dynamicResistance: dc.resistance,
			junctionCapacitance: cj,
			diffusionCapacitance,
			totalCapacitance: capacitance
		},
		datasheetAnchors: {
			forwardVoltage: 'VF <= 1 V at IF = 10 mA',
			capacitance: 'CD/CT = 4 pF at VR = 0 V, f = 1 MHz',
			reverseRecovery: 'trr = 4 ns under listed switching test',
			reverseLeakage: 'IR = 25 nA at VR = 20 V; IR = 5 uA at VR = 75 V',
			breakdownVoltage: 'VBR >= 100 V at IR = 100 uA'
		}
	};
	diodePort.ivTable = function ivTable(start = p.ivStart, stop = p.ivStop, points = p.ivPoints) {
		var table = [['vD', 'iD']];
		var step = points > 1 ? (stop - start) / (points - 1) : 0;
		var index;
		var voltage;

		for (index = 0; index < points; index++) {
			voltage = start + step * index;
			table.push([voltage, diodeCurrentAtVoltage(voltage, p)]);
		}

		return table;
	};

	return diodePort;
}

export { C, L, Load, Open, R, Shift90, Short, Tclin, Tee, Tee4, Tee5, Tlin, cascade, chebyLPLCs, chebyLPNsec, chebyLPgk, complex, dim, diode1N4148, dup, global, lineChart, lineTable, log, lpfGen, matrix, mbend, mclin, mcross, mlin, mstep, mtee, mtfr, mvgnd, mvia, nodal, paC, paL, paPaLC, paPaRC, paPaRL, paPaRLC, paR, paSeLC, paSeRC, paSeRL, paSeRLC, seC, seL, sePaLC, sePaRC, sePaRL, sePaRLC, seR, seSeLC, seSeRC, seSeRL, seSeRLC, smithChart, trf, trf4Port, version };
