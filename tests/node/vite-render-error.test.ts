import { describe, it, expect } from 'vitest';

import { scopeToFixture } from '@sku-private/testing-library';

const { sku } = scopeToFixture('vite-render-error');

// Line numbers in built sku code and dependencies change with unrelated edits and upgrades.
// Fixture source locations are kept, as they verify stack traces map back to source.
const unstableFrameLocation =
  /(\/(?:packages\/sku\/dist|node_modules)\/[^\s)]+):\d+:\d+/g;

expect.addSnapshotSerializer({
  test: (val) =>
    typeof val === 'string' && val.search(unstableFrameLocation) !== -1,
  serialize: (val: string, config, indentation, depth, refs, printer) =>
    printer(
      val.replaceAll(unstableFrameLocation, '$1:{line}:{column}'),
      config,
      indentation,
      depth,
      refs,
    ),
});

const filterNodeInternalStackFrames = (stack: string) =>
  stack
    .split('\n')
    .filter((line) => !line.includes('node:internal'))
    .join('\n');

const aggregateStdErr = (
  stderrArr: Array<{ contents: string | Buffer<ArrayBufferLike> }>,
) =>
  stderrArr
    .map((item) => filterNodeInternalStackFrames(item.contents.toString()))
    .join('\n');

describe('vite render error', () => {
  it('should emit an error with the route name and stack trace when a route fails to render', async () => {
    const build = await sku('build');

    await expect(build).toMatchExitCode(1);

    const stderr = aggregateStdErr(build.stderrArr);

    expect(stderr).toMatchInlineSnapshot(`
      "Error rendering HTML for route "/"
      Error: Home page error
          at HomePage ({cwd}/fixtures/vite-render-error/src/HomePage.tsx:2:9)
          at renderWithHooks ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:{line}:{column})
          at renderElement ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:{line}:{column})
          at retryNode ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:{line}:{column})
          at renderNodeDestructive ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:{line}:{column})
          at finishFunctionComponent ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:{line}:{column})
          at renderElement ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:{line}:{column})
          at retryNode ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:{line}:{column})
          at renderNodeDestructive ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:{line}:{column})
          at renderElement ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:{line}:{column})"
    `);
  });

  it('should emit an error with a stack trace when the render entrypoint throws an error', async () => {
    const build = await sku('build', ['--config', 'sku.config.renderError.ts']);

    await expect(build).toMatchExitCode(1);

    const stderr = aggregateStdErr(build.stderrArr);

    expect(stderr).toMatchInlineSnapshot(`
      "Error importing sku render entrypoint
      Error: Render entrypoint error
          at <anonymous> ({cwd}/fixtures/vite-render-error/src/renderError.tsx:7:7)
          at async file://{cwd}/packages/sku/dist/vite/prerender-worker.mjs:{line}:{column}"
    `);
  });
});
