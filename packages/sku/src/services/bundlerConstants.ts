import type { Config as SvgoConfig } from 'svgo';

export const assetsInlineLimitBytes = 10000;

export const svgoConfig: SvgoConfig = {
  plugins: [
    'preset-default',
    // @ts-expect-error - this inbuilt plugin is being treated as if it's a custom plugin for some reason
    // https://svgo.dev/docs/plugins/addAttributesToSVGElement/
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [{ focusable: false }],
      },
    },
  ],
};
