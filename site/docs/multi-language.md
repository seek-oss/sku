# Multi-language applications

(via [Vocab](https://github.com/seek-oss/vocab))

If your application supports multiple languages you can designate those languages with the `languages` configuration.

Languages can be either a string, e.g. `en`, or an object that designates a parent language.

**E.g.** `{name: "en-AU", extends: "en"}`

> [!NOTE]
> sku assumes that the development language is `en`. sku uses this as the base language for all development, including your initial translations.

## Getting started

To enable multi-language builds, follow three steps:

1. Install `@vocab/react` as a dependency.
   Your code uses this package to load the correct language translations dynamically inside React components.
2. Add the list of supported `languages` to your [sku configuration](./configuration.md#languages)

```ts
export default {
  languages: ['en', 'fr'],
} satisfies SkuConfig;
```

3. Create your first .vocab folder. See [Usage](#usage).

## Usage

To create your first translation, create a folder ending in `.vocab`.
Add a file in it called `translations.json`.
This folder can be anywhere in your source code.

**E.g.** `./App.vocab/translations.json`

In the file, add translations in the form of `translationKey: { message: "The english translation" }`.

> [!TIP]
> You can use any key that you like. We recommend a copy, or a simplified version, of the English translation.

Once created, when you run `yarn start` or `yarn build`, sku creates the files that let you import the translations into your code.

**E.g.** `./App.vocab/index.ts`

> [!TIP]
> You can add translations files anywhere in your source code. We recommend co-locating components with their translations. When you want to re-use a translation in multiple places you can move the `translations.json` as needed.

Now with the appropriate files created you can start importing your translations.

```tsx
import translations from './App.vocab';
import { useTranslations } from '@vocab/react';

export function MyComponent() {
  const { t } = useTranslations(translations);
  return <div>{t('my key')}</div>;
}
```

See the [Vocab documentation](https://github.com/seek-oss/vocab) for the full syntax.

## Complex messages

Sometimes a translation needs a dynamic value, or custom formatting, in the middle of the message.

Use the [ICU Message syntax](https://formatjs.io/docs/core-concepts/icu-syntax/).

## Site specific languages

If one of your sites only supports a subset of languages you can specify them in the site config.

**Example:** Setting an english only site.

```ts
export default {
  languages: ['en', 'fr'],
  sites: [
    {
      name: 'multi-language-site',
      host: 'my.site',
      routes: ['/$language/'],
    },
    {
      name: 'english-only-site',
      host: 'en.my.site',
      routes: ['/'],
      languages: ['en'],
    },
  ],
} satisfies SkuConfig;
```

> [!NOTE]
> Any language specified by a site must be included in the top level `languages` field.

## Route specific languages

Like a site, a route can also limit the languages it uses.

**Example:** Language specific URL

```ts
export default {
  languages: ['en', 'fr'],
  routes: [
    { route: '/hello', languages: ['en'] },
    { route: '/bonjour', languages: ['fr'] },
  ],
} satisfies SkuConfig;
```

> [!NOTE]
> Any language specified by a route must be included in the top level `languages` field.

## Hierarchy

In general, you will want to create a full set of translations for every supported language.
Some languages may only need small changes to a base language.

For example, you may only need to translate a few strings with different spelling, such as `color` to `colour` between 'en-US' and 'en-AU'.

In this case you can have one language extend another.
sku then copies any missing translations from the base language to the more specific language.

> [!TIP]
> Avoid using a language extension where you do not want to risk sending the wrong translation to production. sku has no way to validate whether you missed a translation on purpose or by mistake.

## Custom locale

When formatting ICU messages, Vocab formats values such as dates and numbers according to the current language.
In general, the language should match the locale that you want to use to format messages.
Where it does not, you can set the locale separately in `<VocabProvider>`.

**E.g.** Using `en-AU` as the locale but only using one central `en` language.

```jsx
<VocabProvider language="en" locale="en-AU">
  <App />
</VocabProvider>
```

## Translation Platforms

sku supports specific features from 3rd-party translation platforms.
Currently the only translations platform supported by sku is [Phrase](https://phrase.com/).

## Phrase-specific Features

### Translation Syncing

You can use sku to synchronize your translations to and from Phrase.

Phrase syncing requires two environment variables: `PHRASE_PROJECT_ID` and `PHRASE_API_TOKEN`.

`PHRASE_PROJECT_ID` must be set to your project's ID.
You can find it in your project's settings under the "API" section.

`PHRASE_API_TOKEN` must be set to an access token.
You can create one on the profile settings page.

Push or pull translations with Phrase:

::: code-group

```sh [push]
$ sku translations push
```

```sh [pull]
$ sku translations pull
```

:::

### Automatic Translation

Phrase can automatically translate content using machine-learning.

You can configure this in your Phrase project.
Phrase may not automatically translate keys uploaded by the API.

To instruct Phrase to translate keys use `--auto-translate`.

```sh
$ sku translations push --auto-translate
```

### Delete Unused Keys

When uploading translations, Phrase identifies keys that exist in the Phrase project, but were not referenced in the upload.
These keys can be deleted from Phrase by providing the `--delete-unused-keys` flag to `sku translations push`. E.g.

```sh
$ sku translations push --delete-unused-keys
```

### Tags

The Phrase platform lets you attach tags to translation keys.

sku pushes any tags present in your `translations.json` file to Phrase when you use the `sku translations push` command.

See the [Vocab documentation](https://github.com/seek-oss/vocab#Tags) for how to add tags to your translations.

## Pseudo-localization

When an app configures `languages`, sku generates the `en-PSEUDO` language automatically.

`en-PSEUDO` is a generated language created by pseudo-localizing existing `en` translation messages in your app.

See [the Vocab docs](https://github.com/seek-oss/vocab#pseudo-localization) for the pseudo-localization process.
That page also covers possible use cases for this language.

`en-PSEUDO` can be consumed just like any other language in your app:

```jsx
<VocabProvider language="en-PSEUDO">
  <App />
</VocabProvider>
```
