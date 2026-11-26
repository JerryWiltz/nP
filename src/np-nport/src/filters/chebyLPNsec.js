// Modified: 2026-11-26
import {requireNumber} from '../numericValidation';
// Computes the number of sections in a Chebyshev low-pass filter
export function chebyLPNsec (passFreq = .2, rejFreq = 1.5, ripple = 0.1, rejection = 30) { // Formula 4.03-4 for n on page 86 of MYJ
	requireNumber('chebyLPNsec', 'pass frequency', passFreq, {positive: true});
	requireNumber('chebyLPNsec', 'rejection frequency', rejFreq, {positive: true});
	requireNumber('chebyLPNsec', 'ripple (dB)', ripple, {positive: true});
	requireNumber('chebyLPNsec', 'rejection (dB)', rejection, {positive: true});
	if (rejFreq <= passFreq || rejection <= ripple) throw new RangeError('chebyLPNsec needs rejection frequency above pass frequency and rejection above ripple.');
	var chebyLPNsecout;
	function normalizedBandwidth() { return rejFreq/passFreq; }// Computes the w/w1 in MYJ on page 86 of MYJ
	function epsilon() { return Math.pow(10,(ripple/10))-1;} // Formula 4.03-5 on page 87 on MYJ
	function arcCosh(x) {return Math.log(x + Math.sqrt((x * x)-1));}
	chebyLPNsecout = Math.ceil(arcCosh(Math.sqrt((Math.pow(10,(rejection/10))-1)/epsilon(ripple)))/arcCosh(normalizedBandwidth()));
	requireNumber('chebyLPNsec', 'calculated section count', chebyLPNsecout, {positive: true, integer: true});
	return chebyLPNsecout;
};
