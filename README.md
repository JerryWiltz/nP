<b>nPort</b>: A Microwave Circuit Analysis Program

**nP** is a JavaScript library for analyzing microwave circuits. It helps you learn about, analyze and visualize the operation of various RF multiport circuits.

**nPort** creates one JavaScript global variable, **nP**.

## Downloading and Verifying nPort 

Download, **nPort**, then run the  "Hello, nPort!" example below to verify installation.

* Create a new folder named "nPort"
* Download nPort by clicking [here](https://raw.githubusercontent.com/JerryWiltz/nP/master/dist/nP.js)", then Save as... "nP.js" and put it in the "nPort" folder. 
* Create the file below and name it "index.html" and put it in the "nPort" folder.
* Run "index.html". I recommend Chrome. You should see <b>Hello, nPort!</b> After that, you are ready to go.

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

nPort.<b>out</b> (<i> 'sij|mag|dB|ang|Re|Im', ' ... ' </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") Creates an output data set that can be plotted with nP.lineChart() or can be seen in a table with nP.lineTable(). Arguments must be in quotes and separated by commas. For example for a filter 2-port named, ```filt1```, to specify an out(), the syntax would be,  ```filt1.out('s11mag','s11dB','s22ang')```.

* <b>mag</b> the magnitude of a complex number, such as an s-parameter
* <b>ang</b> the angle
* <b>dB</b> the magnitude in dB
* <b>Re</b> the real part
* <b>Im</b> the imaginary part

Here is an example below.

```html
r1.out('s11mag')
// if r1 is an nPort for a 75 ohm resistor, the magnitude of s11 is returned.
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
		<svg id='tableSvg' width='10' height='10'></svg>
		<script src="nP.js"></script>

		<script>
// set up the frequencies
var g = nP.global;
g.fList = g.fGen(0e9,12e9,101);

// define the components of the power divider
var tee = nP.Tee();
var t70 = nP.tlin(70.7, 0.49 * 0.0254);
var r100 = nP.seR(100);

// hook up the components with nodal, it creates a output 3-port named "wilkinson"
var wilkinson = nP.nodal([tee, 1,2,3],[t70,3,5],[t70,2,4],[tee,9,7,5],[tee,8,4,6],[r100,8,9],['out',1,7,6]);

// create a data set of s-parameters to plot
var plot = wilkinson.out('s21dB','s23dB');

// plot the frequency response
nP.lineChart({inputTable: [plot], yRange: [-60, 0], titleTitle: 'Wilkinson Power Divider'});

		</script>
	</body>
</html>
```
Here is the schematic.

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/README/ReadmeFigures/wilkinsonSchematic.png></a>

Here is the plot.

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/README/ReadmeFigures/wilkinsonPlot.png></a>

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
		<svg id="chart1" width="400" height="300"></svg>
		<svg id="chart2" width="400" height="300"></svg>
		<svg id="chart3" width="400" height="300"></svg>
		<svg id="chart4" width="400" height="300"></svg>

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

// using 'cas' to define filter1
var filter1 = c1.cas(l1).cas(c2).cas(l2).cas(c3).cas(l3).cas(c4).cas(l4).cas(c5);
nP.lineChart({inputTable: [filter1.out('s11dB','s21dB')], chartID: 'chart1'});

// using 'cascade' to define filter2
var filter2 = nP.cascade (c1,l1,c2,l2,c3,l3,c4,l4,c5);
nP.lineChart({inputTable: [filter2.out('s11dB','s21dB')], chartID: 'chart2'});

// using 'nodal' to define filter3
var filter3 = nP.nodal([c1,1,2],[l1,2,3],[c2,3,4],[l2,4,5],[c3,5,6],[l3,6,7],[c4,7,8],[l4,8,9],[c5,9,10],['out',1,10]);
nP.lineChart({inputTable: [filter3.out('s11dB','s21dB')], chartID: 'chart3'});

// using 'lpfGen' to define filter4
var filter4 = nP.lpfGen([50,
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
nP.lineChart({inputTable: [filter4.out('s11dB','s21dB')], chartID: 'chart4'});

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

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/README/ReadmeFigures/seSeRL_paSeRL.png></a>

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
var plot = {inputTable: [filtOut]};

// plot the data
nP.lineChart(plot);

// put the data in a table
nP.lineTable(plot);

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

nP.<b>lineChart</b>(<i> lineChartInputObject = \{ \} </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-chart/src/lineChart.js) is a function that draws a chart in a html page. It is based on [d3, Data-Driven Documents](https://d3js.org/). If you don't provide your own svg element, linechart() will create it for you. If you provide svg elements, <b>you must specify a unique ID, width, and height attributes for each svg you create</b>, such as:

```<svg id="myChart" width="400" height="300"></svg>```

If you do not provide a ```lineChartInputObject``` argument, lineChart() will display its default plot that is good for setting up your html page so you can see how it looks.

Here is the default lineChart(), the svg it generates has 400 width and 300 height. <b>You can turn it into a PNG</b> for a Copy-Paste into another document or a Save-As file. To turn into PNG
click on the light blue square at the upper right corner of the chart. The PNG replaces the svg. On the screen, move the cursor over any part of the image and copy and paste or save as, as usual. 

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

nP.lineChart();

		</script>
	</body>
</html>
```

Here is the definition of the lineChartInputObject. Each of these has default setting.
```
lineChartInputObject.inputTable, is [out1, out2 ... outn]; default is internal inputTable
lineChartInputObject.chartID, string of an svg id; default is 'chart1'
lineChartInputObject.metricPrefix, string of a metric prefix ; default is 'giga'
lineChartInputObject.titleTitle, string of the chart title; default is ''
lineChartInputObject.xAxisTitle, string of the x axis title; default is 'Frequency'
lineChartInputObject.yAxisTitle, string of the y axis title; default is 'dB'
lineChartInputObject.xRange, array of min, max [2e9, 12e9]; default is autorange 
lineChartInputObject.yRange, array of min, max  [0, -80]; default is autorange
lineChartInputObject.showPoints, string 'show' or 'hide'; default is 'show'
lineChartInputObject.showLables, string 'show' or 'hide', default is 'show'
```
	
Here is an example of a fully defined lineChartInputObject. This is a 9 section Low Pass LC filter. As you can see, all of the possible inputs are specified.

```html
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>lineChart full lineChartInputObject</title>
	</head>
	<body>
		<svg id="chart1" width="600" height="400"></svg>
		<script src="nP.js"></script>

		<script>

// set up the first frequency range for the low pass filter
var g = nP.global;	
g.fList = g.fGen(50e6, 6e9, 101);

// components for a 9 section low pass filter
var c1 = nP.paC(3.1716836788279897e-12);
var l1 = nP.seL(9.566513256241392e-9);
var c2 = nP.paC(5.6621309381827996e-12);
var l2 = nP.seL(1.0721164178932893e-8);
var c3 = nP.paC(5.8499784682761105e-12);
var l3 = nP.seL(1.0721164178932898e-8);
var c4 = nP.paC(5.662130938182797e-12);
var l4 = nP.seL(9.566513256241397e-9);
var c5 = nP.paC(3.171683678827988e-12);
var filter = nP.cascade(c1,l1,c2,l2,c3,l3,c4,l4,c5);
var filterOut = filter.out('s11dB', 's21dB');

// create the lineChartInputObject for all inputs
var fullInputObject = {
	inputTable: [filterOut],
	chartID: 'chart1',
	metricPrefix: 'giga',
	titleTitle: 'Response of a 9 Section Lowpass LC filter',
	xAxisTitle: 'Input Frequency, GHz',
	yAxisTitle: 's11 and and s21, dB',
	xRange: [0,6e9],
	yRange: [0,-160],
	showPoints: 'hide',
	showLables: 'show'
};

// plot the filter response
nP.lineChart(fullInputObject);

		</script>
	</body>
</html>
```

nP.<b>lineTable</b>(<i> lineTableInputObject = \{ \} </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-chart/src/lineTable.js) A function that produces a table of data. <b>The table can selected, copied, and pasted into other places such as spreadsheets.</b> Most of the documentation and interface is similar to lineChart( ) above. lineTable() uses div elements rather than svg. If you don't provide a div element or elements, lineTable() will create them, for you. The default element ID is "table1". If you provide the div, <b>you must specify a unique ID attribute for every div you need</b>, such as:

```<div id="myTable"></div>```

If you do not provide the ```lineTableInputObject``` argument to lineTable(), it will display a default table in a div it created. This is good for setting up your page so you can see how it looks. Here is an ```html``` example for the default lineTable() output.

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

nP.lineTable();  // produces the default plot 

		</script>
	</body>
</html>
```