const parseArgs = require('./parseArgs');

describe('parseArgs', () => {
  test('sku script with short and long flag', () => {
    const { script, argv, env, config } = parseArgs([
      '/path/to/node',
      '/path/to/bin/sku',
      'lint',
      '-e',
      'test',
      '--config',
      'custom.sku.config.ts',
    ]);

    expect(script).toEqual('lint');
    expect(argv).toEqual([]);
    expect(env).toEqual('test');
    expect(config).toEqual('custom.sku.config.ts');
  });

  test('sku script with flag and argument', () => {
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

  test('sku script with argument, known flag and unknown flag', () => {
    const { script, argv, env } = parseArgs([
      '/path/to/node',
      '/path/to/bin/sku',
      'test',
      '-e',
      'test',
      'testFilter',
      '--someJestFlag',
    ]);

    expect(script).toEqual('test');
    expect(argv).toEqual(['testFilter', '--someJestFlag']);
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
