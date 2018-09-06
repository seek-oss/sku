const parseArgs = require('./parseArgs');

describe('arg parsing', () => {
  test('script invocation', () => {
    const { script, argv, env } = parseArgs([
      '/path/to/node',
      '/path/to/scripts/lint.js',
      '-e',
      'test'
    ]);
    expect(script).toEqual('lint');
    expect(argv).toEqual([]);
    expect(env).toEqual('test');
  });

  test('script invocation with args', () => {
    const { script, argv, env } = parseArgs([
      '/path/to/node',
      '/path/to/scripts/lint.js',
      'src/components/**',
      '-e',
      'test'
    ]);
    expect(script).toEqual('lint');
    expect(argv).toEqual(['src/components/**']);
    expect(env).toEqual('test');
  });

  test('sku exec', () => {
    const { script, argv, env } = parseArgs([
      '/path/to/node',
      '/path/to/bin/sku',
      'lint',
      '-e',
      'test'
    ]);
    expect(script).toEqual('lint');
    expect(argv).toEqual([]);
    expect(env).toEqual('test');
  });

  test('sku exec with args', () => {
    const { script, argv, env } = parseArgs([
      '/path/to/node',
      '/path/to/bin/sku',
      'lint',
      'src/components/**',
      '-e',
      'test'
    ]);
    expect(script).toEqual('lint');
    expect(argv).toEqual(['src/components/**']);
    expect(env).toEqual('test');
  });
});
