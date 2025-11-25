import { describe, it, expect } from 'vitest';
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

    const html =
      /* html */
      `<html>
        <!--
          Hello
          World!
        -->
        <head>
          <script>
            console.log("Hello, World!");
            console.log("Hello, World!");
          </script>
          <noscript>
            You have
            Javascript disabled
          </noscript>
          <style>
            div {
              color: papayawhip;
            }
          </style>
        </head>
        <body>
          <div>
            Welcome to my App!
          </div>
          <pre>
            Multi
            Line
            Text
          </pre>
      </html>`;

    expect(cspHandler.handleHtml(html)).toMatchInlineSnapshot(`
      "<html>
              <!--
                Hello
                World!
              -->
              <head><meta http-equiv="Content-Security-Policy" content="script-src 'self' 'sha256-uCWFWr3Z6MtMWnxQ5Qyr6+zW+EGpZvdwyqLxlDbe/rE=' 'sha256-lLONtxmGZgnK0e52sTdx8mwK2vMdmln9LPZAbPGHAR0=' 'sha256-IYf6lwpasx2aXpcaX33x4ihyqfUb7LQFFjpVwJyfoYk=';">
                <script>
                  console.log("Hello, World!");
                  console.log("Hello, World!");
                </script>
                <noscript>
                  You have
                  Javascript disabled
                </noscript>
                <style>
                  div {
                    color: papayawhip;
                  }
                </style>
              </head>
              
                <div>
                  Welcome to my App!
                </div>
                <pre>
                  Multi
                  Line
                  Text
                </pre>
            </html>"
    `);
  });

  describe('createUnsafeNonce', () => {
    it('should form a valid nonce value', () => {
      const cspHandler = createCSPHandler();

      const nonce = cspHandler.createUnsafeNonce();

      expect(nonce).toMatch(/^[A-Za-z0-9+/=]{32}$/);
    });

    it('should generate unique nonces', () => {
      const cspHandler = createCSPHandler();

      const nonce1 = cspHandler.createUnsafeNonce();
      const nonce2 = cspHandler.createUnsafeNonce();

      expect(nonce1).not.toBe(nonce2);
    });

    it('should add nonce to CSP tag', () => {
      const cspHandler = createCSPHandler();

      const nonce = cspHandler.createUnsafeNonce();

      const cspTag = cspHandler.createCSPTag();
      expect(cspTag).toContain(`nonce-${nonce}`);
    });
  });
});
