import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vitest';
import { isValidTransform, type Transform } from './types.js';

type FileInfo = {
  source: string;
  path: string;
};

type InlineTestProps = {
  transform: Transform;
  input: FileInfo;
  expectedOutput: string;
};

type TestProps = {
  dirName: string;
  transformName: string;
  fixtureName?: string;
  testOptions?: { extension?: string };
};

const runInlineTest = async ({
  transform,
  input,
  expectedOutput,
}: InlineTestProps) => {
  if (!isValidTransform(transform)) {
    throw new Error('Invalid transform function provided');
  }

  const output = transform(input.source);
  if (!output) {
    throw new Error('Transform failed');
  }

  expect(output.trim()).toEqual(expectedOutput.trim());

  return output;
};

export const runTest = async ({
  dirName,
  transformName,
  fixtureName,
  testOptions = {},
}: TestProps) => {
  const testFixtureName = fixtureName || transformName;

  const fixtureDir = path.join(dirName, '..', '__testfixtures__');
  const inputPath = path.join(
    fixtureDir,
    `${testFixtureName}.input.${testOptions.extension}`,
  );

  // Assumes transform is one level up from __tests__ directory
  const transformImport = import(path.join(dirName, '..', transformName));
  const sourceRead = readFile(inputPath, 'utf8');
  const expectedOutputRead = readFile(
    path.join(fixtureDir, `${testFixtureName}.output.${testOptions.extension}`),
    'utf8',
  );

  const [{ transform }, source, expectedOutput] = await Promise.all([
    transformImport,
    sourceRead,
    expectedOutputRead,
  ]);

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
  const inputPath = path.join(
    dirName,
    '..',
    '__testfixtures__',
    `${fixtureName}.unchanged.${testOptions.extension}`,
  );

  const sourceRead = readFile(inputPath, 'utf8');
  const transformImport = import(path.join(dirName, '..', transformName));

  const [{ transform }, source] = await Promise.all([
    transformImport,
    sourceRead,
  ]);
  const output = await transform(source);

  expect(output).toEqual(null);
};
