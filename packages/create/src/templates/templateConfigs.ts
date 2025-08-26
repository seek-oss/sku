export interface TemplateConfig {
  name: string;
  description: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  packageJsonExtras?: Record<string, any>;
}

const DEPENDENCIES = [
  'braid-design-system@latest',
  'react@latest',
  'react-dom@latest',
];

const DEV_DEPENDENCIES = [
  '@vanilla-extract/css',
  '@types/react',
  '@types/react-dom',
];

export const TEMPLATES = {
  webpack: {
    name: 'Webpack (Default)',
    description: 'Standard React setup with Webpack bundler',
    dependencies: DEPENDENCIES,
    devDependencies: DEV_DEPENDENCIES,
    scripts: {
      start: 'sku start',
      test: 'sku test',
      build: 'sku build',
      serve: 'sku serve',
      lint: 'sku lint',
      format: 'sku format',
    },
  },
  vite: {
    name: 'Vite (Experimental)',
    description: 'Modern React setup with Vite bundler (experimental)',
    dependencies: DEPENDENCIES,
    devDependencies: DEV_DEPENDENCIES,
    scripts: {
      start: 'sku start --experimental-bundler',
      test: 'sku test',
      build: 'sku build --experimental-bundler',
      serve: 'sku serve',
      lint: 'sku lint',
      format: 'sku format',
    },
    packageJsonExtras: {
      type: 'module',
    },
  },
} as const satisfies Record<string, TemplateConfig>;

export type TemplateKey = keyof typeof TEMPLATES;
