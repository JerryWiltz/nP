#!/usr/bin/env node
// Modified: 2026-10-25
'use strict';

const {generate: generateLinear} = require('./generate-repl-schematics');
const {generate: generateNodal} = require('./generate-nodal-schematics');
const {generate: generateVnaReceivers} = require('./generate-vna-receivers');
const {generate: generateSignalExamples} = require('./generate-signal-examples');
const {inventory} = require('./generate-example-inventory');

async function build() {
  generateLinear();
  generateNodal();
  generateVnaReceivers();
  generateSignalExamples();
  const count = await inventory();
  process.stdout.write(`Built schematic inventory for ${count} REPL examples.\n`);
}

if (require.main === module) {
  build().catch(error => {
    process.stderr.write(`build-example-schematics: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {build};
