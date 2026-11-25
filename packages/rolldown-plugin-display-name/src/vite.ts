/** The part of Vite's plugin context that says whether the build emits source maps. */
interface ViteTransformContext {
  environment: {
    mode: string;
    config: { build: { sourcemap: boolean | 'inline' | 'hidden' } };
  };
}

function isViteTransformContext(
  context: object,
): context is ViteTransformContext {
  return (
    'environment' in context &&
    typeof context.environment === 'object' &&
    context.environment !== null
  );
}

export function viteDiscardsSourcemaps(context: object): boolean {
  return (
    isViteTransformContext(context) &&
    context.environment.mode === 'build' &&
    context.environment.config.build.sourcemap === false
  );
}
