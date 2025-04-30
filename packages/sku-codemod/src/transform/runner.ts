import { globbySync } from 'globby';
import prompts from 'prompts';
import { dirname, join, resolve } from 'node:path';
import { CODEMODS } from '../utils/constants.js';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import os from 'node:os';
import picocolors from 'picocolors';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const transformerDirectory = join(__dirname, '../', 'codemods');

type Options = {
  dry?: boolean;
  print?: boolean;
};

type JobWorkerData = {
  transformerPath: string;
  options: Options;
  jobs: Array<{
    filePath: string;
  }>;
};

export const runTransform = async (
  transform: string,
  path: string,
  options: Options,
): Promise<void> => {
  let transformer = transform;
  console.log('path', path);
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

  const filesExpanded = await getAllFiles([directory]);

  if (!filesExpanded.length) {
    console.log(`No files found matching "${directory}"`);
    return;
  }

  const transformerPath = join(
    transformerDirectory,
    `${transformer}/${transformer}.js`,
  );

  const cpus =
    os.cpus().length > filesExpanded.length
      ? filesExpanded.length
      : os.cpus().length;
  const chunkSize = Math.ceil(filesExpanded.length / cpus);

  const outcomes: JobOutcome[] = await Promise.all(
    Array.from({ length: cpus }, (_, i) => {
      console.log(picocolors.gray(`Starting worker ${i + 1} of ${cpus}`));
      return runJobs({
        transformerPath,
        options,
        jobs: filesExpanded
          .slice(i * chunkSize, (i + 1) * chunkSize)
          .map((filePath) => ({
            filePath,
          })),
      });
    }),
  );

  const finalOutcome = outcomes.reduce(
    (acc, outcome) => {
      acc.filesChanged += outcome.filesChanged;
      return acc;
    },
    { filesChanged: 0 },
  );

  console.log(
    `Total number of files parsed: ${picocolors.bold(filesExpanded.length)}`,
  );
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

  process.exit(0);
};

const getAllFiles = async (paths: string[]) => {
  const list = await Promise.all(
    paths.map(
      (file) =>
        new Promise<string[]>((r) => {
          const files = globbySync([file, '!node_modules', '!dist'], {
            absolute: true,
          });
          r(files);
        }),
    ),
  );

  return list.flat();
};

type JobOutcome = {
  filesChanged: number;
};

const runJobs = (jobs: JobWorkerData): Promise<JobOutcome> => {
  const worker = new Worker(resolve(__dirname, './worker.js'), {
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
