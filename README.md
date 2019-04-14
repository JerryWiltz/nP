<b>nPort</b>: A Microwave Circuit Analysis Program

**nP** is a JavaScript library for analyzing microwave circuits. It helps you learn about, analyze and visualize the operation of various multiport circuits.

**nPort** creates one JavaScript global variable, **nP**.

## Downloading and Verifying nPort 

Download, **nPort**, then run the  "Hello, nPort!" example below to verify installation.

* Create a new folder named "nPort"
* Download nPort by clicking [here](https://raw.githubusercontent.com/JerryWiltz/nP/master/dist/nP.js)", then Save as... "nP.js" and put it in the "nPort" folder. 
* Create the file below and name it "index.html" and put it in the "nPort" folder.
* Run "index.html". I recommend Chrome. You should see <b>Hello, nPort!</b>

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Hello, nPort!</title>
	</head>
	<body>
		<script src="./nP.js"></script>
		<script>

nP.helloNport();

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
As **nPort** analyses in the frequency domain, it requires at least one frequency point to do anything. **nPort** has a default frequency of 2e9 or 2GHz. Therefore, you must specify either a single frequency or a list of frequencies to give **nPort** the domain it needs. The frequency or frequencies must be in an array. The units must by in Hz. Suppose you require a frequency list with 1001. There is a function, fGen(), that will create long arrays for you.

nP.<b>global</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-global/src/global.js "Source")

The nPort Object that contains the Frequency, Zo, and Temperature values. There is also a member function that generates frequencies, always in Hz, in the form of fStart, fStop, and the number of points.

nP.<b>fGen</b>(<i> fStart, fStop, points </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-global/src/global.js "Source")

Returns an array of frequencies from fStart to fStop. The number of points is limited by memory or execution time. Popular number of points are odd numbers because the center frequency is always produced. So the number of points like 11, 51, 101, 1001, and so on, are good. Here below is an example on how to create a list with 101 points.

```html

var g = nP.global;
g.fList = g.fGen(.1e9,10e9,101); // 101 points from 100 MHz to 10 GHz

// g.fList = [100000000, 199000000, ..., 5050000000, ..., 10000000000]
// where 5050000000 is the center frequency

```

## nP-nPort

<b>nPort</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") Any RF device input/output or RF system inputs/outputs is an nPort. An nPort may have up to and including 9 ports maximum. However, most of nPorts will have 1, 2, 3, or 4 ports. For example, an RF short is a 1 port device. A simple 2 way power divider is a 3 port device. An ideal RF transformer could have either 2 or 4 ports. At the other extreme, a switched filter bank with 1 input and 8 outputs is a 9 port device. 

### nPort Methods

nPort methods operate on nPort Objects. All nPort Objects have these methods. nPort.cas() returns a new nPort Object enabling method chaining.

nPort.<b>setglobal</b> (<i> global </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") sets the global variables of an nPort: fList, Ro, and Temp mentioned above 

nPort.<b>getglobal</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") gets the global variables of an nPort

nPort.<b>setspars</b> (<i> spars </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") sets the spars of an nPort

nPort.<b>getspars</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") gets the spars of an nPort

nPort1.<b>cas</b> (<i> nPort2 </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") cascades two 2-ports and creates a new nPort. Method chaining enabled.

nPort.<b>out</b> (<i> 'sij|mag|dB|ang|Re|Im', ' ... ' </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") Creates an output data set that can be plotted with a routine such as nP.lineChart(). Arguments must be in quotes and separated by commas. For example for a filter 2-port named, ```filt1```, to specify an out(), the syntax would be,  ```filt1.out('s11mag','s11dB','s22ang')```.

* <b>mag</b> will provide sij magnitude
* <b>ang</b> the angle
* <b>dB</b> the magnitude in dB
* <b>Re</b> the real part
* <b>Im</b> the imaginary part

```html
r1.out('s11mag')
// if r1 is an nPort for a 75 ohm resistor, the magnitude of s11 is returned.
```
nPort.<b>outTable</b> (<i> 'sij|mag|dB|ang|Re|Im', ' ... ' </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") Creates a table specified by the Argument

* <b>mag</b> will provide sij magnitude
* <b>ang</b> the angle
* <b>dB</b> the magnitude in dB
* <b>Re</b> the real part
* <b>Im</b> the imaginary part

```html
r1.outTable('s11mag')
// if r1 is an nPort for a 75 ohm resistor, the magnitude of s11 is is returned.
```

### nPort Functions

nPort functions are not members of nPort, but they operate on nPort objects. Two general purpose functions are cascade and nodal. 

nPort.<b>cascade</b> (<i> ... nPorts </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/combining/cascade.js "Source") cascades a list of comma separated nPorts and returns a new nPort Object. nPort.cascade accepts 2-ports only and creates a new 2-port that is the cascade of all the individual 2-ports.

nPort.<b>nodal</b> (<i>[nPort1, node1, node2, ...],[nPort2, node2, node3], ... ['out',  node1, node3]</i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/combining/nodal.js "Source") Enables complex interconnections of nPorts. The argument of nodal is a list of arrays separated by commas. Each array has name of an nPort followed the node numbers separated by commas. The last array is the output. It must have ['out', nodes]. nP.nodal creates a new nPort Object. Below is an example html and a schematic of a 6GHz Wilkinson Power Divider. In order to understand how to set up the node order, compare the notation of ports and nodes between the html listing and the schematic. Consider ```...,[tee,9,7,5],...``` in the listing and in the schematic below. Node 9 is connected to the node 1 of the tee. Node 7 is connected to node 2 of the tee. Lastly, node 5 is connected to node 3 of the tee. The final result is a 3-port named, ```wilkinson```. Node 1 of the input is node 1 of ```wilkinson```, Node, 7 of the input is node 2 of ```wilkinson```. And lastly, node 3 of ```wilkinson``` is Node 6 of the input. 

```html
<!--DOCTYPE html-->
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>6 GHz Wilkinson Power Divider</title>
	</head>
	<body>
		<script src="../dist/nP.js"></script>

		<script>
		
// set up frequencies
var g = nP.global;
g.fList = g.fGen(0e9,12e9,101);

// define components
var tee = nP.Tee();
var t70 = nP.tlin(70.7, 0.49 * 0.0254);
var r100 = nP.seR(100);

// hook up components with nodal, it creates a output 3-port named "wilkinson"
var wilkinson = nP.nodal([tee, 1,2,3],[t70,3,5],[t70,2,4],[tee,9,7,5],[tee,8,4,6],[r100,8,9],['out',1,7,6]);

// compute a table of s-pars to plot
var plot = wilkinson.out('s11dB','s21dB','s23dB');

// plot the frequency response
nP.lineChart({inputTable: [plot]});

		</script>
	</body>
</html>
```

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/ReadmeFigures/nodalSchematic.png></a>

nP.<b>lpfGen</b>(<i> filt = [50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50] </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/lpfGen.js "Source") Creates and returns a new nPort Object. The argument is an array of scaled low pass filter parameters generated by an nPort function such as chebyLPLCs. If no argument, the default value is [50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50].

The example below shows three ways of doing the same thing, as filt1 = filt2 = filt3 = filt4.
<br>filt1 is defined by the **cas** method</br>
<br>filt2 is defined by the **cascade** function</br>
<br>filt3 is defined by the **nodal** function</br>
<br>filt4 is defined by the **lpfGen** function

```html
<!--DOCTYPE html-->
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Low Pass  4 different ways</title>
	</head>
	<body>
		<svg id="canvas1" width="400" height="300"></svg>
		<svg id="canvas2" width="400" height="300"></svg>
		<svg id="canvas3" width="400" height="300"></svg>
		<svg id="canvas4" width="400" height="300"></svg>

		<script src="../dist/nP.js"></script>

		<script>

var g = nP.global;	
g.fList = g.fGen(50e6, 10e9, 50);

// create 9 2-ports. Each 2-port is part of a lowpass LC filter
var c1 = nP.paC(3.1716836788279897e-12);
var l1 = nP.seL(9.566513256241392e-9);
var c2 = nP.paC(5.6621309381827996e-12);
var l2 = nP.seL(1.0721164178932893e-8);
var c3 = nP.paC(5.8499784682761105e-12);
var l3 = nP.seL(1.0721164178932898e-8);
var c4 = nP.paC(5.662130938182797e-12);
var l4 = nP.seL(9.566513256241397e-9);
var c5 = nP.paC(3.171683678827988e-12);

// using nPort method, cas, to produce a single nPort for the entire filter
var filt1 = c1.cas(l1).cas(c2).cas(l2).cas(c3).cas(l3).cas(c4).cas(l4).cas(c5);
nP.lineChart({inputTable: [filt1.out('s11dB','s21dB')], canvasID: canvas1});

// using nPort function, cascade, to produce a single nPort for the entire filter.
var filt2 = nP.cascade (c1,l1,c2,l2,c3,l3,c4,l4,c5);
nP.lineChart({inputTable: [filt2.out('s11dB','s21dB')], canvasID: canvas2});

// using nPort function, nodal, to produce a single nPort for the entire filter.
var filt3 = nP.nodal([c1,1,2],[l1,2,3],[c2,3,4],[l2,4,5],[c3,5,6],[l3,6,7],[c4,7,8],[l4,8,9],[c5,9,10],['out',1,10]);
nP.lineChart({inputTable: [filt3.out('s11dB','s21dB')], canvasID: canvas3});

// using the nPort function, lpfGen, to produce a nPort for the entire filter
var filt4 = nP.lpfGen([50,
		3.1716836788279897e-12,
		9.566513256241392e-9,
		5.6621309381827996e-12,
		1.0721164178932893e-8,
		5.8499784682761105e-12,
		1.0721164178932898e-8,
		5.662130938182797e-12,
		9.566513256241397e-9,
		3.171683678827988e-12,
		50]);
nP.lineChart({inputTable: [filt4.out('s11dB','s21dB')], canvasID: canvas4});

		</script>
	</body>
</html>
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

nP.<b>paR</b>(<i> R = 75 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/paR.js "Source") Parallel resistor. Creates and returns a new nPort Object. If no argument, the default value is 75 Ohms.

nP.<b>seL</b>(<i> L = 5e-9 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seL.js "Source") Series Inductor. Creates and returns a new nPort Object. If no argument, the default value is 5e-9 Henries.

nP.<b>paL</b>(<i> L = 5e-9 </i>) [<>](https://github.com/JerrhhyWiltz/nP/blob/master/src/np-nport/src/rlc/seL.js "Source") Parallel Inductor. Creates and returns a new nPort Object. If no argument, the default value is 5e-9 Henries.

nP.<b>seC</b>(<i> C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/seC.js "Source") Series Capacitor. Creates and returns a new nPort Object. If no argument, the default value is 1e-12 Farads.

nP.<b>paC</b>(<i> C = 1e-12 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/paC.js "Source") Parallel capacitor. Creates and returns a new nPort Object. If no argument, the default value is 1e-12 Farads.

Ideal Transformers

nP.<b>trf</b>(<i> N = 0.5 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/trf.js "Source") Parallel capacitor. Creates and returns a new nPort Object. If no argument, the default value is turns ratio of N = 0.5 . N is also equal to N = sqrt(Zp/Zs), where Zp is primary impedance and Zs is the secondary impedance.

nP.<b>trf4Port</b>(<i> N = 0.5 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/trf.js "Source") Parallel capacitor. Creates and returns a new nPort Object. If no argument, the default value is turns ratio of N = 0.5 . <b>This is a 4 Port element.</b> The primary ports are 1 and 3 and the secondary ports are 2 and 4. N is also equal to N = sqrt(Zp/Zs), where Zp is primary impedance and Zs is the secondary impedance.

RLC with more than one component

The names may sound cryptic, but here is how to interpret them. The first two letters indicate that the 2-port is either a series or parallel 2-port. The third and forth letters indicate that the components are either in series or in parallel. The remaining letters are reference designators: RL, RC, LC, RLC.

```HTML
// seSeRL reads, "series, resistor inductor in series "
// paSeRL reads, "parallel, resistor inductor in series"
```

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/ReadmeFigures/seSeRL_paSeRL.png></a>

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

Ideal Transmission lines

nP.<b>tlin</b>(<i> Z = 60, Length = 0.5 * 0.0254 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/tlin/tlin.js "Source") An ideal two port transmission line. The tlin is lossless and the dielectric constant is 1.0 . Z is the characteristic impedance in Ohms, and Length is the physical length in meters. Creates and returns a new nPort Object. If no arguments, the default values are 60 Ohms, 0.5 * 0.0254 Meters.

nP.<b>tclin</b>(<i> Zoe = 100, Zoo = 30, Length = 1.47 * 0.0254 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/tlin/tclin.js "Source") An ideal four port coupled transmission line. The ports are numbered clockwise. Port 1 is the upper left, Port 2 is the upper right, Port 3 is the lower right, and Port 4 is the lower left. When the input is at Port 1, the through port is Port 2, the coupled port is Port 4, and the isolated port is Port 3. The tclin is lossless and the dielectric constant is 1.0 . Zoe is the even mode characteristic impedance in Ohms, Zoo is the odd mode characteristic impedance in Ohms, and Length is the physical length in meters. Creates and returns a new nPort Object. If no arguments, the default values are 100 Ohms, 30 Ohms, and 1.341 * 0.0254 Meters. Note: 1.341 * 0.0254 is the 1/4 wavelength at 2.2GHz. Here below is a coupled bandpass filter example.

```html
<!--DOCTYPE html-->
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Analysis parallel coupled filter</title>
	</head>
	<body>
		<script src="../dist/nP.js"></script>

		<script>

// this is for a quarter wave at 6GHz
var g = nP.global;	
g.fList = g.fGen(2000e6,10000e6,101);

// set up the couplers
var tclin1 = nP.tclin(79.667,37.834,0.491 * 0.0254);
var tclin2 = nP.tclin(60.866,42.505,0.491 * 0.0254);
var tclin3 = nP.tclin(79.667,37.834,0.491 * 0.0254);

// set up the open
var open = nP.Open();

// set up the filter
var filt = nP.nodal([tclin1,1,2,3,4],[tclin2,3,5,6,7],[tclin3,6,8,9,10],[open,2],[open,4],[open,5],[open,7],[open,8],[open,10],['out',1,9]);
var filtOut = filt.out('s21dB','s11dB');

// set up plot
var plot = {
	inputTable: [filtOut],
};
nP.lineChart(plot);

		</script>
	</body>
</html>
```

Microstrip Transmission lines

nP.<b>mlin</b>(<i> Width = 0.98e-3, Height = 1.02e-3, Length = 0.5 * 0.025, Thickness = 0.0000125 * 0.054, er = 10, rho = 0, tand = 0.000 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/mlin/mlin.js "Source") A microstrip two port transmission line. Width is the strip width in meters, Height is the substrate height in meters. Length is the length in meters. er is the relative dielectric constant. rho is the loss relative to copper. tand is the dielecric loss tangent. Dispersion is factored in, Skin effect is not.

### Connections

Connections are 3-Port and n-Port "dummy" components. Using these connections enables 2-Port components to be connected together to form more complex circuits such as power dividers.

nP.<b>Tee</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/connections/Tee.js "Source") Creates a new nPort Object and returns the s parameters of a 3-Port Tee connector. No argument required. See above wilkinson example

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

m.<b>out</b>(<i></i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that shows the matrix. Useful for viewing matrices in the console.

m.<b>showMatrix</b>(<i>myArray</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that creates and appends a HTML div element and renders a table showing the matrix elements. This might be useful, like console.log is, for troubleshooting problems.

```html
// using showMatrix with a Matrix Object
var myMatrix = nP.matrix([[2],[3]]);
nP.showMatrix(myMatrix.m);

// using showMatrix with an array argument
var myArray = [[2],[3]];
nP.showMatrix(myArray);
```

m.<b>showMatrixCplx</b>(<i>myComplexArray </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that creates and appends a HTML div element and renders a table showing the matrix elements. This might be useful, like console.log is, for troubleshooting problems.

m.<b>showBreakText</b>(<i>text</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that creates and appends a HTML div element showing the text. This might be useful, like console.log is, for troubleshooting problems and troubleshooting labeling.

m.<b>showCountNum</b>(<i>number</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") Method that creates and appends a HTML div element showing the number. This might be useful, like console.log is, for troubleshooting problems and troubleshooting labeling.

## nP-chart

nP.<b>lineChart</b>(<i> lineChartInputObject = {} </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-chart/src/lineChart.js) A function that draws a rectangular chart or plot. lineChart() will render the graphics in svg. nPort has an internal subset of [d3, Data-Driven Documents](https://d3js.org/). There is no need to include d3 in your code. If you don't provide a svg, linechart() will create one for you. The default element ID is "canvas". If you provide the svg, <b>you must specify an ID, width, and height attributes</b>, such as:

```<svg id="myCanvas" width="400" height="300"></svg>```

If you do not give an argument linePlot, it will display a default plot in a default svg that it created. This is good for setting up your page and you can see what it will like. Here is an ```html``` example for the default lineChart().

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Default lineChart()</title>
	</head>
	<body>
		<script src="nP.js"></script>
		<script>

nP.lineChart();  // shows default plot 

		</script>
	</body>
</html>
````

lineChart(lineChartInputObject = \{ \} ) has one argument named "lineChartInputObject" and is used twice in the example below. There are two svg elements with two corresponding id's. There are two object variables created, oneCircuit and twoCircuits. Notice for twoCircuits, we are using ```filter``` again and are charting a simple ```attenuator``` as well.

```HTML
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>lineChart</title>
	</head>
	<body>
		<svg id="canvas1" width="400" height="300"></svg>
		<svg id="canvas2" width="400" height="300"></svg>
		<script src="nP.js"></script>

		<script>

// Set up the first requency range
var g = nP.global;	
g.fList = g.fGen(50e6, 10e9, 51);

// 9 section low pass filter
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

// create the lineChartInputObject
var oneCircuit = {
	canvasID: '#canvas1',
	inputTable: [filter]
};

// plot
nP.lineChart(oneCircuit);

// set up the second frequncy range
g.fList = g.fGen(4e9, 14e9, 11);

// 3 section attenuator
var r1 = nP.paR(300);
var r2 = nP.seR(30);
var r3 = nP.paR(300);
var attenuator = r1.cas(r2).cas(r3).out('s11dB','s21dB');

// create the lineChartInputObject for two circuits: the filter and the attenuator
var twoCircuits = {
	canvasID: '#canvas2',
	inputTable: [filter, attenuator],
	xRange: [0,16e9],
	yRange: [20,-200]
};

// plot
nP.lineChart(twoCircuits);

		</script>
	</body>
</html>
```

Here is full the format of the LineChart Object, it has key-value pairs in the following order:

```html
lineChartInputObject = {
lineChartInputObject.inputTable:	// an array [out1, out2 ... outn]
lineChartInputObject.canvasID,		// a string of an svg id '#canvas'
lineChartInputObject.metricPrefix:	// a string of a metric prefix
lineChartInputObject.xAxisTitle:	// a string of the x axis title
lineChartInputObject.yAxisTitle:	// a string of the y axis title
lineChartInputObject.xRange:		// an array of [min, max]
lineChartInputObject.yRange:		// an array of [min, max]
}
```
Here are the default values for the lineChartInputObject:
```html
lineChartInputObject.inputTable:	[ 
		[
			['Freq', 'Insertion Loss', 'Return Loss'],
			[ 8 * 1e9,  22,  40],
			[12 * 1e9,  80,  90],
			[16 * 1e9, 100, 105],
			[20 * 1e9, 120, 130]
		],

		[
			['Freq', 'Noise Figure', 'IP3'],
			[12 * 1e9,  60, 65],
			[16 * 1e9,  65, 70],
			[20 * 1e9,  70, 75]
		]
	];

lineChartInputObject.canvasID: '#canvas'
lineChartInputObject.metricPrefix: 'giga'
// others are: 'mega', 'kilo', 'none', 'deci', 'milli', 'micro', 'nano', and 'pico'
// metricPrefix: 'giga' means 10e9 Hz is displayed as 10 on the x axis.
lineChartInputObject.xAxisTitle: 'Frequency'
lineChartInputObject.yAxisTitle: 'dB'
lineChartInputObject.xRange: // default determined from inputTable
lineChartInputObject.yRange: //default determined from inputTable
```