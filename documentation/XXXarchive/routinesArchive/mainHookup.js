//
// This is the Main program, MainHookup.js
//
//

one = new Complex(1,0);
zero = Complex(0,0);


document.write("<br>");
document.write("Block 6 defines a low pass filter network (Uses gaussFwdBkEliminationCmplx matrix solver)." + "<br>");
var C2 = new Nport(); 
var L2 = new Nport();  
var C3 = new Nport();  
  
//for(var freq = 100; freq < 10000; freq = freq + 50) { // begin frequency loop  

var freq = 100;

C2.shuntCspars(3.3e-12, freq); //3.2836374930057163e-12
var C2S11 = C2.getSpars()[0].neg();
var C2S21 = C2.getSpars()[1].neg();
//document.write(C2.getSpars()[1].mag() + "<br>");

L2.seriesLspars(9.1e-9, freq); //9.130721710870328e-9
var L2S11 = L2.getSpars()[0].neg();
var L2S21 = L2.getSpars()[1].neg();
  
C3.shuntCspars(3.3e-12, freq); //3.2836374930057163e-12
var C3S11 = C3.getSpars()[0].neg();
var C3S21 = C3.getSpars()[1].neg();
  
// the miracle occurs right here ...
var D = dimMatrix(8, 8 + 1, new Complex(0,0)); // form the array
var offset = 0;                                          
for( var row = offset; row < 2 + offset; row++ ) {
  for( var col = offset; col < 2 + offset; col++) { 
  D[row][col] = C2.getSpars()[(2**row -1) + row + col];
  }
}

var offset = 2;                                          
for( var row = offset; row < 2 + offset; row++ ) {
  for( var col = offset; col < 2 + offset; col++) { 
  D[row][col] = L2.getSpars()[(2**row -1 ) + row + col - 3* offset];
  }
}

document.write(D[0][0].mag() + "<br>");
document.write(D[1][0].mag() + "<br>");
document.write(D[2][2].mag() + "<br>");
document.write(D[3][2].mag() + "<br>");

/*  
//            0      1      2      3      4      5     6     7     8 
var C = [[C2S11, C2S21,  zero,  zero,  zero,  zero, zero,  one, zero], //0
         [C2S21, C2S11,   one,  zero,  zero,  zero, zero, zero, zero], //1
         [ zero,   one, L2S11, L2S21,  zero,  zero, zero, zero, zero], //2
         [ zero,  zero, L2S21, L2S11,   one,  zero, zero, zero, zero], //3
         [ zero,  zero,  zero,   one, C3S11, C3S21, zero, zero, zero], //4
         [ zero,  zero,  zero,  zero, C3S21, C3S11,  one, zero, zero], //5
         [ zero,  zero,  zero,  zero,  zero,   one, zero, zero,  one], //6  [6][8] is S11
         [  one,  zero,  zero,  zero,  zero,  zero, zero, zero, zero]];//7  [7][8] is S21

var OutMatrixC = gaussFwdBkEliminationCmplx(C);

document.write(freq  + " MHz____" +  (20*Math.log10(OutMatrixC[6][8].mag())).toFixed(2) + " dB____" + (20*Math.log10(OutMatrixC[7][8].mag())).toFixed(2) + " dB" + "<br>");
  
//document.write(freq  + " MHz____" +  OutMatrixC[6][8].mag().toFixed(8) + " ____" + OutMatrixC[6][8].ang().toFixed(8) + "<br>");  
//document.write(freq  + " MHz____" +  OutMatrixC[7][8].mag().toFixed(8) + " ____" + OutMatrixC[7][8].ang().toFixed(8) + "<br>");   
     
}// end frequency loop 

*/  