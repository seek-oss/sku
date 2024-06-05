/**
 * @jest-environment node
 */

const parseArgs = require('./parseArgs');

describe('parseArgs', () => {
  test('sku script with short and long flag', () => {
    const { script, argv, environment, config } = parseArgs([
      '/path/to/node',
      '/path/to/bin/sku',
      'lint',
      '--environment',
      'test',
      '--config',
      'custom.sku.config.ts',
    ]);

    expect(script).toEqual('lint');
    expect(argv).toEqual([]);
    expect(environment).toEqual('test');
    expect(config).toEqual('custom.sku.config.ts');
  });

  test('sku script with flag and argument', () => {
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

  test('sku script with argument, known flag and unknown flag', () => {
    const { script, argv, environment } = parseArgs([
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
    expect(environment).toEqual('test');
  });

  test('debug', () => {
    expect(
      parseArgs(['/path/to/node', '/path/to/bin/sku', 'build']).debug,
    ).toBe(false);

    expect(
      parseArgs(['/path/to/node', '/path/to/bin/sku', '-D', 'build']).debug,
    ).toBe(true);
  });
});
