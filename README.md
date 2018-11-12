<b>nPort</b>: A Microwave Circuit Analysis Program

**nP** is a JavaScript library for analyzing microwave circuits. It helps you analyze and visualize operation of various multiport circuits.

## Installing 

Run this "Hello, nPort!" example below to verify installation.

* Create a new folder named "Hello, nPort!"
* Download the [latest release](https://github.com/JerryWiltz/nP/blob/master/dist/nP.js) and put that in the folder. The name should be nP.js 
* Copy and paste the file below named index.html
* Launch your browser with index.html
* View index.html in a browser to see <b>"Hello, nPort!"</b>

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Hello, nPort!</title>
	</head>
	<body>
		<h1 ID='hello'></h1>
		<script src="./nP.js"></script>
		<script>

var msg = nP.helloNport();
var element = document.getElementById('hello');
element.innerHTML = msg;

		</script>
	</body>
</html>
```

## API Reference

* [np-global](#np-global)
* [np-nport](#np-nport)
* [np-lowpass-prototype](#np-lowpass-prototype)
* [np-math](#np-math)
* [np-chart](#np-chart)

## nP-global
Before you can do anything, you must specify a single frequency or a frequency range. This is done through an object called global. <b>Important, this not referring to any Javascript global variable.</b> Rather this object exposes its members to other nP objects. To make things easier, there are <b>default</b> values:

```html
fList:	[2e9, 4e9, 6e9, 8e9]   //in Hz and is always in an array
Ro:	50                        //in Ohms
Temp:	293                     //in degrees Kelvin
```

These may be overwritten as desired.

nP.<b>global</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-global/src/global.js "Source")

The nPort Object that contains the Frequency, Zo, and Temperature values. There is also a member function that generates frequencies, always in Hz, in the form of fStart, fStop, and the number of points.

nP.<b>fGen</b>(<i> fStart, fStop, points </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-global/src/global.js "Source")

Returns an array of frequencies, here is how to set that up.

```html

<script>

var g = nP.global;
g.fList = g.fGen(.5e9,5.5e9,101); // 101 points from 500 MHz to 5.5 GHz

</script>
```

## nP-nPort

<b>nPort</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") nPort is the Parent Object, nPort objects are Children of nPort, so they inherit the members and methods of nPort. An nPort may have 9 ports maximum but most of nPorts will have 2 ports. For example, a simple 2 way power divider is a 3 port however, a switched filter bank could have 1 input and 8 outputs.

### nPort Members

nPort.<b>global</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-global/src/global.js "Source") global contains the frequency list, the Zo, and the Temperature

nPort.<b>spars</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") spars is a table of frequency and corresponding s parameters. There can be up 9 port or a 9 by 9 s parameter matrix for each frequency. Format: A table of frequency and s parameters. As shown below. 

```
1Port
Freq1 s11
Freq2 s11

2Port
Freq1 s11, s12, s21, s22
Freq2 s11, s12, s21, s22

3Port
Freq1 s11, s12, s13, s21, s22, s23, s31, s32, s33 
Freq2 s11, s12, s13, s21, s22, s23, s31, s32, s33

1 to 9Ports are supported 
```

### nPort Methods

nPort.<b>setglobal</b> (<i> global </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") sets the global variables of an nPort: fList, Ro, and Temp mentioned above 

nPort.<b>getglobal</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") gets the global variables of an nPort

nPort.<b>setspars</b> (<i> spars </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") sets the spars of an nPort

nPort.<b>getspars</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") gets the spars of an nPort

nPort1.<b>cas</b> (<i> nPort2 </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") cascades two 2-ports and creates a new nPort. Method chaining enabled.

nPort.<b>out</b> (<i> 'sij|mag|dB|ang|Re|Im', ' ... ' </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") Creates a table specified by the Argument

* <b>mag</b> will provide sij magnitude
* <b>ang</b> the angle
* <b>dB</b> the magnitude in dB
* <b>Re</b> the real part
* <b>Im</b> the imaginary part

```html
// For example, if r1 is the nPort for 75 ohm resistor in series, the magnitude of s11 is
r1.out('s11mag')
```

### nPort Functions

nPort.<b>cascade</b> (<i> ... nPorts </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/combining/cascade.js "Source") cascades a list of comma separated nPorts and returns a new nPort. 

nPort.<b>nodel</b> (<i>[nPort1,... nodes],[nPort2,...nodes], ... ['out,... nodes]</i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/combining/nodal.js "Source") list of comma separated arrays. Each array begins with the name of the nPort, followed the array numbers. The circuit defined by interconnection nPorts by their nodes. The last array must being with the 'out' name, followed by node numbers. Lastly nP.nodal returns a new nPort.


nP.<b>lpfGen</b>(<i> filt = [50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50] </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/lpfGen.js "Source") Creates and returns a new nPort Object. The argument is an array of scaled low pass filter parameters generated by an nPort function such as chebyLPLCs. If no argument, the default value is [50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50].

The example below shows three ways of doing the same thing, as filt1 = filt2 = filt3.
<br>filt1 is defined by the **cas** method</br>
<br>filtt is defined by the **cascade** function</br>
<br>filt3 is defined by the **nodal** function</br>
<br>filt4 is defined by the **lpfGen** function

```html
<!--DOCTYPE html-->

		<script>
// Nine nPorts for a lowpass LC filter
var c1 = nP.paC(3.1716836788279897e-12);
var l1 = nP.seL(9.566513256241392e-9);
var c2 = nP.paC(5.6621309381827996e-12);
var l2 = nP.seL(1.0721164178932893e-8);
var c3 = nP.paC(5.8499784682761105e-12);
var l3 = nP.seL(1.0721164178932898e-8);
var c4 = nP.paC(5.662130938182797e-12);
var l4 = nP.seL(9.566513256241397e-9);
var c5 = nP.paC(3.171683678827988e-12);

// using nPort method, cas, to produce a single nPort for the entire filter.
var filt1 = c1.cas(l1).cas(c2).cas(l2).cas(c3).cas(l3).cas(c4).cas(l4).cas(c5);

// using nPort function, cascade, to produce a single nPort for the entire filter.
var filt2 = nP.cascade (c1,l1,c2,l2,c3,l3,c4,l4,c5);
};

// using nPort function, nodal, to produce a single nPort for the entire filter.
var filt3 = nP.nodal([c1,1,2],[l1,2,3],[c2,3,4],[l2,4,5],[c3,5,6],[l3,6,7],[c4,7,8],[l4,8,9],[c5,9,10],['out',1,10]);

// using the nPort function, lpfGen, to produce a nPort for the entire filter

var filt4 = nP.lpf(50,
				3.1716836788279897e-12,
				9.566513256241392e-9,
				5.6621309381827996e-12,
				1.0721164178932893e-8,
				5.8499784682761105e-12,
				1.0721164178932898e-8,
				5.662130938182797e-12,
				9.566513256241397e-9,
				3.171683678827988e-12,
				50);
		</script>
	</body>
</html
```

### Open-Short-Load (Thes are ideal one-ports)

nP.<b>Open</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/openShortLoad/Open.js "Source") Creates and returns a new nPort Object of a one port Open. No argument required.

nP.<b>Short</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/openShortLoad/Short.js "Source") Creates and returns a new nPort Object of a one port Short. No argument required.

nP.<b>Load</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/openShortLoad/Load.js "Source") Creates and returns a new nPort Object of a one port Load. No argument required.

### RLC

These are 2 ports containing resistors, capacitors, inductors, and transformers.

```HTML
// seR reads, "series resistor"
// paR reads, "parallel resistor"
```

nP.<b>seR</b>(<i> R = 75 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") Series resistor. Creates and returns a new nPort Object. If no argument, the default value is 75 Ohms.

nP.<b>paR</b>(<i> R = 75 </i>) [<>](hhttps://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/paR.js "Source") Parallel resistor. Creates and returns a new nPort Object. If no argument, the default value is 75 Ohms.

nP.<b>seL</b>(<i> L = 5e-9 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seL.js "Source") Series Inductor. Creates and returns a new nPort Object. If no argument, the default value is 5e-9 Henries.

nP.<b>paL</b>(<i> L = 5e-9 </i>) [<>](https://github.com/JerrhhyWiltz/nP/blob/master/src/np-nport/src/rlc/seL.js "Source") Parallel Inductor. Creates and returns a new nPort Object. If no argument, the default value is 5e-9 Henries.

nP.<b>seC</b>(<i> C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seC.js "Source") Series Capacitor. Creates and returns a new nPort Object. If no argument, the default value is 1e-12 Farads.

nP.<b>paC</b>(<i> C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/paC.js "Source") Parallel capacitor. Creates and returns a new nPort Object. If no argument, the default value is 1e-12 Farads.

Ideal Trasnformers

nP.<b>trf</b>(<i> N = 0.5 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/trf.js "Source") Parallel capacitor. Creates and returns a new nPort Object. If no argument, the default value is turns ratio of N = 0.5 . N is also equal to N = sqrt(Zp/Zs), where Zp is primary impedance and Zs is the secondary impedance.

nP.<b>trf4Port</b>(<i> N = 0.5 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/trf.js "Source") Parallel capacitor. Creates and returns a new nPort Object. If no argument, the default value is turns ratio of N = 0.5 . <b>This is a 4 Port element.</b> The primary ports are 1 and 3 and the secondary ports are 2 and 4. N is also equal to N = sqrt(Zp/Zs), where Zp is primary impedance and Zs is the secondary impedance.

RLC with more than one component

nP.<b>seSeRL</b>(<i> R = 75, L = 5e-9 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A series, series resistor-inductor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms and 5e-9 Henries.

nP.<b>paSeRL</b>(<i> R = 75, L = 5e-9 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A parallel, series resistor-inductor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms and 5e-9 Henries.

nP.<b>seSeRC</b>(<i> R = 75, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A series, series resistor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms and 1e-12 Farads.

nP.<b>paSeRC</b>(<i> R = 75, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A parallel, series resistor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms and 1e-12 Farads.

nP.<b>seSeLC</b>(<i> L = 5e-9, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A series, series inductor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 5e-9 Henries and 1e-12 Farads.

nP.<b>paSeLC</b>(<i> L = 5e-9, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A parallel, inductor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 5e-9 Henries and 1e-12 Farads.

nP.<b>seSeRLC</b>(<i> R = 75, L = 5e-9, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A series, series resistor-inductor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 75 ohms, 5e-9 Henries and 1e-12 Farads.

nP.<b>paSeRLC</b>(<i> R = 75, L = 5e-9, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A parallel, series resistor-inductor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms, 5e-9 Henries and 1e-12 Farads.

nP.<b>paPaRL</b>(<i> R = 75, L = 5e-9 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A parallel, parallel resistor-inductor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms and 5e-9 Henries.

nP.<b>sePaRL</b>(<i> R = 75, L = 5e-9 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A series, parallel resistor-inductor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms and 5e-9 Henries.

nP.<b>paPaRC</b>(<i> R = 75, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A parallel, parallel resistor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms and 1e-12 Farads.

nP.<b>sePaRC</b>(<i> R = 75, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A series, parallel resistor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms and 1e-12 Farads.

nP.<b>paPaLC</b>(<i> L = 5e-9, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A parallel, parallel inductor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 5e-9 Henries and 1e-12 Farads.

nP.<b>sePaLC</b>(<i> L = 5e-9, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A series, parallel inductor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 5e-9 Henries and 1e-12 Farads.

nP.<b>paPaRLC</b>(<i> R = 75, L = 5e-9, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A parallel, parallel resistor-inductor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms, 5e-9 Henries and 1e-12 Farads.

nP.<b>sePaRLC</b>(<i> R = 75, L = 5e-9, C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") A series, parallel resistor-inductor-capacitor. Creates and returns a new nPort Object. If no arguments, the default values are 75 Ohms, 5e-9 Henries and 1e-12 Farads.



### Connections

Connections are 3-Port and n-Port "dummy" components. Using these connections enables 2-Port components to be connected together to form more complex circuits such as power dividers.

nP.<b>Tee</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/connections/Tee.js "Source") Creates a new nPort Object and returns the s parameters of a 3-Port Tee connector. No argument required. Below is the code for a power divider 

```html

<script>

//Here is a simple Wilkenson Power Divider
var g = nP.global;
g.fList = g.fGen(2e9,22e9,201); // 2 GHz to 22 GHz with 201 points

var threeWay = nP.Tee();
var tl = nP.tlin(70.7, 0.49 * 0.0254); 
var r = nP.seR(100);

// Note the array of components and node numbers right below
var pwr = nP.nodal([threeWay, 1,2,3],[tl,3,5],[tl,2,4],[threeWay,9,7,5],[threeWay,8,4,6],[r,8,9],['out',1,7,6]);
var powerDivider = pwr.out('s11dB','s21dB','s23dB');

console.log(powerDivider);

</script>
```

nP.<b>seriesTee</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/connections/seriesTee.js "Source") Creates a new nPort Object and returns the s parameters of a 3-Port series Tee connector. No argument required. Ports 1 and 2 are input and outputs. Port 3 is the series port.

## nP-lowpass-prototype

This section has chebychev low pass filter synthesis functions

nP.<b>chebyLPNsec</b>(<i> passFreq = .2, rejFreq = 1.5, ripple = 0.1, rejection = 30 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-lowpass-prototype/src/chebyLPNsec.js "Source") A function that computes and returns the number of sections in a Chebychev Low Pass filter prototype given the pass frequency, the rejection frequency, ripple, and rejection level. The default values are shown in the function argument.

nP.<b>chebyLPgk</b>(<i> n = 3, ripple = 0.1 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-lowpass-prototype/src/chebyLPgk.js "Source") A function that computes and returns an array of the gk values in a Chebychev Low Pass filter prototype given the number of sections and ripple. The default values are shown in the function argument.

nP.<b>chebyLPLCs</b>(<i> cheby = [1, 1.0315851425078764, 1.1474003299537219, 1.0315851425078761, 1], maxPassFrequency = 0.2e9, zo = 50) </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-lowpass-prototype/src/chebyLPLCs.js "Source") A function that computes and returns an array of the C-L-C ... values in a Chebychev Low Pass filter prototype given an array of the gk values. The default values are shown in the function argument.

## nP-math

### nP.complex

nPort provides a basic complex arithmetic class object

nP.<b>complex</b>(<i>x, y</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Initializes and returns a <b>Complex</b> object containing the property names <b>x</b> and <b>iy</b>. Here is a script you could use. 

```html

<script>

var c  = nP.complex(1,2);    // The "new" keyword is not used. c1 = 1 + i2
var c1 = nP.complex(2,3);
var c2 = nP.complex(5,-7);

console.log(c); // 

</script>
```

c.<b>set</b>(<i>real, imaginary</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that sets the properties x to real and y to imaginary, it is called by the Complex constructor; set does not method chain.

c.<b>getR</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that gets the real part of a complex number.

```html

<script>

console.log(c.getR( )); // 2

</script>
```

c.<b>getI</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that gets the imaginary part of a complex number.

c.<b>setR</b>(<i> real </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that sets the real part of a complex number.

```html

<script>

c.setR(42);
console.log(c.getR( )); // 42

</script>
```

c.<b>setI</b>(<i> imaginary </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that sets the imaginary part of a complex number.

c.<b>print</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that console.logs out the x and iy properties of a complex number.

c.<b>add</b>(<i> c2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that adds two complex numbers, c1 and c2, and returns a Complex object. c1 is implied by the 'dot' that calls the method. Method chaining capable.

```html

<script>

var c3 = c1.add(c1).add(c2); // method chaining 
console.log(c3.getR()); // 9
console.log(c3.getI()); // -1

</script>
```
c1.<b>sub</b>(<i> c2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that subtracts two complex numbers, c1 and c2, and returns a Complex object. c1 is implied by the 'dot' that calls the method. Method chaining capable.

c1.<b>mul</b>(<i> c2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that multiplies two complex numbers, c1 and c2, and returns a Complex object. c1 is implied by the 'dot' that calls the method. Method chaining capable.

c1.<b>div</b>(<i> c2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that divides two complex numbers, c1 and c2, and returns a Complex object. c1 is implied by the 'dot' that calls the method. Method chaining capable.

c.<b>inv</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that inverts a complex number and returns a Complex object. Method chaining capable.

c.<b>neg</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that changes the sign of x and iy in a complex number and returns a Complex object. Method chaining capable.

c.<b>mag</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that returns the magnitude of a complex number. No method chaining.

c.<b>ang</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that returns the angle, <b>in degrees</b>, of a complex number. No method chaining.

c.<b>mag10dB</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that returns the 10dB magnitude of a complex number . No method chaining.

c.<b>mag20dB</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that returns the 20dB magnitude of a complex number . No method chaining

c.<b>sinhCplx</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that returns the complex hyperbolic sine of a complex number and returns a Complex object. This method is key for transmission line equations. Method Chaining capable.

```html

<script>

var C = nP.complex(1,2), gamma = nP.complex(3,4), B = nP.complex(5,6),
Ds = C.mul(gamma.coshCplx()).add(B.mul(gamma.sinhCplx()));
console.log(Ds) // Complex {x: 21.557232562315377, y: -98.12775767092192}

</script>
```
nP.<b>coshCplx</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that returns the complex hyperbolic cosine of a complex number and returns a Complex object. Method chaining capable.

### nP.matrix

nPort provides a basic matrix arithmetic class object. <b>Complex number matrices</b> are supported.

nP.<b>matrix</b>(<i>x, y</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Initializes and returns a <b>Complex</b> object containing the property names <b>x</b> and <b>iy</b>. Here is an example script. 

```html

<script>

// Note see method chaining of matrices in action

var a = [
	[3,5,2],
	[0,8,2],
	[6,2,8]
];

var b = nP.matrix(a).invert().mul(nP.matrix([[8],[-7],[26]]));
console.log(b);

var c = [
	[nP.complex(3,0), nP.complex(5,0), nP.complex(2,0)],
	[nP.complex(0,0), nP.complex(8,0), nP.complex(2,0)],
	[nP.complex(6,0), nP.complex(2,0), nP.complex(8,0)]
];

var d = nP.matrix(c).invertCplx().mulCplx(nP.matrix([[nP.complex(8,0)],[nP.complex(-7,0)],[nP.complex(26,0)]]));
console.log(d);

var e = nP.matrix([[1]]);
var f = e.add(e).add(e).add(e);
console.log(f);

</script>
```

nP.<b>matrix</b>(<i> [ [array row 1], [array row 2], ... [array row n] ] </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") A constructor that is passed a table and returns a matrix object.

<b>dim</b>(<i> rows, cols, initial </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") A function that <b>creates a table</b> (a rows by cols array of arrays in JavaScript) with an initial value such a 0, or 1, or "text", or a complex number nP.complex(1,). Note, dim does not create a matrix object, but it can be the argument that is passed to the matrix constructor.

<b>dup</b>(<i> table </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") A function that creates a new table with duplicate values.

<b>dimension</b>(<i> rows, cols, initial </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") A function that <b>creates a matrix object</b> with rows and cols with an initial value such a 0, or 1, or "text", or a complex number nP.complex(1,). Note, dim does not create a matrix object, but it can be the argument that is passed to the matrix constructor.

<b>duplicate</b>(<i> matrix </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") A function that creates a new matrix with duplicate member values.

m1.<b>add</b>(<i> m2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that adds two matrices, m1 and m2, and returns a matrix object. m1 is implied by the 'dot' that calls the method. Method chaining capable.

m1.<b>addCplx</b>(<i> m2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that adds two complex matrices, m1 and m2, and returns a matrix object. m1 is implied by the 'dot' that calls the method. Method chaining capable.

m1.<b>sub</b>(<i> m2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that adds two matrices, m1 and m2, and returns a matrix object. m1 is implied by the 'dot' that calls the method. Method chaining capable.

m1.<b>subCplx</b>(<i> m2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that adds two complex matrices, m1 and m2, and returns a matrix object. m1 is implied by the 'dot' that calls the method. Method chaining capable.

m1.<b>mul</b>(<i> m2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that adds two matrices, m1 and m2, and returns a matrix object. m1 is implied by the 'dot' that calls the method. Method chaining capable.

m1.<b>mulCplx</b>(<i> m2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that adds two complex matrices, m1 and m2, and returns a matrix object. m1 is implied by the 'dot' that calls the method. Method chaining capable.

m.<b>solveGuass</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that uses Guassian Elimination and Forward Substitution to solve a matrix and returns a matrix object. Method chaining capable.

m.<b>solveGuassCplx</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that uses Guassian Elimination and Forward Substitution to solve a complex matrix and returns a matrix object. Method chaining capable.

m.<b>invert</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that inverts a matrix and returns a matrix object. Method chaining capable.

m.<b>invertCplx</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that inverts a complex matrix and returns a matrix object. Method chaining capable.

## nP-chart

These are charting routines based on d3. <b>Note, downloading d3 is not required</b>. d3 is inside nPort.

nP.<b>lineChart</b>(<i> lineChartInputObject = {} </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-chart/src/lineChart.js) A function that draws a rectangular chart or plot in a specified svg element via the element ID. The default element ID is "canvas". <b>You must specify an ID, width, and height attributes</b>, such as:

```html
<svg id="canvas" width="500" height="300"></svg>
````

If no argument linePlot, wlll display a default plot inside the svg. This is good for setting up your page, but you no data. Here is an HTML example for the default lineChart().

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Default lineChart()</title>
	</head>
	<body>
		<svg id="canvas" width="500" height="300"></svg>jj
		<script src="nP.js"></script>
		<script>

nP.lineChart();  // Default 

		</script>
	</body>
</html>
````

LinelinePlot takes an object argument named "lineChartInputObject" and is used in the example below.

```HTML
<!--DOCTYPE html-->
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>lineChart() Applied</title>
	</head>
	<body>
			<svg id="canvas1" width="500" height="300"></svg>
		<script src="nP.js"></script>

		<script>
// Set up the frequency range
var g = nP.global;	
g.fList = g.fGen(50e6, 10e9, 50);

// A 9 section low pass filter
var c1 = nP.paC(3.1716836788279897e-12);
var l1 = nP.seL(9.566513256241392e-9);
var c2 = nP.paC(5.6621309381827996e-12);
var l2 = nP.seL(1.0721164178932893e-8);
var c3 = nP.paC(5.8499784682761105e-12);
var l3 = nP.seL(1.0721164178932898e-8);
var c4 = nP.paC(5.662130938182797e-12);
var l4 = nP.seL(9.566513256241397e-9);
var c5 = nP.paC(3.171683678827988e-12);
var filter = c1.cas(l1).cas(c2).cas(l2).cas(c3).cas(l3).cas(c4).cas(l4).cas(c5).out('s11dB', 's21dB');

// Create the lineChartInputObject
var lineChartInputObject = {
	canvasID: '#canvas1',
	inputTable: filter
};

// Pass the lineChartInputObject to lineChart
nP.lineChart(lineChartInputObject);


		</script>
	</body>
</html
```

Here is full the format of the LineChart Object, it has key-value pairs in the following order:

```html
lineChartInputObject = {
inputTable:  inputTable, // nP.out('s21dB', 's11dB') provides the inputTable format
freqUnits: 'GHz',        // Frequency Units
canvasID: '#canvas',     // The ID of the target svg with width and height specified
xAxisTitle: 'Frequency', // Text
yAxisTitle: 'dB',        // Text
xAxisTitleOffset: 48,    // in pixels
yAxisTitleOffset: 40     // in pixels
}
```

Here is the format for the inputTable value:

```html
var inputTable = [
	['Freq', 's21dB', 's11dB'],
	[ 8 * 1e9,  22,  40],
	[12 * 1e9,  80,  90],
	[16 * 1e9, 100, 105],
	[20 * 1e9, 120, 130]
];
```