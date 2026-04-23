#!/usr/bin/env -S npx tsx
import { main } from './cli';

main().then((code) => process.exit(code)).catch((err) => {
  process.stderr.write(`eval-runner: unhandled error: ${err?.message ?? String(err)}\n`);
  process.exit(1);
});
