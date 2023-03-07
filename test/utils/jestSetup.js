const {
  appSnapshotSerializer,
  cssSnapshotSerializer,
  htmlSnapshotSerializer,
} = require('./appSnapshot');

expect.addSnapshotSerializer(appSnapshotSerializer);
expect.addSnapshotSerializer(cssSnapshotSerializer);
expect.addSnapshotSerializer(htmlSnapshotSerializer);

jest.setTimeout(90000);

const { TextEncoder, TextDecoder } = require('util');

// The `jsdom` jest environment doesn't expose `TextEncoder` or `TextDecoder`
// AFAIK this hack was never required when braid was using sku to run tests,
// so I'm not sure why it has suddenly become an issue
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
