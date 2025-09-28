#!/usr/bin/env node
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

async function run() {
  const { main } = pkg;
  if (!main) {
    console.error('No entrypoint defined in package.json');
    process.exit(1);
  }

  const distUrl = new URL(`../${main}`, import.meta.url);
  let entry = distUrl;

  if (!fs.existsSync(fileURLToPath(distUrl))) {
    const fallback = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/index.ts');
    entry = pathToFileURL(fallback);
  }

  const { runCli } = await import(entry.href);
  await runCli();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
