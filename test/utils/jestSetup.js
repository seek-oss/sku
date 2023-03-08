const {
  appSnapshotSerializer,
  cssSnapshotSerializer,
  htmlSnapshotSerializer,
} = require('./appSnapshot');

expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);
expect.addSnapshotSerializer(htmlSnapshotSerializer);

jest.setTimeout(90000);
