import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'sku',
  description:
    'Front-end development toolkit, powered by Webpack, Babel, Vanilla Extract and Jest',
  base: '/sku/',
  srcDir: 'docs',
  cleanUrls: true,
  appearance: false,
  vite: {
    // Vite root is srcDir (`docs/`); keep serving assets from site/public.
    publicDir: '../public',
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
    ['script', { src: '/sku/redirects.js' }],
  ],
  themeConfig: {
    logo: '/logo/logo.png',
    siteTitle: false,
    socialLinks: [{ icon: 'github', link: 'https://github.com/seek-oss/sku' }],
    search: {
      provider: 'local',
      options: {
        // Enable Detailed View by default
        detailedView: true,
      },
    },
    outline: [2, 3],
    sidebar: {
      '/': [
        {
          text: 'Essentials',
          items: [
            { text: 'Getting started', link: '/getting-started' },
            { text: 'Configuration', link: '/configuration' },
            { text: 'CLI', link: '/cli' },
            { text: 'API', link: '/api' },
            { text: 'Support', link: '/support' },
            { text: 'Debugging', link: '/debugging' },
          ],
        },

        {
          text: 'Server rendering',
          collapsed: true,
          items: [
            { text: 'Getting started', link: '/ssr/' },
            { text: 'Request entries', link: '/ssr/entries' },
            { text: 'Routing', link: '/ssr/routing' },
            { text: 'App Wrapper / Providers', link: '/ssr/providers' },
            { text: 'Data loading', link: '/ssr/data-loading' },
            {
              text: 'Multi-language / Localisation',
              link: '/ssr/multi-language',
            },
            { text: 'Error pages', link: '/ssr/error-pages' },
            { text: 'Middleware', link: '/ssr/middleware' },
            { text: 'Content Security Policy', link: '/ssr/csp' },
            {
              text: 'Deploy to production',
              link: '/ssr/deploy-to-production',
            },
            { text: 'Webpack SSR', link: '/ssr/webpack-ssr' },
            { text: 'Troubleshooting', link: '/ssr/troubleshooting' },
            {
              text: 'Migrate from Static App',
              link: '/ssr/migrate-from-static-app',
            },
            {
              text: 'Migrate from Webpack SSR',
              link: '/ssr/migrate-from-webpack-ssr',
            },
          ],
        },
        {
          text: 'Other project types',
          collapsed: false,
          items: [
            { text: 'Static rendering', link: '/static-rendering' },
            { text: 'Libraries', link: '/libraries' },
            { text: 'Custom builds', link: '/custom-builds' },
          ],
        },
        {
          text: 'Development',
          items: [
            { text: 'Building the app', link: '/building-the-app' },
            { text: 'Compilation', link: '/compilation' },
            { text: 'Styling', link: '/styling' },
            { text: 'Code splitting', link: '/code-splitting' },
            { text: 'Multi-site (Theming)', link: '/multi-site' },
            { text: 'Content Security Policy', link: '/csp' },
            { text: 'Multiple languages', link: '/multi-language' },
            { text: 'Extra features', link: '/extra-features' },
          ],
        },
        {
          text: 'Design',
          items: [{ text: 'Storybook', link: '/storybook' }],
        },
        {
          text: 'Quality',
          items: [
            { text: 'Testing', link: '/testing' },
            { text: 'Linting/formatting', link: '/linting' },
          ],
        },
        {
          text: 'Migration guides',
          items: [
            { text: 'Static Webpack → Vite', link: '/vite' },
            { text: 'Jest → Vitest', link: '/vitest' },
            {
              text: 'Previous sku versions',
              link: '/previous-sku-versions',
            },
          ],
        },
      ],
    },
  },
});
