import { afterEach, expect } from 'vitest';
import { appSnapshotSerializer } from '@sku-private/puppeteer';
import { cleanup } from '@sku-private/testing-library';
import '@sku-private/testing-library/vitest';

expect.addSnapshotSerializer(appSnapshotSerializer);

afterEach(({ task }) => cleanup(task));
