import { afterAll, afterEach, expect } from 'vitest';
import {
  appSnapshotSerializer,
  htmlSnapshotSerializer,
  cssSnapshotSerializer,
  sanitizeFilesSerializer,
  // closeBrowser,
} from '@sku-private/playwright';
import { cleanup, configure } from '@sku-private/testing-library';
import 'cli-testing-library/vitest';

configure();

expect.addSnapshotSerializer(sanitizeFilesSerializer);
expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(htmlSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);

afterEach(({ task }) => {
  console.log('cleaning up task', task.name);
  return cleanup(task);
});

afterAll(() => {
  cleanup();
  // closeBrowser();
});
