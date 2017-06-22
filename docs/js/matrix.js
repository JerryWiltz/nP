// A  Class to represent matrixes and matrix operations
// Requires complex.js
//
// Jerry Wiltz 11/25/16
//

function dimMatrix(rowN, colN, Initial) { //this works
  var A = new Array(rowN);
    for(var row = 0; row < rowN; row++) {
      A[row] = new Array(colN);
    }
    for(var row = 0; row < rowN; row++) {
      for(var col = 0; col < colN; col++) { 
        A[row][col] = Initial;
      }
    }
    return A;
}

function gaussFwdBkElimination(Matrix) { //this works
  var A = Matrix;
  var numRows = A.length;
  var numCols = A[0].length;
// Real variable forward Elimination routine  
  for(var constRow = 0; constRow < numRows; constRow++) { // this row stays the same
    for(var row = constRow+1; row < numRows; row++) { // this row moves down
      var a = -A[row][constRow]/A[constRow][constRow]; // this computes "a"
        for(var col = constRow; col < numCols; col++) { // this sweeps across the columns
          A[row][col] = A[row][col] + a*A[constRow][col];
        }
      }
    }     
// Real back substitution routine      
  for(var row = numRows -1; row > -1; row--) {
    var accum = 0;
      for(var col = numRows -1; col > row; col--) {
        accum = accum + A[row][col]*A[col][numCols -1];
      }
    A[row][numCols -1] = (1/A[row][row]) * (A[row][numCols -1] - accum);
  }
  return A;
}

function gaussFwdBkEliminationCmplx(Matrix) { // this works 12/9/16
  var A = Matrix;
  var a = new Complex(0,0);
  var numRows = A.length;
  var numCols = A[0].length;
// Complex variable forward Elimination routine
    for(var constRow = 0; constRow < numRows; constRow++) { // this row stays the same
      for(var row = constRow+1; row < numRows; row++) { // this row moves down
        a = A[row][constRow].div(A[constRow][constRow]).neg();
          for(var col = constRow; col < numCols; col++) { // this sweeps across the columns
            A[row][col] = A[row][col].add(   a.mul(A[constRow][col]));
            a.x += a.x;
			
        }
      }
    }
	console.log(a.x);
// Complex back substitution routine
/*      
  for(var row = numRows -1; row > -1; row--) {
    //var accum = 0;
    var accum = new Complex(0,0);
      for(var col = numRows -1; col > row; col--) { 
        accum = accum.add(  A[row][col].mul( A[col][numCols -1]));
      }
    A[row][numCols -1] =  (    new Complex(1,0)      ).div(A[row][row]).mul( A[row][numCols -1].sub (accum));          
  }
 */
  return A;
}      
    
function subMatrix (MatrixA, MatrixB) { //this works
  var A = MatrixA;
  var numRows = A.length;
  var numCols = A[0].length;          
  for(var row = 0; row < numRows; row++) {
    for(var col = 0; col < numCols; col++) {
       //B[row][col] = A[row][col] - Matrix[row][col];
    A[row][col] = A[row][col] - MatrixB[row][col];
    }
  }
  return A;
}

function printRealPartComplexMatrix(matrix) {
	var out = "";
	for(var row = 0; row < matrix.length ; row++) {
		for( var col = 0; col < matrix[0].length; col++) {
		out += matrix[row][col].getR().toFixed(3) + ( !(col === (matrix[0].length-1)) ? "_____" : "<br>"); // Adds line break between each component		
		}
	}
	document.write(out + "<br>");
}
