# Getting Started

sku is a front-end toolkit for SEEK apps: best-practice builds, local development, testing, and linting.

To get started, choose a project type:

<div class="project-types" role="group" aria-label="sku project types">
  <a class="project-types__cell " href="./static-rendering">
    <span class="project-types__name">Static</span>
    <span class="project-types__meta">Fast, Simple, Modern. Built on Vite</span>
  </a>
  <a class="project-types__cell project-types__cell--tip" href="./ssr/">
    <span class="project-types__name">SSR</span>
    <span class="project-types__meta">Personalised, Powerful. Built on Vite</span>
  </a>
  <a class="project-types__cell project-types__cell--info" href="./static-rendering">
    <span class="project-types__name">Webpack Static</span>
    <span class="project-types__meta">Classic sku</span>
  </a>
  <a class="project-types__cell project-types__cell--info" href="./ssr/webpack-ssr">
    <span class="project-types__name">Webpack SSR</span>
    <span class="project-types__meta">Low-level SSR</span>
  </a>
</div>

:::warning Webpack
We are **migrating away from Webpack**. Support for Webpack and Webpack SSR project types will be **removed in a future sku major version**.
:::

## What sku does

sku sets up your local development environment with a fast dev server, out-of-the-box [linting](./linting) and [testing](./testing.md) frameworks, and an optimised production build process.

It integrates [styling](./styling.md) with [Vanilla Extract CSS](https://vanilla-extract.style/) and [localisation](./multi-language.md) with [Vocab](https://github.com/seek-oss/vocab).

## What sku doesn't do

sku's scope covers building an optimised productionised bundle. After this you'll use common practices for hosting static assets or serving Node JS code.

See project type specific instructions on how to deploy your app.

## Static vs Server-Side Rendering (SSR)

When starting a new project with sku, you have two main approaches for how your site is rendered and served: **Static Rendering** and **Server-Side Rendering (SSR)**. Each offers unique strengths to fit different app requirements.

### Static Rendering

- **Fast and Simple**: Generates your site at build time into static HTML/CSS/JS, then serves those files directly from a CDN or server.
- **Low Maintenance**: No custom server required — deploy anywhere static files are supported.
- **Modern Features**: Supports client-side routing, code splitting, and dynamic imports for a full-featured app experience.

### Server-Side Rendering (SSR)

- **Personalized Initial Loads**: Each page request can be dynamically generated per user — ideal for personalisation, authenticated content, or A/B testing.
- **SEO and Performance**: Content is rendered on the server for each request, offering improved SEO and faster first-contentful paint, especially for dynamic pages.
- **Advanced Use Cases**: Supports scenarios where on-the-fly computation, API calls, or user-specific data are needed at the moment of page load.

Choose the rendering strategy that best fits your app’s needs. sku's best-practice setup ensures you get best practices for either approach out-of-the-box.
