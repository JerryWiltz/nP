# nP
nP is short for nPort, a Microwave Circuit Analysis Program

## Installing

If you use NPM, `npm install nPort`. Otherwise, download the [latest release](https://github.com/JerryWiltz/nP/blob/master/dist/nP.js). A `nP` global is exported:

## nP.complex

```html
<script src="https://github.com/JerryWiltz/nP/blob/master/dist/nP.js"></script>
<script>
var c1 = nP.complex(2,3);    // this is c1 = 2 + i3
							 // note: Keyword "new" is not required
var c2 = nP.complex(5,-7);
var c3 = c1.add(c2).mul(c1); // method chaining
</script>
```
nP.<b>complex</b>(<i>x, y</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Initializes and returns a <b>Complex</b> object containing the property names <b>x</b> and <b>iy</b>. 

nP.<b>set</b>(<i>real, imaginary</i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that sets the properties x to real and y to imaginary, it is called by the Complex constructor; set does not method chain.

nP.<b>getR</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that gets the real part of a complex number.

```html
<script>
console.log(c1.getR( )); // 2
</script>
```

nP.<b>getI</b>(<i> </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that gets the imaginary part of a complex number.

nP.<b>setR</b>(<i> real </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that sets the real part of a complex number.

```html
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
<script>
Ds = C.mul(gamma.coshCplx()).add(B.mul(gamma.sinhCplx()));
</script>
```
nP.<b>coshCplx</b>(<i>  </i>) [<>](https://github.com/JerryWiltz/nP/blob/master/src/np-math/src/complex.js "Source")

Method that returns the complex hyperbolic cosine of a complex number and returns a Complex object. This enables method chaining.
