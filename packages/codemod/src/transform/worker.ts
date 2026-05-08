import { workerData, parentPort } from 'node:worker_threads';
import { readFile, writeFile } from 'node:fs/promises';
import { createTwoFilesPatch } from 'diff';
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
      parentPort?.postMessage({
        type: 'PROGRESS',
        data: { filePath, changed: false },
      });
      return;
    }

    const showDiff = options.print === true || options.dry === true;
    if (showDiff) {
      const diff = createTwoFilesPatch(
        'source',
        'output',
        source,
        current,
        undefined,
        undefined,
        { context: 3 },
      ).trim();
      parentPort?.postMessage({
        type: 'DIFF',
        data: { filePath, diff },
      });
    }

    if (!options.dry) {
      await writeFile(filePath, current);
    }

    filesChanged++;
    parentPort?.postMessage({
      type: 'PROGRESS',
      data: { filePath, changed: true },
    });
  }),
);

parentPort?.postMessage({
  type: 'FINISHED',
  data: {
    filesChanged,
  },
});
