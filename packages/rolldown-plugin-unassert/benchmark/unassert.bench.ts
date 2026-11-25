import { unassert } from '@sku-lib/rolldown-plugin-unassert';
import { inject, test } from 'vitest';
import { assertStripped, buildProject } from './build.ts';

const project = inject('generatedProject');

const runOptions = {
  iterations: Number(process.env.BENCH_ITERATIONS ?? 5),
  time: 0,
  warmupIterations: 1,
  warmupTime: 0,
};

test(`vite build of ${project.fileCount} generated modules`, async ({
  bench,
}) => {
  await bench.compare(
    bench('@sku-lib/rolldown-plugin-unassert (oxc, raw transfer)', async () => {
      assertStripped(await buildProject(project, [unassert()]));
    }),
    bench(
      '@sku-lib/rolldown-plugin-unassert (oxc, no raw transfer)',
      async () => {
        assertStripped(
          await buildProject(project, [unassert({ rawTransfer: false })]),
        );
      },
    ),
    bench('baseline: no unassert plugin', async () => {
      await buildProject(project, []);
    }),
    runOptions,
  );
});
