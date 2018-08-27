# nP
nP is short for <b>nPort</b>: A Microwave Circuit Analysis Program

## Installing

To check that it works, do the following:

* Create a new folder
* Download the [latest release](https://github.com/JerryWiltz/nP/blob/master/dist/nP.js) and put it in the folder. The name should be nP.js 
* Create an index.html file as shown below and put it in the folder

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>An nPort "Hello, World!" Example</title>
	</head>
	<body>
		<script src="./nP.js"></script>
		<script>

var g = nP.global;
g.fList = [2e9]; // Frequencies are in Hz, and are always in arrays
var r1 = nP.seR(75).out('s11mag', 's21mag');    // r1 has the magnitude of s11 and s21 of a series resistor
console.log(r1) // s11 = 0.42857142857142855; s21 is 0.5714285714285714

		</script>
	</body>
</html>
```

Open up the console panel and verify that
* s11 = 0.4285714285714285
* s21 = 0.5714285714285714

## API Reference

* [nP.global](#nP.global)
* [nPort](#nPort)
* [Open-Short-Load](#Open-Short-Load)
* [RLC](#RLC)

## nP.global
Before you can do anything, you must specify the frequency range. This is done through an object called global. <b>Important, this not referring to any Javascript global variable.</b> Rather this object exposes its members to other nP objects. To make things easier, there are <b>default</b> values:

```html
fList:	[2e9, 4e9, 6e9, 8e9] //in Hz
Ro:	50 //in Ohms
Temp:	293 //in degrees Kelvin
```

These may all be overwritten as desired. Most likely fList values will change the most,jj

nP.<b>global</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-global/src/global.js "Source")

An Object that contains (so far) Frequency, Zo, and Temperature values. There is also a member function that generates frequencies, always in Hz, in the form of fStart, fStop, and the number of points.

nP.<b>fGen</b>(<i>fStart, fStop, points</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-global/src/global.js "Source")

Returns an array of frequencies, here is how to set that up.

```html
<script src="./nP.js"></script>
<script>

var g = nP.global;
g.fList = g.fGen(.5e9,5.5e9,101); // 101 points from 500 MHz to 5.5 GHz

</script>
```

## nPort

<b>nPort</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") nPort is a Parent Object; all the other nPort objects are Children of nPort, they all inherit the members and methods of nPort. The number of ports for any nPort is 1 to 9. Most of the nPorts will be 2 ports. However, 3, 4 and up 9 ports are easy. A simple 2 way power divider is a 3 port. Or a switched filter bank could have 1 input and 8 outputs.

### nPort Members

Here are the member values of nPort, there are 2 as of this version.

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

nPort.<b>out</b> (<i> 'sij|mag|dB|ang|', ' ... ' </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") Creates a table specified by the 'sij|mag|dB|ang', ' ... ' Argument

For example, say that r1 is the nPort for 75 ohm resistor in series, the magnitude of s11 is r1.out('s11mag')

## Open-Short-Load

nP.<b>Open</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/openShortLoad/Open.js "Source") Creates and returns a new nPort Object of a one port Open. No argument required.

nP.<b>Short</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/openShortLoad/Short.js "Source") Creates and returns a new nPort Object of a one port Short. No argument required.

nP.<b>Load</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/openShortLoad/Load.js "Source") Creates and returns a new nPort Object of a one port Load. No argument required.

## RLC

These are 2 ports containing resistors, capacitors, and inductors.

nP.<b>seR</b>(<i> R </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seR.js "Source") Creates and returns a new nPort Object. If no argument, the default value is 75 Ohms.

nP.<b>paR</b>(<i> R </i>) [<>](hhttps://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/paR.js "Source") Creates and returns a new nPort Object. If no argument, the default value is 75 Ohms.

nP.<b>seL</b>(<i> L </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seL.js "Source") Creates and returns a new nPort Object. If no argument, the default value is 5e-9 Henries.

nP.<b>paC</b>(<i> C </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/paC.js "Source") Creates and returns a new nPort Object. If no argument, the default value is 1e-12 Farads.

nP.<b>lpfGen</b>(<i> [filt] </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/lpfGen.js "Source") Creates and returns a new nPort Object. The argument is an array of scaled low pass filter parameters generated by an nPort function such as chebyLPLCs. If no argument, the default value is [50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50].

## Connections

Connections are 3-Port and n-Port "dummy" components. Using these connections enables 2-Port components to be connected together to form more complex circuits such as power dividers.

nP.<b>Tee</b>(<i> C </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/connections/Tee.js "Source") Creates a new nPort Object and returns the s parameters of a 3-Port Tee connector. No argument required. Below is the code for a power divider 

```html
<script src="./nP.js"></script>
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

</script>
```

nP.<b>seriesTee</b>(<i> C </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/connections/seriesTee.js "Source") Creates a new nPort Object and returns the s parameters of a 3-Port series Tee connector. No argument required. Ports 1 and 2 are input and outputs. Port 3 is the series port.

## nP.complex

nPort provides a basic complex arithmetic class object

nP.<b>complex</b>(<i>x, y</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Initializes and returns a <b>Complex</b> object containing the property names <b>x</b> and <b>iy</b>. Here is a script you could use. 

```html
<script src="./nP.js"></script>
<script>

var c1 = nP.complex(2,3);    // The "new" keyword is not used. c1 = 2 + i3
var c2 = nP.complex(5,-7);
var c3 = c1.add(c2).mul(c1); // many of the complex class methods can be chained

</script>
```

nP.<b>set</b>(<i>real, imaginary</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that sets the properties x to real and y to imaginary, it is called by the Complex constructor; set does not method chain.

nP.<b>getR</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that gets the real part of a complex number.

```html
<script src="./nP.js"></script>
<script>

console.log(c1.getR( )); // 2

</script>
```

nP.<b>getI</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that gets the imaginary part of a complex number.

nP.<b>setR</b>(<i> real </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that sets the real part of a complex number.

```html
<script src="./nP.js"></script>
<script>

c1.setR(42);
console.log(c1.getR( )); // 42

</script>
```

nP.<b>setI</b>(<i> imaginary </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that sets the imaginary part of a complex number.

nP.<b>print</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that console.logs out the x and iy properties of a complex number.

nP.<b>add</b>(<i> c2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that adds two complex numbers, c1 and c2, and returns a Complex object. c1 is implied by the 'dot' that calls the method. This enables method chaining.

```html
<script src="./nP.js"></script>
<script>

var c1 = nP.complex(2,3);
var c2 = nP.complex(5,-7);
var c3 = c1.add(c1).add(c2); // method chaining 
console.log(c3.getR()); // 9
console.log(c3.getI()); // -1

</script>
```
nP.<b>sub</b>(<i> c2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that subtracts two complex numbers and returns a Complex object. This enables method chaining.

nP.<b>mul</b>(<i> c2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that multiplies two complex numbers and returns a Complex object. This enables method chaining.

nP.<b>div</b>(<i> c2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that divides two complex numbers and returns a Complex object. This enables method chaining.

nP.<b>inv</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that inverts a complex number and returns a Complex object. This enables method chaining.

nP.<b>neg</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that changes the sign of x and iy in a complex number and returns a Complex object. This enables method chaining.

nP.<b>mag</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that returns the magnitude of a complex number. No method chaining.

nP.<b>ang</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that returns the angle, <b>in degrees</b>, of a complex number. No method chaining.

nP.<b>mag10dB</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that returns the 10dB magnitude of a complex number . No method chaining.

nP.<b>mag20dB</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that returns the 20dB magnitude of a complex number . No method chaining

nP.<b>sinhCplx</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that returns the complex hyperbolic sine of a complex number and returns a Complex object. This method is key for transmission line equations. Also, this enables method chaining.

```html
<script src="./nP.js"></script>
<script>

var C = nP.complex(1,2), gamma = nP.complex(3,4), B = nP.complex(5,6),
Ds = C.mul(gamma.coshCplx()).add(B.mul(gamma.sinhCplx()));
console.log(Ds) // Complex {x: 21.557232562315377, y: -98.12775767092192}

</script>
```
nP.<b>coshCplx</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that returns the complex hyperbolic cosine of a complex number and returns a Complex object. This enables method chaining.
