import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import jscodeshift, {
  type FileInfo,
  type Transform,
  type Parser,
} from 'jscodeshift';

type CodeshiftTransform = { default: Transform; parser?: Parser } & Transform;

const applyTransform = (
  module: CodeshiftTransform,
  options: Record<string, unknown>,
  input: FileInfo,
  testOptions: Record<string, unknown> & { parser?: Parser } = {},
) => {
  // Handle ES6 modules using default export for the transform
  const transform = module.default ? module.default : module;

  // Jest resets the module registry after each test, so we need to always get
  // a fresh copy of jscodeshift on every test run.
  let usedJscodeshift = jscodeshift;
  if (testOptions.parser || module.parser) {
    usedJscodeshift = jscodeshift.withParser(
      testOptions.parser || module.parser || 'babel',
    );
  }

  const output = transform(
    input,
    {
      jscodeshift: usedJscodeshift,
      j: usedJscodeshift,
      stats: () => {},
      report: () => {},
    },
    options || {},
  );

  // Support async transforms
  if (output instanceof Promise) {
    return output.then((o: string | void | undefined | null) =>
      (o || '').trim(),
    );
  }

  return (output || '').trim();
};

const runInlineTest = (
  module: CodeshiftTransform,
  options: Record<string, unknown>,
  input: FileInfo,
  expectedOutput: string,
  testOptions: Record<string, unknown>,
) => {
  const output = applyTransform(module, options, input, testOptions);
  const expectation = (o: string) => expect(o).toEqual(expectedOutput.trim());
  if (output instanceof Promise) {
    return output.then((o: string) => {
      expectation(o);
      return o;
    });
  }
  expectation(output);
  return output;
};

function extensionForParser(parser: string) {
  switch (parser) {
    case 'ts':
    case 'tsx':
      return parser;
    default:
      return 'js';
  }
}

const runTest = async (
  dirName: string,
  transformName: string,
  options: Record<string, unknown>,
  testFilePrefix?: string,
  testOptions: Record<string, unknown> = {},
) => {
  let localTestFilePrefix = testFilePrefix;
  if (!testFilePrefix) {
    localTestFilePrefix = transformName;
  }

  // Assumes transform is one level up from __tests__ directory
  const module = await import(path.join(dirName, '..', transformName));
  const extension = extensionForParser(testOptions.parser || module.parser);
  const fixtureDir = path.join(dirName, '..', '__testfixtures__');
  const inputPath = path.join(
    fixtureDir,
    `${localTestFilePrefix}.input.${extension}`,
  );
  const source = fs.readFileSync(inputPath, 'utf8');
  const expectedOutput = fs.readFileSync(
    path.join(fixtureDir, `${localTestFilePrefix}.output.${extension}`),
    'utf8',
  );
  const testResult = runInlineTest(
    module,
    options,
    {
      path: inputPath,
      source,
    },
    expectedOutput,
    testOptions,
  );

  return testResult instanceof Promise ? testResult : undefined;
};
/**
 * Handles some boilerplate around defining a simple jest/Jasmine test for a
 * jscodeshift transform.
 */
export const defineTest = (
  dirName: string,
  transformName: string,
  options: Record<string, unknown>,
  testFilePrefix: string,
  testOptions: Record<string, unknown> = {},
) => {
  const testName = testFilePrefix
    ? `transforms correctly using "${testFilePrefix}" data`
    : 'transforms correctly';
  describe(transformName, () => {
    it(testName, () => {
      const testResult = runTest(
        dirName,
        transformName,
        options,
        testFilePrefix,
        testOptions,
      );
      return testResult instanceof Promise ? testResult : undefined;
    });
  });
};
