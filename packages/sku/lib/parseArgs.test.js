const parseArgs = require('./parseArgs');

describe('arg parsing', () => {
  test('sku exec', () => {
    const { script, argv, environment } = parseArgs([
      '/path/to/node',
      '/path/to/bin/sku',
      'lint',
      '--environment',
      'test',
    ]);
    expect(script).toEqual('lint');
    expect(argv).toEqual([]);
    expect(environment).toEqual('test');
  });

  test('sku exec with args', () => {
    const { script, argv, environment } = parseArgs([
      '/path/to/node',
      '/path/to/bin/sku',
      'lint',
      'src/components/**',
      '--environment',
      'test',
    ]);
    expect(script).toEqual('lint');
    expect(argv).toEqual(['src/components/**']);
    expect(environment).toEqual('test');
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
