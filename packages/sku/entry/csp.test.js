import createCSPHandler from './csp.js';

describe('createCSPHandler', () => {
  it('should create a CSP tag', () => {
    const cspHandler = createCSPHandler();

    cspHandler.registerScript('<script>console.log("Hello, World!")</script>');
    cspHandler.registerScript(
      '<script><script src="https://code.jquery.com/jquery-3.5.0.slim.min.js"></script></script>',
    );
    cspHandler.registerScript('<script>console.log("Hello, World!")</script>');

    expect(cspHandler.createCSPTag()).toMatchInlineSnapshot(
      `"<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'sha256-uCWFWr3Z6MtMWnxQ5Qyr6+zW+EGpZvdwyqLxlDbe/rE=' 'sha256-lLONtxmGZgnK0e52sTdx8mwK2vMdmln9LPZAbPGHAR0=';">"`,
    );
  });

  it('should inject a CSP tag into HTML', () => {
    const cspHandler = createCSPHandler();

    cspHandler.registerScript('<script>console.log("Hello, World!")</script>');
    cspHandler.registerScript(
      '<script><script src="https://code.jquery.com/jquery-3.5.0.slim.min.js"></script></script>',
    );
    cspHandler.registerScript('<script>console.log("Hello, World!")</script>');

    const html = /* html */ `<html><head></head><body>Welcome to my App!</body></html>`;

    expect(cspHandler.handleHtml(html)).toMatchInlineSnapshot(
      `"<html><head><meta http-equiv="Content-Security-Policy" content="script-src 'self' 'sha256-uCWFWr3Z6MtMWnxQ5Qyr6+zW+EGpZvdwyqLxlDbe/rE=' 'sha256-lLONtxmGZgnK0e52sTdx8mwK2vMdmln9LPZAbPGHAR0=';"></head><body>Welcome to my App!</body></html>"`,
    );
  });
});
