//computes the number sections in a chebyshev filter
export default function chebySections (maxPass = .2, minRej = 1.5, ripple = 0.1, rejection = 30) {
	/*
	ak	    bk	    gk	    R,C,L      Fc= 0.2 GHz, Frej=1.5GHz, Ripple=0.1, Rej=30, n=3
	UNDEF	UNDEF	1.00e+0	5.00e+1    resistor
	5.00e-1	1.69e+0	1.03e+0	1.64e-11   par capacitor
	1.00e+0	1.69e+0	1.15e+0	4.57e-8    series inductor
	5.00e-1	9.40e-1	1.03e+0	1.64e-11   par capacitor
	UNDEF	UNDEF	1.00e+0	5.00e+1    resistor
	*/
	var	maxPassFreq = maxPass,
		minRejFreq = minRej,
		passbandRipple = ripple,
		rejLevel = rejection;

	function normalizedBandwidth() { // Computes the w/w1 in MYJ on page 86 of MYJ
		return minRejFreq/maxPassFreq;
	};

	function numberSections() { // Formula 4.03-4 for n on page 86 of MYJ
		var n = 0;
		function epsilon() { return Math.pow(10,(passbandRipple/10))-1;} // Formula 4.03-5 on page 87 on MYJ
		function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
		n = Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(rejLevel/10))-1)/epsilon(passbandRipple)))/arcCosh(normalizedBandwidth(maxPassFreq, minRejFreq)));
		return n;
	};

	return numberSections()
}
		
