import { execa } from 'execa';
import { globbySync } from 'globby';
import prompts from 'prompts';
import { dirname, join } from 'node:path';
import { CODEMODS } from '../utils/constants.js';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);

const expandFilePathsIfNeeded = (filesBeforeExpansion: string[]) => {
  const shouldExpandFiles = filesBeforeExpansion.some((file) =>
    file.includes('*'),
  );
  return shouldExpandFiles
    ? globbySync(filesBeforeExpansion)
    : filesBeforeExpansion;
};

export const jscodeshiftExecutable = require.resolve('.bin/jscodeshift');
export const transformerDirectory = join(__dirname, '../', 'codemods');

export const runTransform = async (
  transform: string,
  path: string,
  { dry, print, runInBand, verbose }: Record<string, boolean>,
): Promise<void> => {
  let transformer = transform;
  let directory = path;

  if (transform && !CODEMODS.find((codemod) => codemod.value === transform)) {
    console.error('Invalid transform choice, pick one of:');
    console.error(CODEMODS.map((codemod) => `- ${codemod.value}`).join('\n'));
    process.exit(1);
  }

  if (!path) {
    const res = await prompts(
      {
        type: 'text',
        name: 'path',
        message: 'On which files or directory should the codemods be applied?',
        initial: '.',
      },
      { onCancel: () => process.exit(1) },
    );

    directory = res.path;
  }

  if (!transform) {
    const res = await prompts(
      {
        type: 'select',
        name: 'transformer',
        message: 'Which transform would you like to apply?',
        choices: CODEMODS.reverse().map(({ title, value, version }) => ({
          title: `(v${version}) ${value}`,
          description: title,
          value,
        })),
      },
      { onCancel: () => process.exit(1) },
    );

    transformer = res.transformer;
  }

  const filesExpanded = expandFilePathsIfNeeded([directory]);

  if (!filesExpanded.length) {
    console.log(`No files found matching "${directory}"`);
    return;
  }

  const transformerPath = join(
    transformerDirectory,
    `${transformer}/${transformer}.cjs`,
  );

  let args = [];

  if (dry) {
    args.push('--dry');
  }
  if (print) {
    args.push('--print');
  }
  if (runInBand) {
    args.push('--run-in-band');
  }
  if (verbose) {
    args.push('--verbose=2');
  }
  args.push('--no-babel');

  args.push('--ignore-pattern=**/node_modules/**');

  args.push('--extensions=tsx,ts,jsx,js');

  args = args.concat(['--transform', transformerPath]);

  args = args.concat(filesExpanded);

  console.log(`Executing command: jscodeshift ${args.join(' ')}`);

  const execaChildProcess = execa(jscodeshiftExecutable, args, {
    // include ANSI color codes
    // Note: execa merges env with existing env by default.
    env: process.stdout.isTTY ? { FORCE_COLOR: 'true' } : {},
  });

  // "\n" + "a\n" + "b\n"
  let lastThreeLineBreaks = '';

  if (execaChildProcess.stdout) {
    execaChildProcess.stdout.pipe(process.stdout);
    execaChildProcess.stderr.pipe(process.stderr);

    // The last two lines contain the successful transformation count as "N ok".
    // To save memory, we "slide the window" to keep only the last three line breaks.
    // We save three line breaks because the EOL is always "\n".
    execaChildProcess.stdout.on('data', (chunk: any) => {
      lastThreeLineBreaks += chunk.toString('utf-8');

      let cutoff = lastThreeLineBreaks.length;

      // Note: the stdout ends with "\n".
      // "foo\n" + "bar\n" + "baz\n" -> "\nbar\nbaz\n"
      // "\n" + "foo\n" + "bar\n" -> "\nfoo\nbar\n"

      for (let i = 0; i < 3; i++) {
        cutoff = lastThreeLineBreaks.lastIndexOf('\n', cutoff) - 1;
      }

      if (cutoff > 0 && cutoff < lastThreeLineBreaks.length) {
        lastThreeLineBreaks = lastThreeLineBreaks.slice(cutoff + 1);
      }
    });
  }

  try {
    const result = await execaChildProcess;

    if (result.failed) {
      throw new Error(`jscodeshift exited with code ${result.exitCode}`);
    }
  } catch (error) {
    throw error;
  }

  // With ANSI color codes, it will be "\x1B[39m\x1B[32m0 ok".
  // Without, it will be "0 ok".
  const targetOkLine = lastThreeLineBreaks.split('\n').at(-3);

  if (!targetOkLine?.endsWith('ok')) {
    throw new Error(
      `Failed to parse the successful transformation count "${targetOkLine}". This is a bug in the codemod tool.`,
    );
  }
};
