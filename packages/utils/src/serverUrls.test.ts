import { describe, it, expect, vi } from 'vitest';
import { serverUrls } from './serverUrls.js';

describe('serverUrls.first()', () => {
  it('generates a http URL with host only', () => {
    const urls = serverUrls({ hosts: ['localhost'] });
    expect(urls.first()).toBe('http://localhost');
  });

  it('generates a http URL with host and port', () => {
    const urls = serverUrls({ hosts: ['localhost'], port: 3000 });
    expect(urls.first()).toBe('http://localhost:3000');
  });

  it('generates a https URL with host and port', () => {
    const urls = serverUrls({ hosts: ['myhost.com'], port: 8080, https: true });
    expect(urls.first()).toBe('https://myhost.com:8080');
  });

  it('appends initialPath when set', () => {
    const urls = serverUrls({
      hosts: ['dev.site.com'],
      port: 3005,
      initialPath: '/foobar',
    });
    expect(urls.first()).toBe('http://dev.site.com:3005/foobar');
  });

  it('handles empty initialPath gracefully', () => {
    const urls = serverUrls({
      hosts: ['host.test'],
      port: 1234,
      initialPath: '',
    });
    expect(urls.first()).toBe('http://host.test:1234');
  });

  it('handles non-string initialPath', () => {
    const urls = serverUrls({
      hosts: ['host.test'],
      port: 1234,
      initialPath: undefined,
    });
    expect(urls.first()).toBe('http://host.test:1234');
  });

  it('does not trim whitespace from initialPath', () => {
    const urls = serverUrls({
      hosts: ['host.test'],
      port: 8990,
      initialPath: '   /go ',
    });
    expect(urls.first()).toBe('http://host.test:8990   /go ');
  });

  it('works with full feature set (https, initialPath, port)', () => {
    const urls = serverUrls({
      hosts: ['secure.domain'],
      port: 443,
      initialPath: '/app',
      https: true,
    });
    expect(urls.first()).toBe('https://secure.domain:443/app');
  });
});

describe('serverUrls.print()', () => {
  it('prints the first url', () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    serverUrls({ hosts: ['localhost', 'localhost2'] }).print();
    expect(consoleLogSpy.mock.calls.flat()).toMatchInlineSnapshot(`
      [
        "➜  Local: http://localhost",
      ]
    `);
  });

  it('prints the first url with a port', () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    serverUrls({ hosts: ['localhost'], port: 3000 }).print();
    expect(consoleLogSpy.mock.calls.flat()).toMatchInlineSnapshot(`
      [
        "➜  Local: http://localhost:3000",
      ]
    `);
  });

  it('prints the first url with a port and initialPath', () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    serverUrls({
      hosts: ['localhost'],
      port: 3000,
      initialPath: '/foo',
    }).print();
    expect(consoleLogSpy.mock.calls.flat()).toMatchInlineSnapshot(`
      [
        "➜  Local: http://localhost:3000/foo",
      ]
    `);
  });

  it('prints the first url with a port and initialPath and https', () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    serverUrls({
      hosts: ['localhost'],
      port: 3000,
      initialPath: '/foo',
      https: true,
    }).print();
    expect(consoleLogSpy.mock.calls.flat()).toMatchInlineSnapshot(`
      [
        "➜  Local: https://localhost:3000/foo",
      ]
    `);
  });

  it('prints number of urls', () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    serverUrls({ hosts: ['localhost', 'localhost2', 'secure.domain'] }).print(
      2,
    );
    expect(consoleLogSpy.mock.calls.flat()).toMatchInlineSnapshot(`
      [
        "➜  Local: http://localhost",
        "➜  Local: http://localhost2",
      ]
    `);
  });
});

describe('serverUrls.printAll()', () => {
  it('prints all urls', () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    serverUrls({
      hosts: ['localhost', 'localhost2', 'secure.domain'],
    }).printAll();
    expect(consoleLogSpy.mock.calls.flat()).toMatchInlineSnapshot(`
        [
          "➜  Local: http://localhost",
          "➜  Local: http://localhost2",
          "➜  Local: http://secure.domain",
        ]
      `);
  });
});
