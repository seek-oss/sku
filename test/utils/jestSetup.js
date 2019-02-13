const jestSerializerHtml = require('jest-serializer-html');
const {
  appSnapshotSerializer,
  cssSnapshotSerializer
} = require('./appSnapshot');

expect.addSnapshotSerializer(jestSerializerHtml);
expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);

jest.setTimeout(90000);
