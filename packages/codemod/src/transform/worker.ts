import { workerData, parentPort } from 'node:worker_threads';
import { readFile, writeFile } from 'node:fs/promises';
import { createTwoFilesPatch } from 'diff';
import picocolors from 'picocolors';
import type { JobWorkerData } from './runner.js';
import type { Transform } from '../utils/types.js';

const { transformerPath, jobs, options } = workerData as JobWorkerData;

const { transform } = (await import(transformerPath)) as {
  transform: Transform;
};

let filesChanged = 0;

await Promise.all(
  jobs.map(async ({ filePath }: { filePath: string }) => {
    const source = await readFile(filePath, 'utf-8');
    const output = transform(source);

    if (!output) {
      console.log('no output for file: ', filePath);
      return;
    }

    if (options.print) {
      const diff = createTwoFilesPatch(
        'source',
        'output',
        source,
        output,
        undefined,
        undefined,
        { ignoreNewlineAtEof: true, context: 3 },
      ).trim();
      console.log(
        `${picocolors.bold('[TRANSFORM FILE]')}: ${filePath} \n${picocolors.bold('[DIFF]')}:\n${diff}\n`,
      );
    }

    if (!options.dry) {
      await writeFile(filePath, output);
      if (source !== output) {
        filesChanged++;
      }
    }
  }),
);

parentPort?.postMessage({
  type: 'FINISHED',
  data: {
    filesChanged,
  },
});
