import { afterEach, expect } from 'vitest';
import { appSnapshotSerializer } from '@sku-private/puppeteer';
import { cleanup, configure } from '@sku-private/testing-library';
import '@sku-private/testing-library/vitest';

configure();

expect.addSnapshotSerializer(appSnapshotSerializer);

afterEach(({ task }) => cleanup(task));
