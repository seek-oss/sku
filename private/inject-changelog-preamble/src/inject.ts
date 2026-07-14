#!/usr/bin/env node

import fsp from 'node:fs/promises';
import fs from 'node:fs';
import { critical, info, success } from '@sku-private/utils/console';

const PREAMBLE_PATH = '.changeset/.PREAMBLE.md';
const CHANGELOG_PATH = 'packages/sku/CHANGELOG.md';

if (!fs.existsSync(PREAMBLE_PATH)) {
  console.log(
    info(
      `Missing preamble file at "${PREAMBLE_PATH}". Skipping sku changelog preamble injection.`,
    ),
  );
  process.exit(0);
}

if (!fs.existsSync(CHANGELOG_PATH)) {
  console.error(critical(`Missing changelog file at "${CHANGELOG_PATH}"`));
  process.exit(1);
}

const [preamble, changelog] = await Promise.all([
  fsp.readFile(PREAMBLE_PATH, 'utf8'),
  fsp.readFile(CHANGELOG_PATH, 'utf8'),
]);

const lines = changelog.split('\n');
lines.splice(4, 0, preamble);
await fsp.writeFile(CHANGELOG_PATH, lines.join('\n'));
await fsp.rm(PREAMBLE_PATH);

console.log(success(`Successfully injected ${lines.length} preamble lines`));
