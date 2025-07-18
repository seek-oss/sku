import { expect } from 'vitest';
import { appSnapshotSerializer } from '@sku-private/puppeteer';
import '@sku-private/testing-library/vitest';

expect.addSnapshotSerializer(appSnapshotSerializer);
