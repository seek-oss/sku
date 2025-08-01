import { afterEach, expect } from 'vitest';
import {
  appSnapshotSerializer,
  htmlSnapshotSerializer,
  cssSnapshotSerializer,
} from '@sku-private/puppeteer';
import { cleanup, configure } from '@sku-private/testing-library';
import '@sku-private/testing-library/vitest';

configure();

expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(htmlSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);

afterEach(({ task }) => cleanup(task));
