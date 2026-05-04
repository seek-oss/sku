import { workerData, parentPort } from 'node:worker_threads';
import { readFile, writeFile } from 'node:fs/promises';
import { createTwoFilesPatch } from 'diff';
import picocolors from 'picocolors';
import type { JobWorkerData } from './runner.js';
import type { Transform } from '../utils/types.js';

const { transformerPaths, jobs, options } = workerData as JobWorkerData;

const transforms = await Promise.all(
  transformerPaths.map(async (transformerPath) => {
    const { transform } = (await import(transformerPath)) as {
      transform: Transform;
    };
    return transform;
  }),
);

let filesChanged = 0;

await Promise.all(
  jobs.map(async ({ filePath }: { filePath: string }) => {
    const source = await readFile(filePath, 'utf-8');
    let current = source;

    for (const transform of transforms) {
      const next = await transform(current);
      if (next !== null) {
        current = next;
      }
    }

    if (current === source) {
      return;
    }

    if (options.print) {
      const diff = createTwoFilesPatch(
        'source',
        'output',
        source,
        current,
        undefined,
        undefined,
        { context: 3 },
      ).trim();
      console.log(
        `${picocolors.bold('[TRANSFORM FILE]')}: ${filePath} \n${picocolors.bold('[DIFF]')}:\n${diff}\n`,
      );
    }

    if (!options.dry) {
      await writeFile(filePath, current);
    }

    filesChanged++;
  }),
);

parentPort?.postMessage({
  type: 'FINISHED',
  data: {
    filesChanged,
  },
});
