## nPort: A Microwave Circuit Analysis Program

**nP** is a JavaScript library for analyzing microwave circuits. It helps you learn about, analyze and visualize the operation of various RF multiport circuits.

**nPort** creates one JavaScript global variable, **nP**.

## API Reference

* [nP-global](#nP-global)
* [nP-nport](#nP-nport)
* [nP-RLC](#nP-RLC)
* [nP-Transformers](#nP-Transformers)
* [nP-Lowpass](#nP-Lowpass)
* [nP-Open-Short-Load](#nP-Open-Short-Load)
* [nP-Connections](#nP-Connections)
* [nP-Transmission-Lines](#nP-Transmission-Lines)
* [nP-Microstrip](#nP-Microstrip)
* [nP-math](#nP-math)
* [nP-chart](#nP-chart)

---
## How to Download 

* Create a new folder named "nPort"
* Download nPort by clicking [here](https://raw.githubusercontent.com/JerryWiltz/nP/master/dist/nP.js)", then Save as... "nP.js" and put it in the "nPort" folder. 
* Create the file below and name it "index.html" and put it in the "nPort" folder.
* Run "index.html". I recommend Chrome. You should see <b>Hello, nPort!</b> After that, you are ready to go.

### Here below is an html page for "Hello, nPort!"

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
		
nP.log('Hello, nPort!');

		</script>
	</body>
</html>
```

---
 
## nP-global
As **nPort** analyses in the frequency domain, it requires at least one frequency point to do anything. **nPort** has a default frequency of 2e9 or 2GHz. Therefore, you must specify either a single frequency or a list of frequencies to give **nPort** the domain it needs. The frequency or frequencies must be in an array. The units must by in Hz. Suppose you require a frequency list with 1001. There is a function, fGen(), that will create long arrays for you.

nP.<b>global</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-global/src/global.js "Source")

The nPort Object that contains the Frequency, Zo, and Temperature values. There is also a member function that generates frequencies, always in Hz, in the form of fStart, fStop, and the number of points.

nP.<b>fGen</b>(<i> fStart, fStop, points </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-global/src/global.js "Source")

Returns an array of frequencies from fStart to fStop. The number of points is limited by memory or execution time. Popular number of points are odd numbers because the center frequency is always produced. So the number of points like 11, 51, 101, 1001, and so on, are good. 

### Here below is an example on how to create a list with 21 points.

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Frequency List</title>
	</head>
	<body>
		<script src="./nP.js"></script>
		<script>
		
var g = nP.global;
g.fList = g.fGen(.1e9,10e9,21); // 21 points from 100 MHz to 10 GHz

nP.log('g.fList is an array, [f1, f2, ... flast].');
nP.log('nP.log lists arrays downwards since they can be long');
nP.log(g.fList);

		</script>
	</body>
</html>
```
---

## nP-nPort

<b>nPort</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") Any RF device input/output or RF system inputs/outputs is an nPort. An nPort may have up to and including 9 ports maximum. However, most of nPorts will have 1, 2, 3, or 4 ports. For example, an RF short is a 1 port device. A simple 2 way power divider is a 3 port device. An ideal RF transformer could have either 2 or 4 ports. At the other extreme, a switched filter bank with 1 input and 8 outputs is a 9 port device. 

### nPort Methods

nPort methods operate on nPort Objects. All nPort Objects have these methods. nPort.cas() returns a new nPort Object enabling method chaining.

nPort.<b>setglobal</b> (<i> global </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") sets the global variables of an nPort: fList, Ro, and Temp mentioned above 

nPort.<b>getglobal</b> [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") gets the global variables of an nPort

nPort1.<b>cas</b> (<i> nPort2 </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") cascades two 2-ports and creates a new nPort. Method chaining enabled.

nPort.<b>out</b> (<i> 'sij|mag|dB|ang|Re|Im', ' ... ' </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/nPort.js "Source") Creates an output data set that can be plotted with nP.lineChart() or can be seen in a table with nP.lineTable(). Arguments must be in quotes and separated by commas. For example for a filter 2-port named, ```filt1```, to specify an out(), the syntax would be,  ```filt1.out('s11mag','s11dB','s22ang')```.

* <b>mag</b> the magnitude of a complex number, such as an s-parameter
* <b>ang</b> the angle
* <b>dB</b> the magnitude in dB
* <b>Re</b> the real part
* <b>Im</b> the imaginary part

### Here is an example of nP.out() below

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>nP.out()</title>
	</head>
	<body>
		<script src="./nP.js"></script>
		<script>
		
var g = nP.global;
g.fList = [2e9, 4e9]; // 1 frequency set to 2GHz

var r1 = nP.seR(75);
var s11 = r1.out('s11mag');

nP.log('The s-parameter, s11, of a 75 ohm resistor in series');
nP.log(s11);

nP.log('Same thing using nP.lineTable')
nP.lineTable({inputTable: [s11]});

		</script>
	</body>
</html>
```

### nPort Functions

nPort functions are not members of nPort, but they operate on nPort objects. Two general purpose functions are cascade and nodal. 

nP.<b>cascade</b> (<i> ... nPorts </i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/combining/cascade.js "Source") cascades a list of comma separated nPorts and returns a new nPort Object. nPort.cascade accepts 2-ports only and creates a new 2-port that is the cascade of all the individual 2-ports.

nP.<b>nodal</b> (<i>[nPort1, node1, node2, ...],[nPort2, node2, node3], ... ['out',  node1, node3]</i>)[<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/combining/nodal.js "Source") Enables complex interconnections of nPorts. The argument of nodal is a list of arrays separated by commas. Each array has the name of an nPort followed the node numbers separated by commas. The last array is output, it must have the syntax  ['out', nodes]. nP.nodal creates a new nPort Object. The example below shows the html, schematic, and output plot of a 6GHz Wilkinson Power Divider. Follow the details in the schematic to set up nP.node(). Note the notation of ports and nodes between the html listing and the schematic. Check the listing,  ```...,[tee,9,7,5],...``` and in the schematic. Node 9 is connected to the node 1 of the tee. Node 7 is connected to node 2 of the tee. Node 5 is connected to node 3 of the tee. The final result is a 3-port named, ```wilkinson```. Node 1 of the input is node 1 of ```wilkinson```, Node, 7 of the input is node 2 of ```wilkinson```. Node 3 of ```wilkinson``` is node 6 of the input.

### An nPort Functions example, a wilkinson power divider

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Wilkinson</title>
	</head>
	<body>
		<script src="./nP.js"></script>
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
nP.lineChart({inputTable: [plot], yRange: [-60, 5], chartTitle: 'Wilkinson Power Divider'});

		</script>
	</body>
</html>
```
### Here is the schematic and output plot for a wilkinson power divider.

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/HTMLs/readme-image/wilkinson.png></a>


### An nPort Functions example, a lowpass filter solved 4 ways

The example below shows three ways of doing the same thing, as filt1 = filt2 = filt3 = filt4.
<br>filt1 is defined by the **cas** method</br>
<br>filt2 is defined by the **cascade** function</br>
<br>filt3 is defined by the **nodal** function</br>
<br>filt4 is defined by the **lpfGen** function</br>

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Low Pass solved 4 ways</title>
	</head>
	<body>
		<svg id="chart1" width="400" height="300"></svg>
		<svg id="chart2" width="400" height="300"></svg>
		<svg id="chart3" width="400" height="300"></svg>
		<svg id="chart4" width="400" height="300"></svg>

		<script src="./nP.js"></script>
		<script>

var g = nP.global;	
g.fList = g.fGen(50e6, 3e9, 50);

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
nP.lineChart({inputTable: [filter1.out('s11dB','s21dB')], chartID: 'chart1', chartTitle:'Solved by nP.cas()'});

// using 'cascade' to define filter2
var filter2 = nP.cascade (c1,l1,c2,l2,c3,l3,c4,l4,c5);
nP.lineChart({inputTable: [filter2.out('s11dB','s21dB')], chartID: 'chart2', chartTitle:'Solved by nP.cascade()'});

// using 'nodal' to define filter3
var filter3 = nP.nodal([c1,1,2],[l1,2,3],[c2,3,4],[l2,4,5],[c3,5,6],[l3,6,7],[c4,7,8],[l4,8,9],[c5,9,10],['out',1,10]);
nP.lineChart({inputTable: [filter3.out('s11dB','s21dB')], chartID: 'chart3', chartTitle:'Solved by nP.nodal()'});

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
nP.lineChart({inputTable: [filter4.out('s11dB','s21dB')], chartID: 'chart4',chartTitle:'Solved by nP.lpfGen()'});

		</script>
	</body>
</html>
```
### Here is the schematic and output plots for the lowpass filter.

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/HTMLs/readme-image/lpf4ways.png></a>

---

## nP-RLC

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

### RLC's with more than one component

The names may sound cryptic, but here is how to interpret them. The first two letters indicate that the 2-port is either a series or parallel 2-port. The third and forth letters indicate that the components are either in series or in parallel. The remaining letters are reference designators: RL, RC, LC, RLC.

```HTML
// seSeRL reads, "series, resistor inductor in series "
// paSeRL reads, "parallel, resistor inductor in series"
```

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/HTMLs/readme-image/seSeRL_paSeRL.png></a>

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

---

## nP-Transformers

nP.<b>trf</b>(<i> N = 0.5 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/trf.js "Source") Parallel capacitor. Creates and returns a new nPort Object. If no argument, the default value is turns ratio of N = 0.5 . N is also equal to N = sqrt(Zp/Zs), where Zp is primary impedance and Zs is the secondary impedance.

nP.<b>trf4Port</b>(<i> N = 0.5 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/trf.js "Source") Parallel capacitor. Creates and returns a new nPort Object. If no argument, the default value is turns ratio of N = 0.5 . <b>This is a 4 Port element.</b> The primary ports are 1 and 3 and the secondary ports are 2 and 4. N is also equal to N = sqrt(Zp/Zs), where Zp is primary impedance and Zs is the secondary impedance.

---

## nP-Lowpass

This section has chebychev low pass filter synthesis functions

nP.<b>chebyLPNsec</b>(<i> passFreq = .2, rejFreq = 1.5, ripple = 0.1, rejection = 30 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-lowpass-prototype/src/chebyLPNsec.js "Source") A function that computes and returns the number of sections in a Chebychev Low Pass filter prototype given the pass frequency, the rejection frequency, ripple, and rejection level. The default values are shown in the function argument.

nP.<b>chebyLPgk</b>(<i> n = 3, ripple = 0.1 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-lowpass-prototype/src/chebyLPgk.js "Source") A function that computes and returns an array of the gk values in a Chebychev Low Pass filter prototype given the number of sections and ripple. The default values are shown in the function argument.

nP.<b>chebyLPLCs</b>(<i> cheby = [1, 1.0315851425078764, 1.1474003299537219, 1.0315851425078761, 1], maxPassFrequency = 0.2e9, zo = 50) </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-lowpass-prototype/src/chebyLPLCs.js "Source") A function that computes and returns an array of the C-L-C ... values in a Chebychev Low Pass filter prototype given an array of the gk values. The default values are shown in the function argument.

nP.<b>lpfGen</b>(<i> filt = [50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50] </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/rlc/lpfGen.js "Source") Creates and returns a new nPort Object. The argument is an array of scaled low pass filter parameters generated by an nPort function such as chebyLPLCs. If no argument, the default value is ```[50, 1.641818746502858e-11, 4.565360855435164e-8, 1.6418187465028578e-11, 50]```.

---

## nP-Open-Short-Load
### These are ideal one-ports

nP.<b>Open</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/openShortLoad/Open.js "Source") Creates and returns a new nPort Object of a one port Open. No argument required.

nP.<b>Short</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/openShortLoad/Short.js "Source") Creates and returns a new nPort Object of a one port Short. No argument required.

nP.<b>Load</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/openShortLoad/Load.js "Source") Creates and returns a new nPort Object of a one port Load. No argument required.

---

## nP-Connections

Connections are 3-Port and n-Port "dummy" components. Using these connections enables 2-Port components to be connected together to form more complex circuits such as power dividers.

nP.<b>Tee</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/connections/Tee.js "Source") Creates and returns a new nPort Object of 3-port interconnect, a 3 input junction. Valid only with nP.nodal(). See the wilkinson example. No argument required, must use nP.nodal().

nP.<b>Tee4</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/connections/Tee4.js "Source") Creates and returns a new nPort Object of 4-port interconnect, a 4 input junction. Valid only with nP.nodal(). No argument required, must use nP.nodal().

nP.<b>Tee5</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/connections/Tee5.js "Source") Creates and returns a new nPort Object of 5-port interconnect, a 5 input junction. Valid only with nP.nodal(). No argument required, must use nP.nodal().

nP.<b>SeriesTee</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/connections/seriesTee.js "Source") Creates and returns a new nPort Object of 3-port interconnect. Ports 1 and 2 are input and outputs. Port 3 is the series port. Valid only with nP.nodal(). No argument required, must use nP.nodal().

### Compare attenuator analysis results with and without nP.seriesTee()

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>seriesTee</title>
	</head>
	<body>
		<script src="./nP.js"></script>
		<script>

var g = nP.global;	
g.fList = [2e9]; // 2GHz

// define the resistors for the attenuator
var r1 = nP.paR(292.4);
var r2 = nP.seR(17.6);
var r3 = nP.paR(292.4);

// using cas to combine the 2-ports
var attn1 = r1.cas(r2).cas(r3);
var attn1Out = attn1.out('s21dB','s11dB');
nP.lineTable({inputTable: [attn1Out], tableTitle:'Solved by nP.cas()'});

// define the seriesTee and open
var tee = nP.seriesTee();
var open = nP.Open();
var r4 = nP.paR(17.6); // note, the 17.6 ohm resistor must be a parallel 2-port!

// use nodal to combine the 2-ports
var attn2 = nP.nodal([r1,1,2], [tee,2,3,4], [r4,4,5], [open,5], [r3,3,6], ['out',1,6]);
var attn2Out = attn2.out('s21dB','s11dB');
nP.lineTable({inputTable: [attn2Out], tableTitle:'seriesTee realization solved with nP.nodal()'});

		</script>
	</body>
</html>
```

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/HTMLs/readme-image/seriesTeeAnalysis.png></a>

---

## nP-Transmission-lines

nP.<b>tlin</b>(<i> Z = 60, Length = 0.5 * 0.0254 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/tlin/tlin.js "Source") An ideal two port transmission line. The tlin is lossless and the dielectric constant is 1.0 . Z is the characteristic impedance in Ohms, and Length is the physical length in meters. Creates and returns a new nPort Object. If no arguments, the default values are 60 Ohms, 0.5 * 0.0254 Meters.

nP.<b>tclin</b>(<i> Zoe = 100, Zoo = 30, Length = 1.47 * 0.0254 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/tlin/tclin.js "Source") An ideal four port coupled transmission line. The ports are numbered clockwise. Port 1 is the upper left, Port 2 is the upper right, Port 3 is the lower right, and Port 4 is the lower left. When the input is at Port 1, the through port is Port 2, the coupled port is Port 4, and the isolated port is Port 3. The tclin is lossless and the dielectric constant is 1.0 . Zoe is the even mode characteristic impedance in Ohms, Zoo is the odd mode characteristic impedance in Ohms, and Length is the physical length in meters. Creates and returns a new nPort Object. If no arguments, the default values are 100 Ohms, 30 Ohms, and 1.341 * 0.0254 Meters. Note: 1.341 * 0.0254 is the 1/4 wavelength at 2.2GHz. 

### Here below is a coupled bandpass filter example.

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Edge coupled filter</title>
	</head>
	<body>
		<script src="./nP.js"></script>
		<script>

// this is for a quarter wave at 6GHz
var g = nP.global;	
g.fList = g.fGen(4e9,8e9,21);

// set up the couplers
var tclin1 = nP.tclin(79.667,37.834,0.491 * 0.0254);
var tclin2 = nP.tclin(60.866,42.505,0.491 * 0.0254);
var tclin3 = nP.tclin(79.667,37.834,0.491 * 0.0254);

// set up the open
var open = nP.Open();

// set up the filter
var filt = nP.nodal([tclin1,1,2,3,4],[tclin2,3,5,6,7],[tclin3,6,8,9,10],[open,2],[open,4],[open,5],[open,7],[open,8],[open,10],['out',1,9]);
var filtOut = filt.out('s21dB','s11dB');

// set up the plot
var plot = {chartTitle:'Edge Coupled Filter', inputTable: [filtOut]};

// plot the data
nP.lineChart(plot);

// set up the table
var table = {tableTitle:'Edge Coupled Filter', inputTable: [filtOut]};

// tabulate the data
nP.lineTable(table);

		</script>
	</body>
</html>
```
### Here is the schematic and output plots for the edge coupled filter.

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/HTMLs/readme-image/edgeCoupledFilter.png></a>

---

## nP-Microstrip

nP.<b>mlin</b>(<i> Width = 0.98e-3, Height = 1.02e-3, Length = 0.5 * 0.025, Thickness = 0.0000125 * 0.054, er = 10, rho = 0, tand = 0.000 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-nport/src/mlin/mlin.js "Source") A microstrip two port transmission line. Width is the strip width in meters, Height is the substrate height in meters. Length is the length in meters. er is the relative dielectric constant. rho is the loss relative to copper. tand is the dielecric loss tangent. Dispersion is factored in, Skin effect is not.

---

## nP-math
### nP.complex

The following complex number library is not needed to use nPort. However, nPort provides a basic complex number class object.

nP.<b>complex</b>(<i>x, y</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Initializes and returns a <b>Complex</b> object containing the property names <b>x</b> and <b>jy</b>. Here is a script you could use. 

c.<b>getR</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that gets the real part of a complex number.

c.<b>getI</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that gets the imaginary part of a complex number.

c.<b>setR</b>(<i> real </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that sets the real part of a complex number.

c.<b>setI</b>(<i> imaginary </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that sets the imaginary part of a complex number.

c.<b>add</b>(<i> c2 </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that adds two complex numbers, c1 and c2, and returns a Complex object. c1 is implied by the 'dot' that calls the method. Method chaining capable.

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

nP.<b>coshCplx</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source") Method that returns the complex hyperbolic cosine of a complex number and returns a Complex object. Method chaining capable.

### Here are some examples of complex number arithmetic

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Complex</title>
	</head>
	<body>
		<script src="./nP.js"></script>
		<script>

// define some complex numbers
var c1 = nP.complex(1,2);
var c2 = nP.complex(2,3);
var c3 = nP.complex(5,-7);

// use nP.log to show c3
nP.log('show c3 = nP.complex(5,-7)');
nP.log(c3); 

nP.log('--------');

// get and show the real part of c2
nP.log('show the real part of c2');
var realPartOfc2 = c2.getR();
nP.log(realPartOfc2);

nP.log('--------');

// in one step, set and show a new imaginary part of c1
nP.log('change the imaginary part of c1 to 42 in one step');
nP.log( c1.setI(42).getI() );

nP.log('--------');

// perform multiple operations with method chaining
nP.log('demo method chaining in one step');
nP.log( c1.add(c1).sub(c2).mul(c3) ); 

nP.log('--------')

// hyperbolic complex sin and cos functions used for transmission lines
var C = nP.complex(1,2);
var gamma = nP.complex(3,4);
var B = nP.complex(5,6);
Ds = C.mul(gamma.coshCplx()).add(B.mul(gamma.sinhCplx()));
nP.log('an example to show that coshCplx and sinhCplx work together');
nP.log(Ds); // 21.557232562315377 -j98.12775767092192}

		</script>
	</body>
</html>
```

### nP.matrix

The following matrix library is not needed to use nPort. However, nPort provides a basic matrix arithmetic class object. This class performs matrix addition, subtraction and inversion with <b>real numbers</b> or with <b>complex numbers</b>. Lastly, there are Gaussian elimination methods for matrices with real or complex numbers. 

nP.<b>matrix</b>(<i> [ [array row 1], [array row 2], ... [array row n] ] </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") A Constructor that is passed a table and returns a matrix object.

nP.<b>dimension</b>(<i> rows, cols, initial </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") A Function that <b>creates a matrix object</b> with rows and cols with an initial value such a 0, or 1, or "text", or a complex number nP.complex(1,). Note, dim does not create a matrix object, but it can be the argument that is passed to the matrix constructor.

nP.<b>copyMatrix</b>(<i></i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/matrix.js "Source") A Method that makes a copy of an existing matrix. <b>Use this</b> to duplicate matrices.

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

### Here are some examples of Matrix arithmetic

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>Matrix</title>
	</head>
	<body>
		<script src="./nP.js"></script>
		<script>

// real numbers
nP.log('define and show the 3 by 3 matrix, a');
var a = nP.matrix([
	[3,5,2],
	[0,8,2],
	[6,2,8]
]);
nP.log(a);

nP.log('--------');

nP.log('perform matrix operations with method chaining for matrix, b');
var b = a.invert().mul(nP.matrix([[8],[-7],[26]]));
nP.log(b);

nP.log('--------');

nP.log('define matrix c, and d; show matrix d');
var c = nP.matrix([[1]]);
var d = c.add(c).add(c).add(c);
nP.log(d);

nP.log('--------');

// complex numbers
nP.log('define and show the 3 by 3 matrix with complex numbers, e');
var e = nP.matrix([
	[nP.complex(3,0), nP.complex(5,0), nP.complex(2,0)],
	[nP.complex(0,3), nP.complex(8,0), nP.complex(2,0)],
	[nP.complex(6,0), nP.complex(2,0), nP.complex(8,-1)]
]);
nP.log(e);

nP.log('--------');

nP.log('perform operations on matrices with complex numbers with method chaining');
var f = e.invertCplx().mulCplx(nP.matrix([[nP.complex(8,0)],[nP.complex(-7,0)],[nP.complex(26,0)]]));
nP.log(f);

		</script>
	</body>
</html>
```

---

## nP-chart
### nP.lineChart

nP.<b>lineChart</b>(<i> lineChartInputObject = \{ \} </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-chart/src/lineChart.js) is a function that draws a chart in a html page. It is based on [d3, Data-Driven Documents](https://d3js.org/). If you don't provide your own svg element, linechart() will create it for you. If you provide svg elements, <b>you must specify a unique ID, width, and height attributes for each svg you create</b>, such as:

```html
<svg id="myChart" width="400" height="300"></svg>```


lineChartInputObject = {
inputTable : [out1, out2 ... outn],
// an array of outs, default is an internal inputTable

chartID : 'chart',
// a string id, default is 'chart1'

metricPrefix : 'giga',
// a string of a metric prefix ,  default is 'giga'
// Note the prefixes for the ```metricPrefix
//'giga', 'mega', 'kilo', 'none', 'deci', 'centi', 'milli', 'micro', 'nano', and 'pico'

chartTitle : '',
// a string of the chart title; default is blank

xAxisTitle : 'Frequency',
// a string of the x axis title; default is 'Frequency'

yAxisTitle : 'dB',
// a string of the y axis title; default is 'dB'

xRange : [min,max],
// an array of min, max such as [2e9, 12e9]; default is autorange based on data

yRange : [min,max],
// an array of min, max such as [0, -80]; default is autorange based on data

showPoints : 'show',
// a string with either 'show' or 'hide', if not specified, default is 'show'

showLables : 'show',
// a string with either 'show' or 'hide', if not specified, default is 'show'

traceColor: 'color',
// a string with either 'color' or 'gray', if not specified, default is 'color'
}
```

If you do not provide a ```lineChartInputObject``` argument, lineChart() will display its default plot that is good for setting up your html page so you can see how it looks.

Here is the default lineChart(), it generates an svg element that has 400px in width and 300px in height. When the cursor is moved over a data point, it turns black and the values are shown at the lower right corner of the chart. In this case, the values are 7.2GHz and -19.3dB. If you click on a point, it stays black and shows the values at the bottom. <b>Click it again</b> to make revert to the original color. Next, <b>To convert it into a PNG</b> for a "Save image as ..." to file, click on the square at the upper right corner of the chart, then move the cursor over any part of the image and perform a "Save image as..." to file. 

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>lineChart Default</title>
	</head>
	<body>
		<script src="./nP.js"></script>

		<script>

nP.lineChart();

		</script>
	</body>
</html>
```

### Here is the default nP.lineChart output

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/HTMLs/readme-image/lineChartDefault.png></a>

### nP.lineTable

nP.<b>lineTable</b>(<i> lineTableInputObject = \{ \} </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-chart/src/lineTable.js) A function that produces a table of data. <b>You can click and drag across the table</b> to copy and paste to a spreadsheet. Also, you can <b>create an png</b> for table and perform a "Save image as ..." to file the way you can for lineChart. If you don't provide your own svg element, lineTable() will create it for you. If you provide svg elements, <b>you must specify a unique ID, width, and height attributes for each svg you create</b>, such as:

```html
<svg id="myTable" width="400" height="300"></svg>

lineTableInputObject = {
inputTable : [out1, out2 ... outn],
// an array of outs, default is an internal inputTable

tableID : 'chart',
// a string id, default is 'chart1'

metricPrefix : 'giga',
// a string of a metric prefix ,  default is 'giga'
// Note the prefixes for the ```metricPrefix
//'giga', 'mega', 'kilo', 'none', 'deci', 'centi', 'milli', 'micro', 'nano', and 'pico'

tableTitle : '',
// a string of the chart title; default is blank

headColor : 'color',
// a string with either 'color' or 'gray', if not specified, default is 'color'

tableWH : 'no',
// a string with either 'no' or 'yes'. if set to 'yes', an alert box is shown that has the Width and the Height of the svg containing the table, if not specified, default is 'no'
}
```
If you do not provide a ```lineTableInputObject``` argument, lineTable() will display its default plot that is good for setting up your html page so you can see how it looks.

Here is the default lineTable(), it generates an svg element that has 350px in width and 503px in height. <b>To convert it into a PNG</b> for a "Save image as ..." to file, click on the square at the upper right corner of the chart, then move the cursor over any part of the image and perform a "Save image as..." to file. 

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>lineTable Default</title>
	</head>
	<body>
		<script src="./nP.js"></script>

		<script>

nP.lineTable();

		</script>
	</body>
</html>

```
Unlike lineChart, where you can set the size in advance, lineTable does not know its size until it is rendered. As columns and rows are created, the svg is sized appropriately. To find out what the final size is, use the key-value pair, tableWH: 'yes', of the inputTableInputObject.

### Here is the default nP.lineTable output

<a href="https://github.com"><img src=https://github.com/JerryWiltz/nP/blob/master/HTMLs/readme-image/lineTableDefault.png></a>

### nP.log

nP.<b>log</b>(<i> input </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-chart/src/log.js) A function that proforms a <b>console.log</b> function that logs to your web page rather than in the console. It take one parameter called ```input```. It can be <b>helpful in troubleshooting</b> such as easily examining the contents of arrays and matrices containing complex numbers. It can be any of the the following data types:
```
a 'string'
a number
a boolean
an array // logs arrays downward, not across
a Complex // from nP.complex()
a Matrix // from nP.matrix()
an out // from nP.out()
```
You can pass any function as an input that returns any of the above data types, for example these are all valid:
```
nP.log(Math.sqrt(2)) // 1.414
nP.log(nP.complex(1,2)) // 1.000 + j2.000
nP.log(4<2) // false