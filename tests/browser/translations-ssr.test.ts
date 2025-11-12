import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';
import {
  cleanup,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';

const { sku } = scopeToFixture('translations');

const backendUrl = `http://localhost:8314`;

describe.concurrent('ssr translations', () => {
  beforeAll(async () => {
    const startSsr = await sku('start-ssr', ['--config=sku-ssr.config.ts']);
    globalExpect(
      await startSsr.findByText('Server started'),
    ).toBeInTheConsole();
  });

  afterAll(cleanup);

  it('should render en', async ({ task, expect }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${backendUrl}/en` });
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async ({ task, expect }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${backendUrl}/fr` });
    expect(app).toMatchSnapshot();
  });

  it('should render en-PSEUDO', async ({ task, expect }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({
      url: `${backendUrl}/en?pseudo=true`,
    });
    expect(app).toMatchSnapshot();
  });
});
