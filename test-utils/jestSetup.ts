import 'jest-puppeteer';

import appSnapshotSerializer from './appSnapshotSerializer';
import cssSnapshotSerializer from './cssSnapshotSerializer';
import htmlSnapshotSerializer from './htmlSnapshotSerializer';

expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);
expect.addSnapshotSerializer(htmlSnapshotSerializer);

jest.setTimeout(90000);
