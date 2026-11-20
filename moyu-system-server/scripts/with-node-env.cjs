'use strict';

const { spawn } = require('node:child_process');

const nodeEnv = process.argv[2];
const command = process.argv.slice(3);

if (!nodeEnv || command.length === 0) {
  console.error('Usage: node scripts/with-node-env.cjs <NODE_ENV> <command>...');
  process.exit(1);
}

process.env.NODE_ENV = nodeEnv;

const child = spawn(command[0], command.slice(1), {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  windowsHide: true,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
