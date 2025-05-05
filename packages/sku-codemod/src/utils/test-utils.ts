import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vitest';

type FileInfo = {
  source: string;
  path: string;
};

const runInlineTest = async (
  transform: (source: string) => string | false,
  input: FileInfo,
  expectedOutput: string,
) => {
  const output = await transform(input.source);
  if (!output) {
    throw new Error('Transform failed');
  }
  const expectation = (o: string) =>
    expect(o.trim()).toEqual(expectedOutput.trim());
  expectation(output);
  return output;
};

export const runTest = async (
  dirName: string,
  transformName: string,
  testFilePrefix?: string,
  testOptions: Record<string, unknown> = {},
) => {
  let localTestFilePrefix = testFilePrefix;
  if (!testFilePrefix) {
    localTestFilePrefix = transformName;
  }

  // Assumes transform is one level up from __tests__ directory
  const transform = (await import(path.join(dirName, '..', transformName)))
    .transform;
  const fixtureDir = path.join(dirName, '..', '__testfixtures__');
  const inputPath = path.join(
    fixtureDir,
    `${localTestFilePrefix}.input.${testOptions.extension}`,
  );
  const source = await readFile(inputPath, 'utf8');
  const expectedOutput = await readFile(
    path.join(
      fixtureDir,
      `${localTestFilePrefix}.output.${testOptions.extension}`,
    ),
    'utf8',
  );
  return runInlineTest(
    transform,
    {
      path: inputPath,
      source,
    },
    expectedOutput,
  );
};

export const runNoChangeTest = async (
  dirName: string,
  transformName: string,
  testFilePrefix: string,
  testOptions: Record<string, unknown>,
) => {
  const transform = (await import(path.join(dirName, '..', transformName)))
    .transform;
  const inputPath = path.join(
    dirName,
    '..',
    '__testfixtures__',
    `${testFilePrefix}.unchanged.${testOptions.extension}`,
  );
  const source = await readFile(inputPath, 'utf8');
  const output = await transform(source);
  expect(output).toEqual(false);
};
