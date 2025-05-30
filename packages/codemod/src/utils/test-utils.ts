import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vitest';

type FileInfo = {
  source: string;
  path: string;
};

type InlineTestProps = {
  transform: (source: string) => string | false;
  input: FileInfo;
  expectedOutput: string;
};

type TestProps = {
  dirName: string;
  transformName: string;
  fixtureName?: string;
  testOptions?: Record<string, unknown>;
};

const runInlineTest = async ({
  transform,
  input,
  expectedOutput,
}: InlineTestProps) => {
  const output = await transform(input.source);
  if (!output) {
    throw new Error('Transform failed');
  }
  const expectation = (o: string) =>
    expect(o.trim()).toEqual(expectedOutput.trim());
  expectation(output);
  return output;
};

export const runTest = async ({
  dirName,
  transformName,
  fixtureName,
  testOptions = {},
}: TestProps) => {
  const testFixtureName = fixtureName || transformName;

  // Assumes transform is one level up from __tests__ directory
  const transform = (await import(path.join(dirName, '..', transformName)))
    .transform;
  const fixtureDir = path.join(dirName, '..', '__testfixtures__');
  const inputPath = path.join(
    fixtureDir,
    `${testFixtureName}.input.${testOptions.extension}`,
  );
  const source = await readFile(inputPath, 'utf8');
  const expectedOutput = await readFile(
    path.join(fixtureDir, `${testFixtureName}.output.${testOptions.extension}`),
    'utf8',
  );
  return runInlineTest({
    transform,
    input: {
      path: inputPath,
      source,
    },
    expectedOutput,
  });
};

export const runNoChangeTest = async ({
  dirName,
  transformName,
  fixtureName,
  testOptions = {},
}: TestProps) => {
  const transform = (await import(path.join(dirName, '..', transformName)))
    .transform;
  const inputPath = path.join(
    dirName,
    '..',
    '__testfixtures__',
    `${fixtureName}.unchanged.${testOptions.extension}`,
  );
  const source = await readFile(inputPath, 'utf8');
  const output = await transform(source);
  expect(output).toEqual(false);
};
