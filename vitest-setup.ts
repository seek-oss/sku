import { afterAll, afterEach, expect } from 'vitest';
import {
  closeBrowser,
  appSnapshotSerializer,
  htmlSnapshotSerializer,
  cssSnapshotSerializer,
  sanitizeFilesSerializer,
} from '@sku-private/playwright';
import { cleanup, configure } from '@sku-private/testing-library';
import 'cli-testing-library/vitest';

configure();

expect.addSnapshotSerializer(sanitizeFilesSerializer);
expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(htmlSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);

afterEach(({ task }) => cleanup(task));

afterAll(() => {
  cleanup();
  closeBrowser();
});
