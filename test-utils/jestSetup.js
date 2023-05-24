const appSnapshotSerializer = require('./appSnapshotSerializer');
const cssSnapshotSerializer = require('./cssSnapshotSerializer');
const htmlSnapshotSerializer = require('./htmlSnapshotSerializer');

expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);
expect.addSnapshotSerializer(htmlSnapshotSerializer);

jest.setTimeout(90000);
