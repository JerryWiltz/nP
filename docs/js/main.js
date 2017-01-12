//
// This is the Main program, Main.js
//
//
document.write("Block 1 defines a series 20 Ohm resistor (Uses seriesRspars routine)." + "<br>");
var R20ohm = new Nport();
R20ohm.seriesRspars(20);
var S11ohm = R20ohm.getSpars()[0].getR();
var S21ohm = R20ohm.getSpars()[1].getR();
document.write(S11ohm + "<br>"); //s11 = 0.16666666666666666
document.write(S21ohm + "<br>"); //s21 = 0.8333333333333334

document.write("<br>");
document.write("Block 2 defines a series 20 Ohm resistor (Uses gaussFwdBkElimination matrix solver)." + "<br>");
var A = [[-S11ohm, -S21ohm, 1, 0, 0],
         [-S21ohm, -S11ohm, 0, 1, 0],
         [      1,       0, 0, 0, 1],
         [      0,       1, 0, 0, 0]];
                 
var OutMatrixA = gaussFwdBkElimination(A);
document.write(OutMatrixA[2][4] + "<br>"); //s11 = 0.16666666666666696
document.write(OutMatrixA[3][4] + "<br>"); //s21 = 0.8333333333333335

document.write("<br>");
document.write("Block 3 defines a resistor 430-20-430 ohm PI network (Uses gaussFwdBkEliminationCmplx matrix solver)." + "<br>");
var R1 = new Nport();
R1.shuntRspars(430);
var negR1s11 = R1.getSpars()[0].neg();
var negR1s21 = R1.getSpars()[1].neg();

var R2 = new Nport();
R2.seriesRspars(10);
var negR2s11 = R2.getSpars()[0].neg();
var negR2s21 = R2.getSpars()[1].neg();

var R3 = new Nport();
R3.shuntRspars(430);
var negR3s11 = R3.getSpars()[0].neg();
var negR3s21 = R3.getSpars()[1].neg();

one = new Complex(1,0);
zero = new Complex(0,0);

//                0         1        2          3         4         5     6    7     8 
var B = [[negR1s11, negR1s21,    zero,      zero,     zero,     zero, zero,  one, zero], //0
         [negR1s21, negR1s11,     one,      zero,     zero,     zero, zero, zero, zero], //1
         [    zero,      one, negR2s11, negR2s21,     zero,     zero, zero, zero, zero], //2
         [    zero,     zero, negR2s21, negR2s11,      one,     zero, zero, zero, zero], //3
         [    zero,     zero,     zero,      one, negR3s11, negR3s21, zero, zero, zero], //4
         [    zero,     zero,     zero,     zero, negR3s21, negR3s11,  one, zero, zero], //5
         [    zero,     zero,     zero,     zero,     zero,      one, zero, zero,  one], //6  [6][8] is S11  
         [     one,     zero,     zero,     zero,     zero,     zero, zero, zero, zero]];//7  [7][8] is S21

var OutMatrixB = gaussFwdBkEliminationCmplx(B);
document.write(OutMatrixB[6][8].mag() + "<br>"); //s11 = 0.014208507670850776 or -36.9 dB
document.write(OutMatrixB[7][8].mag() + "<br>"); //s21 = 0.8058751743375173   or -1.87 dB

document.write("<br>");
document.write("Block 4 defines a shunt 1pF at 2000MHz (Uses shuntCspars routine)." + "<br>");
var C1 = new Nport();
C1.shuntCspars(1e-12, 2000);
var C1S11m = C1.getSpars()[0].mag();
var C1S11a = C1.getSpars()[0].ang();
var C1S21m = C1.getSpars()[1].mag();
var C1S21a = C1.getSpars()[1].ang();
               
document.write(C1S11m + "<br>");
document.write(C1S11a + "<br>");
document.write(C1S21m + "<br>");
document.write(C1S21a + "<br>");

document.write("<br>");
document.write("Block 5 defines a series 5 nH inductor at 2000MHz (Uses series Lspars routine)." + "<br>");
var L1 = new Nport();
L1.seriesLspars(5e-9, 2000);
var L1S11 = L1.getSpars()[0].mag();
var L1S21 = L1.getSpars()[1].mag();
document.write(L1S11 + "<br>"); //s11 = 0.6226769923
document.write(L1S21 + "<br>"); //s21 = 0.846733016

document.write("<br>");
document.write("Block 6 defines a low pass filter network (Uses gaussFwdBkEliminationCmplx matrix solver)." + "<br>");
var C2 = new Nport();
var L2 = new Nport();  
var C3 = new Nport();  
  
for(var freq = 100; freq < 10000; freq = freq + 50) { // begin frequency loop  
  
C2.shuntCspars(3.3e-12, freq); //3.2836374930057163e-12
//C2.shuntCspars(1e-12/3, freq);
//C2.shuntRspars(430);
var C2S11 = C2.getSpars()[0].neg();
var C2S21 = C2.getSpars()[1].neg();
  

L2.seriesLspars(9.1e-9, freq); //9.130721710870328e-9
//L2.shuntCspars(1e-12/3, freq);
//L2.seriesRspars(10);
var L2S11 = L2.getSpars()[0].neg();
var L2S21 = L2.getSpars()[1].neg();
  

C3.shuntCspars(3.3e-12, freq); //3.2836374930057163e-12
//C3.shuntCspars(1e-12/3, freq);
//C3.shuntRspars(430);
var C3S11 = C3.getSpars()[0].neg();
var C3S21 = C3.getSpars()[1].neg();

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

  