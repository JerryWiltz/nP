// nport.js
// This is going to be a big-ass file
// Continued from 11/2016 to now, 6/2017

define(['app/complex'], function (complex){
"use strict";
	var nport = function nport(...theArgs) {
	//e.g. var RLC1 = nport('RCL', 'series', 75, 5e-9, 1e-9, 2e9 );	

		var myArgs = theArgs,
			spars = [],// The nport s-parameters
			zpars = [],
			ypars = [],
			Zo = complex(50,0),   	// Default is 50 Ohms
			Yo = Zo.inv(),			// Default is 0.02 Mohos;
			one = complex(1,0),
			two = complex(2,0);

	// Begin the private component sparameter calculation section 
		var seriesRLCinSeries = function seriesRLCinSeries() {	
			var R = (myArgs[1]==='none') ? 0 : myArgs[1],
				L = myArgs[2]==='none' ? 0 : myArgs[2],
				C = myArgs[3]==='none' ? Infinity : myArgs[3],
				F = myArgs[4]==='none' ? 1 : myArgs[4],
				Z = complex(R, + 2*Math.PI*L*F  -1/(2*Math.PI*C*F)  ),				  
				s11 = Z.div(Z.add(Zo.add(Zo))),
				s21 = (two.mul(Zo)).div(Z.add(Zo.add(Zo))),
				s12 = s21,
				s22 = s11;
			spars = [[s11, s12],
					 [s21, s22]];
			};

		var parallelRLCinSeries = function parallelRLCinSeries() {	
			var R = (myArgs[1]==='none') ? 0 : myArgs[1],
				L = myArgs[2]==='none' ? 0 : myArgs[2],
				C = myArgs[3]==='none' ? Infinity : myArgs[3],
				F = myArgs[4]==='none' ? 1 : myArgs[4],
				Z = complex(R, + 2*Math.PI*L*F  -1/(2*Math.PI*C*F)  ),
				Y = Z.inv(),
				s11 = (Y.neg()).div(Y.add(Yo.add(Yo))),
				s21 = (two.mul(Yo)).div(Y.add(Yo.add(Yo))),  
				s12 = s21,
				s22 = s11;
			spars = [[s11, s12],
					 [s21, s22]];
			};

		var spar = function spar () {
			var mySpars = myArgs[1]
			spars = mySpars;
			};

		var nodal = function nodal() { // well, here we go, this is the BIG ONE!!
			var myNport = myArgs[1];
			spars = myNport.getSpars();
			};

		// this calls the 'constructor-type' functions, there are or will be lots of them!!					
		var typeNport =	function typeNport(nportName) {							
			var out = {
				'seriesRLCinSeries' :  function () {return seriesRLCinSeries();},		//nport(seriesRLCinSeries, R, L, C, F)
				'parallelRLCinSeries' : function () {return parallelRLCinSeries();},	//nport(parallelRLCinSeries, R, L, C, F)	
				'spar' : function () {return spar();}, 									// nport('spar', spar)
				'nodal' : function () {return nodal();}, 
			};
		return out[nportName]();
		};
		typeNport(myArgs[0]); // This calls the function

	// Begin output object functions 
		var getSpars = function getSpars() {
			return spars;
		};

		var getZpars = function getZpars() {
			return zpars;
		};

		var getYpars = function getYpars() {
			return ypars;
		};


		// convert to and from spars to zpars
		var s2z = function s2z () {
			var s11 = spars[0][0], s12 = spars[0][1], s21 = spars[1][0], s22 = spars[1][1],
				z11 = (((one.add(s11)).mul(one.sub(s22))).add(s12.mul(s21))).div(((one.sub(s11)).mul(one.sub(s22))).sub(s12.mul(s21))),
				z12 =                                         (two.mul(s12)).div(((one.sub(s11)).mul(one.sub(s22))).sub(s12.mul(s21))), 
				z22 = (((one.add(s22)).mul(one.sub(s11))).add(s12.mul(s21))).div(((one.sub(s11)).mul(one.sub(s22))).sub(s12.mul(s21))),
				z21 =                                         (two.mul(s21)).div(((one.sub(s11)).mul(one.sub(s22))).sub(s12.mul(s21)));
			zpars = [[z11, z12],
					 [z21, z22]]; 
		};

		var z2s = function z2s () {
			var z11 = zpars[0][0], z12 = zpars[0][1], z21 = zpars[1][0], z22 = zpars[1][1],
				s11 = (((z11.sub(one)).mul(z22.add(one))).sub(z12.mul(z21))).div(((z11.add(one)).mul(z22.add(one))).sub(z12.mul(z21))),
				s12 =                                         (two.mul(z12)).div(((z11.add(one)).mul(z22.add(one))).sub(z12.mul(z21))),
				s22 = (((z11.add(one)).mul(z22.sub(one))).sub(z12.mul(z21))).div(((z11.add(one)).mul(z22.add(one))).sub(z12.mul(z21))),
				s21 =                                         (two.mul(z21)).div(((z11.add(one)).mul(z22.add(one))).sub(z12.mul(z21)));
			spars = [[s11, s12],
					 [s21, s22]];		
		};


		// convert to and from spars to ypars
		var s2y = function s2y () {
			var s11 = spars[0][0], s12 = spars[0][1], s21 = spars[1][0], s22 = spars[1][1],
				y11 = (((one.add(s22)).mul(one.sub(s11))).add(s12.mul(s21))).div(((one.add(s11)).mul(one.add(s22))).sub(s12.mul(s21))),
				y12 =                                   (two.mul(s12).neg()).div(((one.add(s11)).mul(one.add(s22))).sub(s12.mul(s21))), 
				y22 = (((one.add(s11)).mul(one.sub(s22))).add(s12.mul(s21))).div(((one.add(s11)).mul(one.add(s22))).sub(s12.mul(s21))),
				y21 =                                   (two.mul(s21).neg()).div(((one.add(s11)).mul(one.add(s22))).sub(s12.mul(s21)));
			ypars = [[y11, y12],
					 [y21, y22]]; 
		};

		var y2s = function y2s () {
			var y11 = ypars[0][0], y12 = ypars[0][1], y21 = ypars[1][0], y22 = ypars[1][1],
				s11 = (((one.sub(y11)).mul(one.add(y22))).add(y12.mul(y21))).div(((one.add(y11)).mul(one.add(y22))).sub(y12.mul(y21))),
				s12 =                                   (two.mul(y12).neg()).div(((one.add(y11)).mul(one.add(y22))).sub(y12.mul(y21))),
				s22 = (((one.add(y11)).mul(one.sub(y22))).add(y12.mul(y21))).div(((one.add(y11)).mul(one.add(y22))).sub(y12.mul(y21))),
				s21 =                                   (two.mul(y21).neg()).div(((one.add(y11)).mul(one.add(y22))).sub(y12.mul(y21)));
			spars = [[s11, s12],
					 [s21, s22]];
		};


		// the cas, series, parallel, mirror, and clone methods
		var cas = function cas (n2) {
			var sparsN2 = n2.getSpars(),
				s11a = spars[0][0], s12a = spars[0][1], s21a = spars[1][0], s22a = spars[1][1],
				s11b = sparsN2[0][0], s12b = sparsN2[0][1], s21b = sparsN2[1][0], s22b = sparsN2[1][1],
				s11 = s11a.add (( s12a.mul(s11b).mul(s21a) ).div( (one.sub( s22a.mul(s11b) ) ) ) ),
				s12 =           ( s12a.mul(s12b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ,
				s22 = s22b.add (( s21b.mul(s22a).mul(s12b) ).div( (one.sub( s22a.mul(s11b) ) ) ) ),
				s21 =           ( s21a.mul(s21b)           ).div( (one.sub( s22a.mul(s11b) ) ) )  ,
				mySpars = [[s11, s12],
					       [s21, s22]];
			return nport('spar', mySpars);
		};

		var series = function series (n2) {
			var zA = [];
			var zB = [];
			s2z(); // this puts zpars in the n1 object			
			zA = zpars;			
			n2.s2z(); // this put zpars  in the n2 Object			
			zB = n2.getZpars();
			var z11a = zA[0][0], z12a = zA[0][1], z21a = zA[1][0], z22a = zA[1][1],
				z11b = zB[0][0], z12b = zB[0][1], z21b = zB[1][0], z22b = zB[1][1],
				z11 = z11a.add(z11b), z12 = z12a.add(z12b), z21 = z21a.add(z21b), z22 = z22a.add(z22b),
				s11 = (((z11.sub(one)).mul(z22.add(one))).sub(z12.mul(z21))).div(((z11.add(one)).mul(z22.add(one))).sub(z12.mul(z21))),
				s12 =                                         (two.mul(z12)).div(((z11.add(one)).mul(z22.add(one))).sub(z12.mul(z21))),
				s22 = (((z11.add(one)).mul(z22.sub(one))).sub(z12.mul(z21))).div(((z11.add(one)).mul(z22.add(one))).sub(z12.mul(z21))),
				s21 =                                         (two.mul(z21)).div(((z11.add(one)).mul(z22.add(one))).sub(z12.mul(z21))),
				mySpars = [[s11, s12],
						   [s21, s22]];		
			return nport('spar', mySpars);
		};

		var parallel = function parallel (n2) {
			var yA = [];
			var yB = [];
			s2y(); // this puts ypars, {"name":"complex","x":0.33333333333333337,"y":0}, in the n1 object			
			yA = ypars;			
			n2.s2y(); // this put ypars, {"name":"complex","x":0.01094810597766587,"y":0}, in the n2 Object			
			yB = n2.getYpars();
			var y11a = yA[0][0], y12a = yA[0][1], y21a = yA[1][0], y22a = yA[1][1],
				y11b = yB[0][0], y12b = yB[0][1], y21b = yB[1][0], y22b = yB[1][1],
				y11 = y11a.add(y11b), y12 = y12a.add(y12b), y21 = y21a.add(y21b), y22 = y22a.add(y22b),
				s11 = (((one.sub(y11)).mul(one.add(y22))).add(y12.mul(y21))).div(((one.add(y11)).mul(one.add(y22))).sub(y12.mul(y21))),
				s12 =                                   (two.mul(y12).neg()).div(((one.add(y11)).mul(one.add(y22))).sub(y12.mul(y21))),
				s22 = (((one.add(y11)).mul(one.sub(y22))).add(y12.mul(y21))).div(((one.add(y11)).mul(one.add(y22))).sub(y12.mul(y21))),
				s21 =                                   (two.mul(y21).neg()).div(((one.add(y11)).mul(one.add(y22))).sub(y12.mul(y21))),
				mySpars = [[s11, s12],
					       [s21, s22]];
			return nport('spar', mySpars);
		};

		var mirror = function mirror() {
			var s11 = spars[0][0], s12 = spars[0][1], s21 = spars[1][0], s22 = spars[1][1],
				mySpars = [[s22, s21],
						   [s12, s11]];		
			return nport('spar', mySpars);
		};

		var clone = function clone() {
			var s11 = spars[0][0], s12 = spars[0][1], s21 = spars[1][0], s22 = spars[1][1],
				mySpars = [[s11, s12],
						   [s21, s22]];		
			return nport('spar', mySpars);
		};
		
		// the various print methods
		var printNportSpars = function () {
			console.log(spars[0][0].mag() + " " + spars[0][0].ang());
			console.log(spars[0][1].mag() + " " + spars[0][1].ang());
		};

		var printNportZpars = function () {
			console.log(zpars[0][0].mag() + " " + zpars[0][0].ang());
			console.log(zpars[0][1].mag() + " " + zpars[0][1].ang());
		};
		
		var printNportYpars = function () {
			console.log(ypars[0][0].mag() + " " + ypars[0][0].ang());
			console.log(ypars[0][1].mag() + " " + ypars[0][1].ang());
		};

		var printNportdB = function () {
			console.log(20*Math.log(spars[0][0].mag())/Math.log(10) + " " + spars[0][0].ang());
			console.log(20*Math.log(spars[0][1].mag())/Math.log(10) + " " + spars[0][1].ang());
			console.log(20*Math.log(spars[1][0].mag())/Math.log(10) + " " + spars[1][0].ang());
			console.log(20*Math.log(spars[1][1].mag())/Math.log(10) + " " + spars[1][1].ang());
		};

		return {
		// The object data (what shows in JSON.stringify(c1) for example) 
			name : 'nport',

			
		// The ojbect methods
			getSpars : getSpars, // getters
			getZpars : getZpars,
			getYpars : getYpars,

			s2z : s2z,           // converters
			z2s : z2s,
			s2y : s2y,
			y2s : y2s,

			series : series,     // Nport combiners to create one Nport
			parallel : parallel,
			cas : cas,
			mirror : mirror,
			clone : clone,

			printNportSpars : printNportSpars,
			printNportZpars : printNportZpars,
			printNportYpars : printNportYpars,
			printNportdB : printNportdB,
		};		
	};
	return nport	
});

// Here is a section showing the lookup paths for all the unique nport functions...

/*
			var out = {
				'turnsRatio' : 'function () {return turnsRatioTRF();}', // nport('TRF', 'turnsRatio', n)
					'inOutZ' :  'function () {return inOutZTRF();}', // nport('TRF', 'inOutZ', Zin, Zout)
					'mutualInductance' :  'function () {return mutualInductanceTRF();}', // nport('TRF', 'mutualInductance', Lin, Lmutual, Lout, dot
					'mlin' :  'function () {return mlinMS();}', // nport('MS', 'mlin', w, t, l, h, er)
					'openEnd' :  'function () {return openEndMS();}', // nport('MS', 'openEnd', w, t, h, er)
					'gap' :  'function () {return gapMS();}', // nport('MS', 'gap', w, t, g, h, er)
					'stepInWidth' :  'function () {return stepInWidthMS();}', // nport('MS', 'stepInWidth', w1, w2, t, h, er)
					'rightAngleBend' :
					'teeJunction' :
					'crossJunction'
					'spar' : 'function () {return sparSPAR();}', // nport('SPAR', 'spar', spar),
					'spars' : 'function () {return sparsSPAR();}', // nport('SPAR', 'spars', spars),
				};





			
*/























