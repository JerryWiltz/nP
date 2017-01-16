// This is a script to compute the low pass chebyshev filter prototype
// It is taken from Matthaei, Young, and Jones (MYJ)

//lowPass(1.0, 1.5, 0.1, 30);

// Outer function to compute the low pass chebyshev filter prototype
// It is taken from Matthaei, Young, and Jones (MYJ)
//function lowPass(maxPassFreq, minRejFreq, passbandRipple, rejLevel) {
function lowPass() {
    // input elements
  var maxPassFreq = document.getElementById("maxPassFreq");
  var minRejFreq = document.getElementById("minRejFreq");
  var passbandRipple = document.getElementById("passbandRipple");
  var rejLevel = document.getElementById("rejLevel");
  

  
  
  var Table;
  
// All the inner functions have access to the outer function scope and parameters
  
      // Inner function of lowPass() that computed the w/w1 in MYJ on page 86
    function normalizedBandwidth() {
      return minRejFreq/maxPassFreq;
    }
	
    // Inner function of lowPass() that computes the formula 4.03-5 on page 87  
      function epsilon() { 
    return Math.pow(10,(passbandRipple/10))-1;
    }
  
    // Inner function of lowPass() that computes the number of sections, n, in a filter. Solve formula 4.03-4 for n on page 86
    function n() {
    
        // Inner and helper function of n() to compute the arcCosh, verified that arcCosh(1.3) = 0.76543
        function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
        //return Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(  rejLevel/10))-1)/epsilon(passbandRipple)))/arcCosh(normalizedBandwidth(maxPassFreq, minRejFreq)));
      return n = 3;
    
    }
	
}

    //Fill in the output fields, rounding to 2 decimal places
    w.innerHTML = normalizedBandwidth().toFixed(2);
    n.innerHTML = n().toFixed(2);
	
/*
    // Inner function of LowPass() that computes all the gk's shown in formula 4.05-2 on page 99
    function gk() {
      // Create lowPassTable to hold ak, bk, and gk based on n()
      var lowPassTable = new Array(1 + n() + 1);  // corresponds with g0 + gk + g(k+1)
      for(var i = 0; i < lowPassTable.length; i++)
        lowPassTable[i] = new Array(4); // Each row has 4 columns:ak, bk, gk, and R,C,L's
          
      // Inner and helper function of gk() to compute the cosh(x)
      function coth(x) {return (Math.exp(x) + Math.exp(-x))/(Math.exp(x) - Math.exp(-x));}
      // Inner and helper function of gk() compute the B(x) on page 99
      function B() {return Math.log(coth(passbandRipple/17.37));}
      // Inner and helper function of gk() cumpute sinh(x)
      function sinh(x) {return (Math.exp(x) - Math.exp(-x))/2;}
      // Inner and helper function of gk() compute G() on page 99
      function G() {return sinh(B()/(2 * n()));}
      
      // Initialize the lowPassFilter array
      //lowPassTable[0][0] for g0=1;
      lowPassTable[0][2] = 1;
      
      // Populate the ak column
      for(var row = 1; row < lowPassTable.length -1; row++) {
        lowPassTable[row][0] = Math.sin(((2 * row - 1) * Math.PI)/(2 * n()) );    
      }
      
      // Populate the bk column
      for(var row = 1; row < lowPassTable.length -1; row++) {
        lowPassTable[row][1] = Math.pow(G(),2) + Math.pow(Math.sin(row * Math.PI/n()),2);    
      }
      
      // populate the first q1 in the cell
      lowPassTable[1][2] = 2*lowPassTable[1][0]/G();
      
      // Populate the gk column from g2 onward to gk
      for(var row = 2; row < lowPassTable.length -1; row++) {
        lowPassTable[row][2] = (4 * lowPassTable[row-1][0] * lowPassTable[row][0])/(lowPassTable[row-1][1] * lowPassTable[row-1][2]);    
      }
      
      // Populate the last g(k+1) in the cell
      lowPassTable[n()+1][2] = (n() % 2 === 0 ) ? Math.pow(coth(B()/4),2) : 1 ;
      
      // Populate the first resistor in the cell
      lowPassTable[0][3] = lowPassTable[0][2] * 50;

      // Populate the C's and L's in the last column Row (if row number is odd, compute C, if even, compute L) 
      for(var row = 1; row < lowPassTable.length -1; row++) {
        lowPassTable[row][3] = (row % 2 === 0 ) ? lowPassTable[row][2] * 50 * (1/(2*Math.PI)) * 1e-9 : lowPassTable[row][2] * 1/50 * (1/(2*Math.PI)) * 1e-9;    
      }      
           
      // Populate the last resistor in the cell
      lowPassTable[n()+1][3] = lowPassTable[n()+1][2] * 50;      
      
      
      //return lowPassTable[n()+1][2];
      return lowPassTable;
      
    }

    Table = gk();
  
    // Print ak's, bk's, and gk's
    for(var row = 0; row < Table.length; row++) {
      document.write( Table[row][0] +"    "+ Table[row][1] +"    "+ Table[row][2] +"    "+ Table[row][3] +"<br>");    
      }  
}
*/

/*
var testArray = new Array(2);
testArray[0] = new Complex();
testArray[0].setRe(10);
testArray[0].setIm(5);
testArray[1] = new Complex(45, 55);

document.write(testArray[1].getIm());


Rin = new Complex(50,0); 
Rload = new Complex(50,0);
Rshunt = new Complex(75,0);
Zin = Complex.Parallel(Rshunt,Rload);
s11 = Complex.s11(Zin, Rin);
s21 = Complex.s21(s11);


document.write(s11.magnitude()+"<br>");
document.write(s11.angle()*(180.0/Math.PI)+"<br>");
document.write(s21.magnitude()+"<br>");
document.write(s21.angle()*(180.0/Math.PI)+"<br>");

*/
