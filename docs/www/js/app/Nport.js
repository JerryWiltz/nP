// nport.js
// This is going to be a big-ass file
// Continued from 11/2016 to now, 6/2017

define(['app/complex', 'app/matrix'], function (complex, matrix){
"use strict";
	var nport = function nport(...theArgs) {
	//e.g. var RLC1 = nport('RCL', 'series', 75, 5e-9, 1e-9, 2e9 );	

		var myArgs = theArgs,
			spars = [],             // The nport s-parameters
			zpars = [],
			ypars = [],
			Zo = complex(50,0),   	// Default is 50 Ohms
			Yo = Zo.inv(),			// Default is 0.02 Mohos;
			one = complex(1,0),
			two = complex(2,0);

	// Section 2: Begin the private component sparameter calculation section 
		//series RLC
		var seriesRLCinSeries = function seriesRLCinSeries() {	// if myArgs[1] is false, then R = 0; // F is Hz
			var R = myArgs[1] || 0, L = myArgs[2] || 0, C = myArgs[3] || Infinity, F = myArgs[4] || 1,
				Z = complex(R, + 2*Math.PI*L*F  -1/(2*Math.PI*C*F)  ),				  
				s11 = Z.div(Z.add(Zo.add(Zo))),
				s21 = (two.mul(Zo)).div(Z.add(Zo.add(Zo))),
				s12 = s21,
				s22 = s11;
			spars = [[s11, s12],
					 [s21, s22]];
			};
			
		//parallel RLC
		var parallelRLCinSeries = function parallelRLCinSeries() {	
			var R = myArgs[1] || 0, L = myArgs[2] || 0, C = myArgs[3] || Infinity, F = myArgs[4] || 1,
				Z = complex(R, + 2*Math.PI*L*F  -1/(2*Math.PI*C*F)  ), Y = Z.inv(),
				s11 = (Y.neg()).div(Y.add(Yo.add(Yo))),
				s21 = (two.mul(Yo)).div(Y.add(Yo.add(Yo))),  
				s12 = s21,
				s22 = s11;
			spars = [[s11, s12],
					 [s21, s22]];
			};
			
		//sparsSingle ... takes a line of spars for a single frequency, (does not take a table of spars with more than one frequency)
		var sparsSingle = function sparsSingle () {
			var mySpars = myArgs[1]
			spars = mySpars;
			};
			
		//nodal ... this one takes nPorts and cascades nodally, this is the BIG ONE!!
		var nodal = function nodal() {           //this moves all the nports into the nodal function
			var nPortInputsMatrix = myArgs[1],   //the matrix containing the nPorts with their nodes
				expandednPortInputsMatrix = [],  //the matrix that has b's, nodes, and a's in 3 columns
				connectionScatteringMatrix = [], //the matrix that must be solved, having negative spars and connections
				resultMatrix = [],               //the matrix containing the resulting final spars
				outSpars = [],                   //the lower right corner of resultMatrix with spars that are put into the spars array
				row = 0, col = 0, offset = 0, nPortCount = 0,
				connectionScatteringMatrixRows = 0, connectionScatteringMatrixCols = 0, connectionScatteringMatrixRowCount = 0,
				outSparsRowsCols = 0;
			
			//get dimensions for BOTH the expanded input matrix and the connection scattering matrix
			for (row = 0; row < nPortInputsMatrix.length; row++) { //get the size off all the spars
				connectionScatteringMatrixRows += nPortInputsMatrix[row].length - 1; // -1 for don't count the nPort object, just include the node list items
				connectionScatteringMatrixCols = connectionScatteringMatrixRows;
			};
			
			// build and populate the expanded input matrix
			expandednPortInputsMatrix = matrix.dimension(connectionScatteringMatrixRows, connectionScatteringMatrixCols, 0 );//fill expanded input matrix with 0's
			for (row = 0; row < connectionScatteringMatrixRows; row++) {//put the b's here in the first column 
				expandednPortInputsMatrix[row][col] = row + 1;
			};  //showTable(expandednPortInputsMatrix);	
			for( nPortCount = 0, offset = 0; nPortCount < nPortInputsMatrix.length; nPortCount++) {//put the nodes here in the second colum
				for( col = 0; col < nPortInputsMatrix[nPortCount].length -1; col++) {
					expandednPortInputsMatrix[offset][1] = nPortInputsMatrix[nPortCount][col + 1];
					offset++;
				};
			};  //showTable(expandednPortInputsMatrix);
			for (connectionScatteringMatrixRowCount = 0; connectionScatteringMatrixRowCount < connectionScatteringMatrixRows; connectionScatteringMatrixRowCount++) {
				for (row = 0; row < connectionScatteringMatrixRows; row++) {
					//the if statement makes sure the pivot row is not counted
					if ( !(connectionScatteringMatrixRowCount === row) && (expandednPortInputsMatrix[connectionScatteringMatrixRowCount][1] === expandednPortInputsMatrix[row][1])   ) {
						expandednPortInputsMatrix[row][2] = expandednPortInputsMatrix[connectionScatteringMatrixRowCount][0]; //put the a's in the 3rd column
					};
				};
			};  //showTable(expandednPortInputsMatrix);
			
			//build and populate the connection scattering matrix
			connectionScatteringMatrix = matrix.dimension(connectionScatteringMatrixRows, connectionScatteringMatrixCols, complex(0, 0) );//fill connection scattering matrix with complex 0's
			for (connectionScatteringMatrixRowCount = 0; connectionScatteringMatrixRowCount < connectionScatteringMatrixRows; connectionScatteringMatrixRowCount++) {
				connectionScatteringMatrix[ expandednPortInputsMatrix[connectionScatteringMatrixRowCount][0] - 1 ]
				                          [ expandednPortInputsMatrix[connectionScatteringMatrixRowCount][2] - 1 ] = complex(1, 0); //put in one's to form the connections
			}; //showTable(connectionScatteringMatrix);
			
			//fill the connection scattering matrix with the negative of the spars of all the nPorts
			//this puts in the submatrices of the nPorts along the diagonal of the connection scattering matrix
			//each subsequent submatrix is [row][col] offset as shown below
			for(nPortCount = 0, offset = 0; nPortCount < nPortInputsMatrix.length - 1; nPortCount++) {
				for (row = 0 + offset; row < nPortInputsMatrix[nPortCount].length - 1 + offset; row++) { //[0].sparsSize
					for(col = 0 + offset ; col < nPortInputsMatrix[nPortCount].length - 1 + offset; col++) {  //[0].sparsSize
						//console.log(row + ' ' + col);
						connectionScatteringMatrix[row][col] = nPortInputsMatrix[nPortCount][0].getSpars()[row - offset][col - offset].neg();
					};
				};
				offset += nPortInputsMatrix[nPortCount][0].sparsSize;
			}; //showTable(connectionScatteringMatrix);
			
			resultMatrix = matrix.invertCmplx(connectionScatteringMatrix); //this does the magic!
			//showTable(resultMatrix);
			//create the outSpars matrix
			outSparsRowsCols = nPortInputsMatrix[nPortInputsMatrix.length-1].length-1
			outSpars = matrix.dimension(outSparsRowsCols, outSparsRowsCols, complex(0,0) )			
			for (row = 0; row < outSparsRowsCols; row++) {
				for (col = 0; col < outSparsRowsCols; col++) {
					outSpars[row][col] = resultMatrix[connectionScatteringMatrixRows - outSparsRowsCols + row]
					                                 [connectionScatteringMatrixRows - outSparsRowsCols + col]; //resultMatrix[row][col];
				};
			};
		
			spars = outSpars;
			//showTable(spars);
			
		};  //end of nodal
		
		//wireTee
		var wireTee = function wireTee() {	
			spars = [[complex(-3.33e-1,0), complex(6.67e-1,0) , complex(6.67e-1,0)],
			         [complex(6.67e-1,0) , complex(-3.33e-1,0), complex(6.67e-1,0)],
				     [complex(6.67e-1,0) , complex(6.67e-1,0) , complex(-3.33e-1,0)]];
			}; //end of wireTee
		
		//wireCross
		var wireCross = function wireCross() {	
			spars = [[complex(-5.001e-1,0), complex(5.001e-1,0) , complex(5.001e-1,0) , complex(5.001e-1,0)],
					 [complex(5.001e-1,0) , complex(-5.001e-1,0), complex(5.001e-1,0) , complex(5.001e-1,0)],
					 [complex(5.001e-1,0) , complex(5.001e-1,0) , complex(-5.001e-1,0), complex(5.001e-1,0)],
					 [complex(5.001e-1,0) , complex(5.001e-1,0) , complex(5.001e-1,0) , complex(-5.001e-1,0)]];	
			}; //end of wireCress		
			
		// Section 3: This calls all the 'constructor-type' functions in Section 2, there are or will be lots of them!!					
		var typeNport =	function typeNport(nportName) {							
			var out = {
				'seriesRLCinSeries' :  function () {return seriesRLCinSeries();},		//nport(seriesRLCinSeries, R, L, C, F)
				'parallelRLCinSeries' : function () {return parallelRLCinSeries();},	//nport(parallelRLCinSeries, R, L, C, F)	
				'sparsSingle' : function () {return sparsSingle();}, 					// nport('spar', spar)
				'nodal' : function () {return nodal();},
				'wireTee' : function () {return wireTee();},
				'wireCross' : function () {return wireCross();},
			};
		return out[nportName]();
		};
		typeNport(myArgs[0]); // This calls the function

		// Section 4: Begin output object methods
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
			return nport('sparsSingle', mySpars);
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
			return nport('sparsSingle', mySpars);
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
			return nport('sparsSingle', mySpars);
		};

		var mirror = function mirror() {
			var s11 = spars[0][0], s12 = spars[0][1], s21 = spars[1][0], s22 = spars[1][1],
				mySpars = [[s22, s21],
						   [s12, s11]];		
			return nport('sparsSingle', mySpars);
		};

		var clone = function clone() {
			var s11 = spars[0][0], s12 = spars[0][1], s21 = spars[1][0], s22 = spars[1][1],
				mySpars = [[s11, s12],
						   [s21, s22]];		
			return nport('sparsSingle', mySpars);
		};
		
			// the various print methods
		var printNportSpars = function () {
			//console.log('mag and ang')
			//console.log(spars[0][0].mag() + " " + spars[0][0].ang());
			//console.log(spars[0][1].mag() + " " + spars[0][1].ang());
			console.log('real and imagine')
			console.log(spars[0][0].x + " " + spars[0][0].y);
			console.log(spars[0][1].x + " " + spars[0][1].y);
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
			//console.log(20*Math.log(spars[0][0].mag())/Math.log(10) + " at " + spars[0][0].ang());
			//console.log(20*Math.log(spars[0][1].mag())/Math.log(10) + " at " + spars[0][1].ang());
			console.log( (20*Math.log(spars[1][0].mag())/Math.log(10)).toPrecision(3) + 'dB'); // at " + spars[1][0].ang().toPrecision(3));
			//console.log(spars[1][0].mag().toPrecision(3) + " at " + spars[1][0].ang().toPrecision(3));
			//console.log(20*Math.log(spars[1][1].mag())/Math.log(10) + " at " + spars[1][1].ang());
		};

		// Section 5: This is the Object that is returned
		return {
			// The object data (what shows in JSON.stringify(c1) for example) 
			name : 'nport',
			sparsSize : spars.length,
			
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

			var myMatrix = 
			[[nPortInputsMatrix[0].getSpars()[0][0].neg(), nPortInputsMatrix[0].getSpars()[0][1].neg(), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(1,0), complex(0,0)],  
			 [nPortInputsMatrix[0].getSpars()[1][0].neg(), nPortInputsMatrix[0].getSpars()[1][1].neg(), complex(1,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0)],
			 [complex(0,0), complex(1,0), nPortInputsMatrix[1].getSpars()[0][0].neg(), nPortInputsMatrix[1].getSpars()[0][1].neg(), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0)],
			 [complex(0,0), complex(0,0), nPortInputsMatrix[1].getSpars()[1][0].neg(), nPortInputsMatrix[1].getSpars()[1][1].neg(), complex(1,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0)],
			 [complex(0,0), complex(0,0), complex(0,0), complex(1,0), nPortInputsMatrix[2].getSpars()[0][0].neg(), nPortInputsMatrix[2].getSpars()[0][1].neg(), complex(0,0), complex(0,0), complex(0,0)],
			 [complex(0,0), complex(0,0), complex(0,0), complex(0,0), nPortInputsMatrix[2].getSpars()[1][0].neg(), nPortInputsMatrix[2].getSpars()[1][1].neg(), complex(1,0), complex(0,0), complex(0,0)],
			 [complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(1,0), complex(0,0), complex(0,0), complex(1,0)],
			 [complex(1,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0), complex(0,0)]]



			
*/























