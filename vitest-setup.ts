import { afterEach, expect } from 'vitest';
import {
  appSnapshotSerializer,
  htmlSnapshotSerializer,
  cssSnapshotSerializer,
  sanitizeFilesSerializer,
} from '@sku-private/puppeteer';
import { cleanup, configure } from '@sku-private/testing-library';
import 'cli-testing-library/vitest';

configure();

expect.addSnapshotSerializer(sanitizeFilesSerializer);
expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(htmlSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);

afterEach(({ task }) => cleanup(task));
