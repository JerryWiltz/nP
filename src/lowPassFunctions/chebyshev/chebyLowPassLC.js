// Generates an array of parallel Capacitors and series Inductors based on chebyshev values
export default function chebyLowPassLC ( cheby = [1, 1.0315851425078764, 1.1474003299537219, 1.0315851425078761, 1], maxPassFrequency = 0.2e9, zo = 50) { 
	var	chebyLowPassLCout = new Array(cheby.length),
	i = 0;
	
	chebyLowPassLCout[0] = cheby[0] * zo; // Populate the first resistor in the array
	
	for(i = 1; i < cheby.length -1; i++) { // Populate the C's and L's
		chebyLowPassLCout[i] = ( (i) % 2 === 0 ) ? cheby[i] * zo * (1/(2*Math.PI)) * (1/(maxPassFrequency )) : cheby[i] * 1/zo * (1/(2*Math.PI)) * (1/(maxPassFrequency));
	}; 
	
	chebyLowPassLCout[cheby.length-1] = cheby[cheby.length-1] * zo; // Populate the last resistor in the array
	
	return chebyLowPassLCout;
};