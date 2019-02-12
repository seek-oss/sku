const jestSerializerHtml = require('jest-serializer-html');
const { appSnapshotSerializer } = require('./appSnapshot');

expect.addSnapshotSerializer(jestSerializerHtml);
expect.addSnapshotSerializer(appSnapshotSerializer);

jest.setTimeout(90000);
