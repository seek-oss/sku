import { TextEncoder, TextDecoder } from 'util';

// The `jsdom` jest environment doesn't expose `TextEncoder` or `TextDecoder`
// https://github.com/jsdom/jsdom/issues/2524
// Required because we call `renderToString` from `react-dom/server`
// Not sure why this is required as of react 18
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
