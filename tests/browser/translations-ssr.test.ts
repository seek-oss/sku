import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';
import {
  cleanup,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';

const { sku } = scopeToFixture('translations');

const webpackSsrUrl = `http://localhost:8314`;
const viteSsrUrl = `http://localhost:8315`;

// Suites must run sequentially: both start long-lived servers in the same
// fixture (shared Vocab watch / webpack compile), and concurrent describe
// blocks start both beforeAll hooks at once, which hangs webpack start-ssr.
describe('ssr translations', () => {
  beforeAll(async () => {
    const startSsr = await sku('start-ssr', ['--config=sku-ssr.config.ts']);
    await startSsr.findByText('Server started');
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should render en', async ({ task, expect }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${webpackSsrUrl}/en` });
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async ({ task, expect }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${webpackSsrUrl}/fr` });
    expect(app).toMatchSnapshot();
  });

  it('should render en-PSEUDO', async ({ task, expect }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({
      url: `${webpackSsrUrl}/en?pseudo=true`,
    });
    expect(app).toMatchSnapshot();
  });
});

describe('vite ssr translations', () => {
  beforeAll(async () => {
    const start = await sku('start', ['--config=sku.config.vite-ssr.ts']);
    await start.findByText('Starting development server');
  });

  it('should render en', async ({ task, expect }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${viteSsrUrl}/en` });
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async ({ task, expect }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${viteSsrUrl}/fr` });
    expect(app).toMatchSnapshot();
  });

  it('should render en-PSEUDO', async ({ task, expect }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({
      url: `${viteSsrUrl}/en?pseudo=true`,
    });
    expect(app).toMatchSnapshot();
  });
});
