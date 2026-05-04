import {
  isCancel,
  multiselect,
  path as pathPrompt,
  select,
} from '@clack/prompts';
import {
  CODEMODS,
  JEST_TO_VITEST_STEP_SLUGS,
  type CodemodName,
} from '../utils/constants.js';

const JEST_IMPORTS_SLUG = 'jest-to-vitest-imports' satisfies CodemodName;

const codemodMeta = (slug: CodemodName) =>
  CODEMODS.find((c) => c.value === slug)?.description ?? slug;

/** Slugs shown at the top-level interactive prompt (no granular jest-* substeps). */
export function getInteractiveRootCodemodSlugs(): CodemodName[] {
  return CODEMODS.filter(
    (c) =>
      c.value === 'jest-to-vitest' || !c.value.startsWith('jest-to-vitest-'),
  ).map((c) => c.value);
}

const interactiveRootSelectOptions = () =>
  getInteractiveRootCodemodSlugs().map((value) => ({
    value,
    label: value,
    hint: codemodMeta(value),
  }));

export const resolveCodemodModule = (slug: CodemodName): string =>
  import.meta.resolve(`@sku-lib/codemod/codemods/${slug}`);

/** Canonical-order module URLs for granular jest-to-vitest steps; appends imports when needed. */
export const transformerPathsForJestSubsteps = (
  selectedSlugs: readonly CodemodName[],
): string[] => {
  const selected = new Set(selectedSlugs);
  let ordered = JEST_TO_VITEST_STEP_SLUGS.filter((s) => selected.has(s));

  const needsImports =
    [...selected].some((s) => s !== JEST_IMPORTS_SLUG) &&
    !selected.has(JEST_IMPORTS_SLUG);

  if (needsImports) {
    ordered = [...ordered, JEST_IMPORTS_SLUG];
  }

  return ordered.map((slug) => resolveCodemodModule(slug));
};

export const exitCancel = (): never => {
  process.exit(1);
};

/** Clack prompts return `string | symbol`; cancel uses a symbol sentinel. */
function assertClackSubmittedString(
  value: string | symbol,
): asserts value is string {
  if (typeof value !== 'string') {
    exitCancel();
  }
}

export async function chooseInteractiveTransformerPaths(): Promise<string[]> {
  const rootChoice = (await select({
    message: 'Which transform would you like to apply?',
    options: interactiveRootSelectOptions(),
  })) as CodemodName;

  if (isCancel(rootChoice)) {
    exitCancel();
  }

  if (rootChoice !== 'jest-to-vitest') {
    return [resolveCodemodModule(rootChoice)];
  }

  const pipelineMode = await select({
    message: 'Jest → Vitest migration',
    options: [
      {
        value: 'full' as const,
        label: 'Run full pipeline',
        hint: 'All steps in order (recommended)',
      },
      {
        value: 'steps' as const,
        label: 'Choose specific steps',
        hint: 'Pick substeps; import synthesis runs last when needed',
      },
    ],
    initialValue: 'full',
  });

  if (isCancel(pipelineMode)) {
    exitCancel();
  }

  if (pipelineMode === 'full') {
    return [resolveCodemodModule('jest-to-vitest')];
  }

  const picked = (await multiselect({
    message: 'Select steps (runs in canonical order, not selection order)',
    options: JEST_TO_VITEST_STEP_SLUGS.map((slug) => ({
      value: slug,
      label: slug,
      hint: codemodMeta(slug),
    })),
    required: true,
  })) as CodemodName[];

  if (isCancel(picked)) {
    exitCancel();
  }

  return transformerPathsForJestSubsteps(picked);
}

export async function getTargetDirectoryFromPrompt(): Promise<string> {
  const pathResult = await pathPrompt({
    message: 'Which directory should the codemods run on?',
    directory: true,
    root: process.cwd(),
    initialValue: '.',
  });

  assertClackSubmittedString(pathResult);
  return pathResult;
}
