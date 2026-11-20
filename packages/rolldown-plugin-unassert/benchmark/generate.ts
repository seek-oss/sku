import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface GenerateOptions {
  fileCount: number;
  /** Each module repeats a function block until it has at least this many lines. */
  minimumLinesPerFile: number;
  /** Seed for the PRNG that picks assertion counts and styles. Defaults to 1. */
  seed?: number;
}

export interface GeneratedProject {
  root: string;
  entry: string;
  fileCount: number;
  assertionCount: number;
}

const IMPORT_STYLES = [
  `import assert from 'assert';`,
  `import assert from 'node:assert';`,
  `import { strict as assert } from 'assert';`,
  `import * as assert from 'power-assert';`,
];

/** Max assertions injected into a single module; each module gets a random count in [0, this]. */
const MAX_ASSERTIONS_PER_FILE = 5;

/** Small seeded PRNG (mulberry32) so generated projects are reproducible between runs. */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = () => number;

function pick<T>(random: Random, items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) {
    throw new Error('Cannot pick from an empty list');
  }
  return item;
}

/** Assertion styles usable at the top of a function, where only `values` and `factor` are in scope. */
const EARLY_ASSERTIONS: readonly string[] = [
  `assert(Array.isArray(values), 'values must be an array');`,
  `assert(Array.isArray(values));`,
  `assert.ok(factor > 0, 'factor must be positive');`,
  `assert.ok(typeof factor === 'number');`,
  `assert.equal(typeof factor, 'number');`,
  `assert.strictEqual(typeof values, 'object', 'values must be an object');`,
  `assert.notStrictEqual(values, null);`,
  `assert.notEqual(factor, 0);`,
  `assert.deepEqual(Array.from(values), values);`,
  `assert.deepStrictEqual([...values], Array.from(values));`,
  `assert.notDeepStrictEqual(values, [factor, NaN]);`,
  `console.assert(values.length >= 0, 'length must be non-negative');`,
  // Multi-line call with a template literal message.
  `assert(\n    values.every((value) => typeof value === 'number'),\n    \`all values must be numbers, got \${values.length}\`,\n  );`,
  // Assertions nested in a conditional and in arrow functions (statement position only).
  `if (values.length > 0) {\n    assert.ok(values[0] !== undefined);\n  }`,
  `values.forEach((value) => {\n    assert(value === value);\n  });`,
];

/** Assertion styles usable once `total` and `result` exist. */
const LATE_ASSERTIONS: readonly string[] = [
  `console.assert(Number.isFinite(total), 'total must be finite');`,
  `assert(Number.isFinite(total));`,
  `assert.ok(result.count === values.length, 'count must match');`,
  `assert.equal(typeof result.total, 'number');`,
  `assert.strictEqual(result.total, total);`,
  `assert.notStrictEqual(result.name, '');`,
  `assert.deepEqual(result, { ...result });`,
  `assert.deepStrictEqual(Object.keys(result), ['name', 'total', 'count']);`,
  `assert.notDeepEqual(result, null);`,
  `assert.ok(\n    result.total === total && result.count >= 0,\n    'result must be consistent',\n  );`,
  `{\n    const check = (candidate) => {\n      assert(candidate !== undefined, 'candidate must exist');\n    };\n    check(result);\n  }`,
];

/** Builds one exported function with the given assertions placed before/after the loop. */
function functionBlock(
  fileIndex: number,
  functionIndex: number,
  early: readonly string[],
  late: readonly string[],
): string[] {
  const name = `compute${fileIndex}_${functionIndex}`;

  return [
    `/**`,
    ` * Generated function ${functionIndex} of module ${fileIndex}.`,
    ` */`,
    `export function ${name}(values, factor = ${functionIndex + 1}) {`,
    ...early.map((assertion) => `  ${assertion}`),
    `  let total = 0;`,
    `  for (let i = 0; i < values.length; i++) {`,
    `    const value = values[i] * factor;`,
    `    if (value % 2 === 0) {`,
    `      total += value / 2;`,
    `    } else {`,
    `      total += value * 3 + 1;`,
    `    }`,
    `  }`,
    ...late.map((assertion) => `  ${assertion}`),
    `  const result = { name: '${name}', total, count: values.length };`,
    `  return result;`,
    `}`,
    ``,
  ];
}

function moduleSource(
  fileIndex: number,
  minimumLines: number,
  random: Random,
): { code: string; assertions: number } {
  const importStyle = IMPORT_STYLES[fileIndex % IMPORT_STYLES.length];
  if (importStyle === undefined) {
    throw new Error(`No import style for module ${fileIndex}`);
  }

  // Each module gets 0..MAX assertions, each with a randomly chosen style and position.
  const assertions = Math.floor(random() * (MAX_ASSERTIONS_PER_FILE + 1));
  const pendingEarly: string[] = [];
  const pendingLate: string[] = [];
  for (let i = 0; i < assertions; i++) {
    if (random() < 0.5) {
      pendingEarly.push(pick(random, EARLY_ASSERTIONS));
    } else {
      pendingLate.push(pick(random, LATE_ASSERTIONS));
    }
  }

  const lines = [`// Generated benchmark module ${fileIndex}`, importStyle, ``];
  const functionNames: string[] = [];

  // Reserve room for the trailing export block. Keep adding blocks until the
  // minimum size is met and every pending assertion has been placed.
  while (
    lines.length + 3 < minimumLines ||
    pendingEarly.length > 0 ||
    pendingLate.length > 0
  ) {
    const early = pendingEarly.splice(0, 1 + Math.floor(random() * 2));
    const late = pendingLate.splice(0, 1 + Math.floor(random() * 2));
    const name = `compute${fileIndex}_${functionNames.length}`;
    lines.push(...functionBlock(fileIndex, functionNames.length, early, late));
    functionNames.push(name);
  }

  lines.push(`export const all = [`, `  ${functionNames.join(',\n  ')},`, `];`);
  return { code: `${lines.join('\n')}\n`, assertions };
}

export async function generateProject(
  root: string,
  options: GenerateOptions,
): Promise<GeneratedProject> {
  const modulesDirectory = join(root, 'src', 'modules');
  await mkdir(modulesDirectory, { recursive: true });

  let assertionCount = 0;
  const random = createRandom(options.seed ?? 1);
  const batchSize = 500;
  for (
    let batchStart = 0;
    batchStart < options.fileCount;
    batchStart += batchSize
  ) {
    const writes: Array<Promise<void>> = [];
    const batchEnd = Math.min(batchStart + batchSize, options.fileCount);
    for (let fileIndex = batchStart; fileIndex < batchEnd; fileIndex++) {
      const { code, assertions } = moduleSource(
        fileIndex,
        options.minimumLinesPerFile,
        random,
      );
      assertionCount += assertions;
      writes.push(
        writeFile(join(modulesDirectory, `module${fileIndex}.js`), code),
      );
    }

    // Batches bound the number of open file handles.
    await Promise.all(writes);
  }

  const entryLines: string[] = [];
  const importNames: string[] = [];
  for (let fileIndex = 0; fileIndex < options.fileCount; fileIndex++) {
    importNames.push(`module${fileIndex}`);
    entryLines.push(
      `import { all as module${fileIndex} } from './modules/module${fileIndex}.js';`,
    );
  }
  // A side effect keeps every module in the bundle; app builds drop unused entry exports.
  entryLines.push(`globalThis.generatedModules = [${importNames.join(', ')}];`);

  const entry = join(root, 'src', 'main.js');
  await writeFile(entry, `${entryLines.join('\n')}\n`);

  return { root, entry, fileCount: options.fileCount, assertionCount };
}
