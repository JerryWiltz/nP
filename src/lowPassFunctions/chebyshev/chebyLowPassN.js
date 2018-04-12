// Computes the number sections in a chebyshev lowpass filter
export default function chebyLowPassN (passFreq = .2, rejFreq = 1.5, ripple = 0.1, rejection = 30) { // Formula 4.03-4 for n on page 86 of MYJ
	var chebyLowPassNout = 0;
	function normalizedBandwidth() { return rejFreq/passFreq; }// Computes the w/w1 in MYJ on page 86 of MYJ
	function epsilon() { return Math.pow(10,(ripple/10))-1;} // Formula 4.03-5 on page 87 on MYJ
	function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
	chebyLowPassNout = Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(rejection/10))-1)/epsilon(ripple)))/arcCosh(normalizedBandwidth()));
	return chebyLowPassNout;
};