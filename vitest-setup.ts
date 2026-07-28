import { afterAll, afterEach, expect } from 'vitest';
import {
  appSnapshotSerializer,
  htmlSnapshotSerializer,
  cssSnapshotSerializer,
  sanitizeFilesSerializer,
  closeBrowser,
} from '@sku-private/playwright';
import { cleanup, configure } from '@sku-private/testing-library';
import 'cli-testing-library/vitest';
import '@sku-private/testing-library/matchers';

configure();

expect.addSnapshotSerializer(sanitizeFilesSerializer);
expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(htmlSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);

afterEach(({ task }) => {
  cleanup(task);
});

afterAll(() => {
  cleanup();
  closeBrowser();
});
