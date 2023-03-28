const parseArgs = require('./parseArgs');

describe('arg parsing', () => {
  test('sku exec', () => {
    const { script, argv, env } = parseArgs([
      '/path/to/node',
      '/path/to/bin/sku',
      'lint',
      '-e',
      'test',
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
      'test',
    ]);
    expect(script).toEqual('lint');
    expect(argv).toEqual(['src/components/**']);
    expect(env).toEqual('test');
  });

  test('debug', () => {
    expect(
      parseArgs(['/path/to/node', '/path/to/bin/sku', 'build']).debug,
    ).toBeUndefined();

    expect(
      parseArgs(['/path/to/node', '/path/to/bin/sku', '-D', 'build']).debug,
    ).toBe(true);
  });
});
