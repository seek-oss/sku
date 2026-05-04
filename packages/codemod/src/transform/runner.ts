import { glob } from 'tinyglobby';
import { intro, outro, spinner } from '@clack/prompts';
import { join } from 'node:path';
import { CODEMODS } from '../utils/constants.js';
import { Worker } from 'node:worker_threads';
import os from 'node:os';
import picocolors from 'picocolors';
import debug from 'debug';
import {
  chooseInteractiveTransformerPaths,
  getTargetDirectoryFromPrompt,
  resolveCodemodModule,
} from './interactive-selection.js';

const log = debug('sku:codemod');

export { transformerPathsForJestSubsteps } from './interactive-selection.js';

type Options = {
  dry?: boolean;
  print?: boolean;
};

export type JobWorkerData = {
  transformerPaths: string[];
  options: Options;
  jobs: Array<{
    filePath: string;
  }>;
};

export const runTransform = async (
  transform: string,
  _path: string,
  options: Options,
): Promise<void> => {
  let transformerPaths: string[];
  let showClackOutro = false;

  if (options.dry) {
    console.log(
      picocolors.yellowBright(
        picocolors.bold('Running in dry mode, no files will be modified.'),
      ),
    );
  }

  if (transform) {
    const codemod = CODEMODS.find((c) => c.value === transform);
    if (!codemod) {
      console.error('Invalid transform choice, pick one of:');
      console.error(CODEMODS.map((c) => `- ${c.value}`).join('\n'));
      process.exit(1);
    }
    transformerPaths = [resolveCodemodModule(codemod.value)];
  } else {
    intro('sku codemod');
    showClackOutro = true;
    transformerPaths = await chooseInteractiveTransformerPaths();
  }

  const path = _path || (await getTargetDirectoryFromPrompt());

  const filesExpanded = await getAllFiles(path);

  if (!filesExpanded.length) {
    console.log(`No files found matching "${path}"`);
    if (showClackOutro) {
      outro('No matching files.');
    }
    process.exit(0);
  }

  const cpus =
    os.cpus().length > filesExpanded.length
      ? filesExpanded.length
      : os.cpus().length;
  const chunkSize = Math.ceil(filesExpanded.length / cpus);

  const s = spinner();
  s.start('Running transforms…');

  let outcomes: JobOutcome[];

  try {
    outcomes = await Promise.all(
      Array.from({ length: cpus }, (_, i) => {
        log(`Starting worker ${i + 1} of ${cpus}`);
        return runJobs({
          transformerPaths,
          options,
          jobs: filesExpanded
            .slice(i * chunkSize, (i + 1) * chunkSize)
            .map((filePath) => ({
              filePath,
            })),
        });
      }),
    );
  } finally {
    s.stop('Transforms finished.');
  }

  const finalOutcome = outcomes.reduce(
    (acc, outcome) => {
      acc.filesChanged += outcome.filesChanged;
      return acc;
    },
    { filesChanged: 0 },
  );

  console.log(`Files parsed: ${picocolors.bold(filesExpanded.length)}`);
  if (options.dry) {
    console.log(
      picocolors.yellow(
        `${picocolors.bold(finalOutcome.filesChanged)} files found that would be changed.`,
      ),
    );
  } else {
    console.log(
      picocolors.yellowBright(
        `Unchanged files: ${picocolors.bold(filesExpanded.length - finalOutcome.filesChanged)}`,
      ),
    );
    console.log(
      picocolors.greenBright(
        `Changed files: ${picocolors.bold(finalOutcome.filesChanged)}`,
      ),
    );
  }

  if (showClackOutro) {
    outro('Done.');
  }

  process.exit(0);
};

const getAllFiles = (directory: string) =>
  glob(join(directory, '**/*.?(c|m){js,ts}?(x)'), {
    ignore: ['**/node_modules', '**/dist'],
    expandDirectories: false,
    absolute: true,
  });

type JobOutcome = {
  filesChanged: number;
};

const runJobs = (jobs: JobWorkerData): Promise<JobOutcome> => {
  const workerPath = import.meta.resolve('@sku-lib/codemod/transform/worker');
  const worker = new Worker(new URL(workerPath), {
    workerData: jobs,
  });

  return new Promise((r, reject) => {
    worker.on('error', reject);

    let jobOutcome: JobOutcome = {
      filesChanged: 0,
    };

    worker.on('message', (message) => {
      if (message.type === 'FINISHED') {
        jobOutcome = message.data;
      }
    });

    worker.on('exit', (code) => {
      if (code === 0) {
        r(jobOutcome);
      } else {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};
