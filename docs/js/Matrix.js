// A  Class to represent matrixes and matrix operations
// Requires complex.js
//
// Jerry Wiltz 11/25/16
//

function Matrix(array) {
  this.array = array;
}

Array.createMxNxInitial = function (M, N, Initial) {
  var A = new Array(M);
    for(var row = 0; row < M; row++) {
      A[row] = new Array(N);
    }
    for(var row = 0; row < M; row++) {
      for(var col = 0; col < N; col++) { 
        A[row][col] = Initial;
      }
    }
    return A;
}

Matrix.prototype.createMxNcplx = function (M, N) {
  var A = new Array(M);
    for(var row = 0; row < M; row++) {
      A[row] = new Array(N);
    }
    for(var row = 0; row < M; row++) {
      for(var col = 0; col < N; col++) { 
        A[row][col] = new Complex(75,0);
      }
    }
  this.array = A
  return this.array;
}

Matrix.prototype.out = function () {
  //return this.argument;
  //return this.array[5];
  //return this.array[0][0].getR();
  //return this.array[0].getI();  
  return this.array[2][4];
}

Matrix.prototype.gaussFwdBkElimination = function() {
  var A = this.array;
  var numRows = A.length;
  var numCols = A[0].length;
// real variable forward Elimination routine  
  for(var constRow = 0; constRow < numRows; constRow++) { // this row stays the same
    for(var row = constRow+1; row < numRows; row++) { // this row moves down
      var a = -A[row][constRow]/A[constRow][constRow]; // this computes "a"
        for(var col = constRow; col < numCols; col++) { // this sweeps across the columns
          A[row][col] = A[row][col] + a*A[constRow][col];
        }
      }
    }     
// real back substitution routine      
  for(var row = numRows -1; row > -1; row--) {
    var accum = 0;
      for(var col = numRows -1; col > row; col--) {
        accum = accum + A[row][col]*A[col][numCols -1];
      }
    A[row][numCols -1] = (1/A[row][row]) * (A[row][numCols -1] - accum);
  }
  //return new Matrix(A);
  return this.array;
}
/*
Complex.prototype.sub = function(a) {
  return new Complex(this.x - a.x, this.y - a.y);
}
*/ 
Matrix.prototype.sub = function(Matrix) {
  var A = this.array;
  
  //var B = new Array();
  var numRows = A.length;
  var numCols = A[0].length;          
  for(var row = 0; row < numRows; row++) {
    for(var col = 0; col < numCols; col++) {
       //B[row][col] = A[row][col] - Matrix[row][col];
    A[row][col] = this.array[row][col];
    }
  }

  //return new Matrix(B);
  return new Matrix (array);
}
    
    
    
