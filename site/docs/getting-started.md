# Getting Started

sku is a front-end toolkit for SEEK apps. It provides builds, local development, testing, and linting that follow SEEK practice.

To start, choose a project type:

<div class="project-types" role="group" aria-label="sku project types">
  <a class="project-types__cell " href="./static-rendering">
    <span class="project-types__name"><span class="project-types__status project-types__status--stable">Stable</span> Static</span>
    <span class="project-types__meta">Build-time HTML. Uses Vite</span>
  </a>
  <a class="project-types__cell" href="./ssr/">
    <span class="project-types__name"><span class="project-types__status project-types__status--experimental">Experimental</span> Managed Data Mode SSR</span>
    <span class="project-types__meta">Request-time HTML. Uses Vite</span>
  </a>
  <a class="project-types__cell" href="./static-rendering">
    <span class="project-types__name"><span class="project-types__status project-types__status--deprecated">Deprecated</span> Webpack Static</span>
    <span class="project-types__meta">Classic sku</span>
  </a>
  <a class="project-types__cell" href="./ssr/webpack-ssr">
    <span class="project-types__name"><span class="project-types__status project-types__status--stable">Stable</span> Webpack SSR</span>
    <span class="project-types__meta">Low-level SSR</span>
  </a>
</div>

:::warning 👋 Goodbye Webpack
We will **stop supporting Webpack**. sku will **remove** Webpack and Webpack SSR project types **when Vite-based solutions have full support**.
:::

## What sku does

sku configures a local development environment. It includes a fast development server, [linting](./linting) and [testing](./testing.md) frameworks, and a production build.

It also integrates [styling](./styling.md) with [Vanilla Extract CSS](https://vanilla-extract.style/) and [localisation](./multi-language.md) with [Vocab](https://github.com/seek-oss/vocab).

## What sku doesn't do

sku builds a production bundle. After that, you host static assets or you serve Node.js code with common practices.

See the instructions for your project type to deploy the app.

## Static vs Server-Side Rendering (SSR)

When you start a new sku project, you choose how the site is rendered and served: **Static Rendering** or **Server-Side Rendering (SSR)**. Each method fits different app needs.

### Static Rendering

- **Fast and Simple**: sku generates HTML, CSS, and JS at build time. A CDN or server then serves those files.
- **Low Maintenance**: You do not need a custom server. You can deploy anywhere that supports static files.
- **Modern Features**: The app can use client-side routing, code splitting, and dynamic imports.

### Server-Side Rendering (SSR)

- **Personalized Initial Loads**: The server can generate each page request per user. This fits personalisation, authenticated content, or A/B testing.
- **SEO and Performance**: The server renders content for each request. This can improve SEO and first-contentful paint, especially for dynamic pages.
- **Advanced Use Cases**: The server can run computation, API calls, or user-specific data at page load.

Choose the rendering method that fits the app. sku applies its standard configuration for either method.

## Creating a new project

::: code-group

```sh [New directory]
$ pnpm dlx @sku-lib/create my-app --template=vite
$ cd my-app
$ pnpm start
```

```sh [Current directory]
$ pnpm dlx @sku-lib/create . --template=vite
$ pnpm start
```

:::

By default, a new project installs dependencies with the package manager that you used to run the command.
