import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build, type Rolldown } from 'vite';
import { assert, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('./vite-app/', import.meta.url));

const viteConfig = fileURLToPath(
  new URL('./vite-app/vite.config.ts', import.meta.url),
);

async function buildApp(
  configFile: string | false,
  { sourcemap = false } = {},
) {
  const result = await build({
    root,
    configFile,
    logLevel: 'silent',
    build: { write: false, minify: false, sourcemap },
  });

  const buildOutput = Array.isArray(result) ? result[0] : result;
  if (!buildOutput || !('output' in buildOutput)) {
    throw new Error('Expected a single build output');
  }

  const entryChunk = buildOutput.output.find(
    (file): file is Rolldown.OutputChunk =>
      file.type === 'chunk' && file.isEntry,
  );
  assert(entryChunk, 'expected an entry chunk');

  return entryChunk;
}

function sourceOf(chunk: Rolldown.OutputChunk, idPattern: RegExp) {
  const moduleId = Object.keys(chunk.modules).find((id) => idPattern.test(id));
  assert(moduleId, `module matching ${idPattern} should be in the bundle`);

  return chunk.modules[moduleId]?.code ?? '';
}

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url));

function toRepositoryPath(moduleId: string): string {
  if (moduleId.startsWith('\0')) {
    return `virtual:${moduleId.slice(1)}`;
  }

  return moduleId.startsWith(repositoryRoot)
    ? relative(repositoryRoot, moduleId)
    : moduleId;
}

const APP_MODULE_ID = /\/src\/stats\.ts$/;
const DEPENDENCY_MODULE_ID = /\/node_modules\/.*\/fake-dep\/src\/index\.js$/;

describe('vite app fixture', () => {
  it('contains assertions in the app and in a node_modules dependency without the plugin', async () => {
    const chunk = await buildApp(false);

    expect(sourceOf(chunk, APP_MODULE_ID)).toMatchInlineSnapshot(`
      "// packages/rolldown-plugin-unassert/tests/vite-app/src/stats.ts
      function normalizedScore(scores, max) {
      	(0, import_assert.default)(scores.length > 0, "scores must not be empty");
      	invariant(max > 0, "max must be positive");
      	const score = clamp(average(scores), 0, max) / max;
      	import_assert.default.ok(score >= 0 && score <= 1);
      	console.assert(!Number.isNaN(score), "score must not be NaN");
      	return score;
      }
      "
    `);
    expect(sourceOf(chunk, DEPENDENCY_MODULE_ID)).toMatchInlineSnapshot(`
      "// node_modules/.pnpm/fake-dep@file+packages+rolldown-plugin-unassert+tests+fake-dep/node_modules/fake-dep/src/index.js
      function clamp(value, min, max) {
      	import_assert.strict.ok(typeof value === "number", "value must be a number");
      	(0, import_assert.strict)(min <= max, "min must not exceed max");
      	console.assert(Number.isFinite(value), "value must be finite");
      	return Math.min(Math.max(value, min), max);
      }
      function average(values) {
      	(0, import_assert.strict)(Array.isArray(values) && values.length > 0, "values must be a non-empty array");
      	let total = 0;
      	for (const value of values) {
      		import_assert.strict.equal(typeof value, "number");
      		total += value;
      	}
      	return total / values.length;
      }
      "
    `);
  });

  it('strips every assertion from the app and its dependency with the plugin', async () => {
    const chunk = await buildApp(viteConfig);

    expect(sourceOf(chunk, APP_MODULE_ID)).toMatchInlineSnapshot(`
      "// packages/rolldown-plugin-unassert/tests/vite-app/src/stats.ts
      function normalizedScore(scores, max) {
      	return clamp(average(scores), 0, max) / max;
      }
      "
    `);
    expect(sourceOf(chunk, DEPENDENCY_MODULE_ID)).toMatchInlineSnapshot(`
      "// node_modules/.pnpm/fake-dep@file+packages+rolldown-plugin-unassert+tests+fake-dep/node_modules/fake-dep/src/index.js
      function clamp(value, min, max) {
      	return Math.min(Math.max(value, min), max);
      }
      function average(values) {
      	let total = 0;
      	for (const value of values) total += value;
      	return total / values.length;
      }
      "
    `);
    // Neither assertion library is bundled once every import of it is removed.
    expect(Object.keys(chunk.modules).map(toRepositoryPath))
      .toMatchInlineSnapshot(`
      [
        "virtual:vite/modulepreload-polyfill.js",
        "node_modules/.pnpm/fake-dep@file+packages+rolldown-plugin-unassert+tests+fake-dep/node_modules/fake-dep/src/index.js",
        "packages/rolldown-plugin-unassert/tests/vite-app/src/stats.ts",
        "packages/rolldown-plugin-unassert/tests/vite-app/src/main.ts",
        "packages/rolldown-plugin-unassert/tests/vite-app/index.html",
      ]
    `);
  });

  it('maps the output back to the original source, through the removed assertions', async () => {
    const chunk = await buildApp(viteConfig, { sourcemap: true });
    assert(chunk.map, 'expected a source map');

    const outputLines = chunk.code.split('\n');
    const lineIndex = outputLines.findIndex((line) =>
      line.includes('clamp(average(scores)'),
    );
    const lineText = outputLines[lineIndex];
    assert(
      lineText !== undefined,
      'expected the score calculation in the bundle',
    );

    const original = originalPositionFor(new TraceMap(chunk.map.toString()), {
      line: lineIndex + 1,
      column: lineText.indexOf('clamp(average(scores)'),
    });

    // `const score = clamp(...)` in src/stats.ts, below the removed assertions.
    expect(original).toMatchInlineSnapshot(`
      {
        "column": 16,
        "line": 9,
        "name": null,
        "source": "../../src/stats.ts",
      }
    `);
  });

  it('computes the same result once assertions are removed', async () => {
    const chunk = await buildApp(viteConfig);

    const resultElement = { textContent: '' };
    const document = {
      // Makes Vite's modulepreload polyfill bail out early.
      createElement: () => ({ relList: { supports: () => true } }),
      querySelector: () => resultElement,
    };

    runInNewContext(chunk.code, { document });

    expect(resultElement.textContent).toBe('Score: 0.87');
  });
});
