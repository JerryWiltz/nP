#!/usr/bin/env node
// Modified: 2026-11-07
'use strict';

const {generate: generateLinear} = require('./generate-linear-schematics');
const {generate: generateNodal} = require('./generate-nodal-schematics');
const {generate: generateVnaReceivers} = require('./generate-vna-receivers');

async function build() {
  generateLinear();
  generateNodal();
  generateVnaReceivers();
  process.stdout.write('Built documentation schematics.\n');
}

if (require.main === module) {
  build().catch(error => {
    process.stderr.write(`build-example-schematics: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {build};
