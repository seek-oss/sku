import { workerData, parentPort } from 'node:worker_threads';
import { readFile, writeFile } from 'node:fs/promises';
import { createTwoFilesPatch } from 'diff';
import picocolors from 'picocolors';

const { transformerPath, jobs, options } = workerData;

const fileTransformer = (await import(transformerPath)).transform;

let filesChanged = 0;

await Promise.all(
  jobs.map(async ({ filePath }: { filePath: string }) => {
    const source = await readFile(filePath, 'utf-8');
    const output = fileTransformer(source);

    if (!output) {
      return;
    }

    filesChanged++;

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
    }
  }),
);

parentPort?.postMessage({
  type: 'FINISHED',
  data: {
    filesChanged,
  },
});
