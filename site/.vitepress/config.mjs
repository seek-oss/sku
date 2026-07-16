import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'sku',
  description:
    'Front-end development toolkit, powered by Webpack, Babel, Vanilla Extract and Jest',
  base: '/sku/',
  cleanUrls: true,
  appearance: false,
  vite: {
    // esbuild 0.28+ cannot downlevel destructuring for VitePress's default
    // browser targets (e.g. safari14); raise the floor for the docs site only.
    esbuild: {
      target: 'es2022',
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2022',
      },
    },
    build: {
      target: 'es2022',
    },
  },
  head: [
    ['link', { rel: 'icon', href: '/sku/favicon.ico' }],
    ['script', { src: '/sku/docsify-redirect.js' }],
  ],
  themeConfig: {
    logo: '/logo/logo.png',
    siteTitle: false,
    socialLinks: [{ icon: 'github', link: 'https://github.com/seek-oss/sku' }],
    search: {
      provider: 'local',
    },
    sidebar: {
      '/': [
        {
          text: 'Guides',
          items: [
            { text: 'Getting started', link: '/docs/getting-started' },
            { text: 'Configuration', link: '/docs/configuration' },
            { text: 'CLI', link: '/docs/cli' },
            { text: 'API', link: '/docs/api' },
            { text: 'FAQ', link: '/docs/faq' },
            { text: 'Debugging', link: '/docs/debugging' },
          ],
        },
        {
          text: 'Migration guides',
          items: [
            { text: 'Static Webpack → Vite', link: '/docs/vite' },
            { text: 'Jest → Vitest', link: '/docs/vitest' },
          ],
        },
        {
          text: 'Project types',
          items: [
            { text: 'Static rendering', link: '/docs/static-rendering' },
            { text: 'Server rendering', link: '/docs/server-rendering' },
            { text: 'Libraries', link: '/docs/libraries' },
            { text: 'Custom builds', link: '/docs/custom-builds' },
          ],
        },
        {
          text: 'Development',
          items: [
            { text: 'Building the app', link: '/docs/building-the-app' },
            { text: 'Compilation', link: '/docs/compilation' },
            { text: 'Styling', link: '/docs/styling' },
            { text: 'Code splitting', link: '/docs/code-splitting' },
            { text: 'Multi-site (Theming)', link: '/docs/multi-site' },
            { text: 'Content Security Policy', link: '/docs/csp' },
            { text: 'Multiple languages', link: '/docs/multi-language' },
            { text: 'Extra features', link: '/docs/extra-features' },
          ],
        },
        {
          text: 'Design',
          items: [{ text: 'Storybook', link: '/docs/storybook' }],
        },
        {
          text: 'Quality',
          items: [
            { text: 'Testing', link: '/docs/testing' },
            { text: 'Linting/formatting', link: '/docs/linting' },
          ],
        },
      ],
    },
  },
});
