import { describe, beforeAll, afterAll, it, expect, vi } from 'vitest';
import { getTextContent } from '@sku-private/playwright';

import {
  bundlers,
  type BundlerValues,
  cleanup,
  configure,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';

const storybookStartedRegex = /Storybook ready!/;

const timeout = 150_000;

configure({
  asyncUtilTimeout: timeout,
});

vi.setConfig({
  hookTimeout: timeout + 1000,
  testTimeout: timeout + 1000,
});

const { exec } = scopeToFixture('storybook-config');

const storybookConfig: BundlerValues<{
  configDir: string;
  startPort: number;
  docsPort: number;
  assetServerPort: number;
  outputDir: string;
  assetServerScript: string;
}> = {
  webpack: {
    configDir: '.storybook',
    startPort: 8089,
    docsPort: 8088,
    assetServerPort: 4232,
    outputDir: 'storybook-static',
    assetServerScript: 'start:asset-server',
  },
  vite: {
    configDir: '.storybook-vite',
    startPort: 8091,
    docsPort: 8090,
    assetServerPort: 4233,
    outputDir: 'storybook-static-vite',
    assetServerScript: 'start:asset-server:vite',
  },
};

describe('storybook-config', () => {
  describe.for(bundlers)('bundler: %s', (bundler) => {
    const {
      configDir,
      startPort,
      docsPort,
      assetServerPort,
      outputDir,
      assetServerScript,
    } = storybookConfig[bundler];

    describe('start', () => {
      const storybookBaseUrl = `http://localhost:${startPort}`;

      const middlewareUrl = `${storybookBaseUrl}/test-middleware`;
      const storyIframePath =
        '/iframe.html?viewMode=story&id=testcomponent--default';
      const storyIframeUrl = `${storybookBaseUrl}${storyIframePath}`;

      beforeAll(async () => {
        const storybook = await exec('pnpm', [
          'storybook',
          'dev',
          '--ci',
          '--exact-port',
          '--port',
          startPort.toString(),
          '--config-dir',
          configDir,
        ]);
        await storybook.findByText(storybookStartedRegex);
      });

      afterAll(async () => {
        await cleanup();
      });

      it('should start sku dev middleware if configured', async ({ task }) => {
        skipCleanup(task.id);
        const response = await fetch(middlewareUrl);

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('OK');
      });

      it('should render decorators defined in the storybook preview file', async ({
        task,
      }) => {
        skipCleanup(task.id);
        const { text, fontSize } = await getTextContent(
          storyIframeUrl,
          '[data-automation-decorator]',
        );

        expect(text).toEqual('Braid Text decorator');
        expect(fontSize).toEqual('16px');
      });

      it('should render a component inside a story', async ({ task }) => {
        skipCleanup(task.id);
        const { text, fontSize } = await getTextContent(
          storyIframeUrl,
          '[data-automation-text]',
        );

        expect(text).toEqual('Hello world');
        expect(fontSize).toEqual('16px');
      });

      it('should render vanilla styles', async ({ task }) => {
        skipCleanup(task.id);
        const { text, fontSize } = await getTextContent(
          storyIframeUrl,
          '[data-automation-vanilla]',
        );

        expect(text).toEqual('32px vanilla text');
        expect(fontSize).toEqual('32px');
      });
    });

    describe('start docs page', () => {
      it('should render a ".mdx" file', async () => {
        const storybook = await exec('pnpm', [
          'storybook',
          'dev',
          '--ci',
          '--exact-port',
          '--port',
          docsPort.toString(),
          '--config-dir',
          configDir,
        ]);
        expect(
          await storybook.findByText(storybookStartedRegex),
        ).toBeInTheConsole();

        const docsIframeUrl = `http://localhost:${docsPort}/iframe.html?viewMode=docs&id=docstest--docs`;

        const doctest = await getTextContent(docsIframeUrl, '#docs-test');
        expect(doctest.text).toEqual('Docs Test');
        expect(doctest.fontSize).toEqual('32px');

        const doctestParagraph = await getTextContent(
          docsIframeUrl,
          '#docs-test + p',
        );
        expect(doctestParagraph.text).toEqual('I am a test document.');
        expect(doctestParagraph.fontSize).toEqual('14px');
      });
    });

    describe('build-storybook', () => {
      const assetServerUrl = `http://localhost:${assetServerPort}`;

      const storyIframePath =
        '/iframe.html?viewMode=story&id=testcomponent--default';
      const storyIframeUrl = `${assetServerUrl}${storyIframePath}`;

      const docsIframePath = '/iframe.html?viewMode=docs&id=docstest--docs';
      const docsIframeUrl = `${assetServerUrl}${docsIframePath}`;

      beforeAll(async () => {
        const storybook = await exec('pnpm', [
          'storybook',
          'build',
          '--config-dir',
          configDir,
          '--output-dir',
          outputDir,
        ]);
        await expect(storybook).toMatchExitCode(0);

        const assetServer = await exec('pnpm', ['run', assetServerScript]);
        await assetServer.findByText(`serving ${outputDir}`);
      });

      afterAll(async () => {
        await cleanup();
      });

      it('should render decorators defined in the storybook preview file', async ({
        task,
      }) => {
        skipCleanup(task.id);

        const { text, fontSize } = await getTextContent(
          storyIframeUrl,
          '[data-automation-decorator]',
        );

        expect(text).toEqual('Braid Text decorator');
        expect(fontSize).toEqual('16px');
      });

      it('should render a component inside a story', async ({ task }) => {
        skipCleanup(task.id);

        const { text, fontSize } = await getTextContent(
          storyIframeUrl,
          '[data-automation-text]',
        );

        expect(text).toEqual('Hello world');
        expect(fontSize).toEqual('16px');
      });

      it('should render vanilla styles', async ({ task }) => {
        skipCleanup(task.id);

        const { text, fontSize } = await getTextContent(
          storyIframeUrl,
          '[data-automation-vanilla]',
        );

        expect(text).toEqual('32px vanilla text');
        expect(fontSize).toEqual('32px');
      });

      it('should render a ".mdx" file > docs-test', async ({ task }) => {
        skipCleanup(task.id);
        const { text, fontSize } = await getTextContent(
          docsIframeUrl,
          '#docs-test',
        );

        expect(text).toEqual('Docs Test');
        expect(fontSize).toEqual('32px');
      });

      it('should render a ".mdx" file > docs-test + p', async ({ task }) => {
        skipCleanup(task.id);
        const { text, fontSize } = await getTextContent(
          docsIframeUrl,
          '#docs-test + p',
        );

        expect(text).toEqual('I am a test document.');
        expect(fontSize).toEqual('14px');
      });
    });
  });
});
