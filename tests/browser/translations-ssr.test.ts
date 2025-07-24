import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import {
  cleanup,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';

const { render } = scopeToFixture('translations');

const backendUrl = `http://localhost:8314`;

describe('ssr translations', () => {
  beforeAll(async () => {
    const startSsr = await render('start-ssr', ['--config=sku-ssr.config.ts']);
    globalExpect(
      await startSsr.findByText('Server started'),
    ).toBeInTheConsole();
  });

  afterAll(cleanup);

  it('should render en', async ({ expect, task }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ expect, url: `${backendUrl}/en` });
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async ({ expect, task }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ expect, url: `${backendUrl}/fr` });
    expect(app).toMatchSnapshot();
  });

  it('should render en-PSEUDO', async ({ expect, task }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({
      expect,
      url: `${backendUrl}/en?pseudo=true`,
    });
    expect(app).toMatchSnapshot();
  });
});
