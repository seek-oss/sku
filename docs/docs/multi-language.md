# Multi-language applications

**WARNING:** Multi-language support is currently experimental. Expect breaking changes over the coming releases.

(via [Vocab](https://github.com/seek-oss/vocab))

If your application supports multiple languages you can designate those languages with the `languages` configuration.

Languages can be either a string, e.g. `en` or an object that designates a parent language. E.g `{name: "en-AU", extends: "en"}`

**Note:** sku assumes that the development language is `en`. This will be used as the base language for all development, including your initial translations.

## Getting started

To opt-in to Multi Language builds you need to perform three steps:

1. Install "`@vocab/react`".
   This will be used by your code to support dynamically loading the correct language translations inside React components
2. Add "`languages`" attribute to sku.config with all your supported languages

```json
{
  "languages": ["en", "fr"]
}
```

3. Create your first .vocab folder. See [Usage](#usage).

## Usage

To create your first translation you need to create a folder ending in `.vocab` and add a file in it called `translations.json`. This can be anywhere in your source code.

**E.g.** `./App.vocab/translations.json`

In the file, add translations in the form of `translationKey: { message: "The english translation" }`

**Recommendation:** Whilst you can use any key that you like we recommended to use a copy, or simplied version of the english translation.

Once created, when `yarn start` or `yarn build` is ran sku will create the appropriate files to allow you to import the translations into you code.

**E.g.** `./App.vocab/index.ts`

**Recommendation:** You can add translations files anywhere in your source code, however we recommend co-locating components with their translations. When you want to re-use a translation in multiple places you can move the `translation.json` as needed.

Now with the appropriate files created you can start importing your translations.

```tsx
import translations from './App.vocab';
import { useTranslations } from '@vocab/react';

export function MyComponent() {
  const { t } = useTranslations(translations);
  return <div>t('my key')</div>;
}
```

See the [Vocab documentation](https://github.com/seek-oss/vocab) for the full syntax.

## Complex messages

Sometimes when translating a dynamic value, or custom formatting might want to be applied in the middle of a translation.

This is done using the [ICU Message syntax](https://formatjs.io/docs/core-concepts/icu-syntax/).

## Site specific languages

If one of your sites only supports a subset of languages you can specify them in the site config.

**Example:** Setting an english only site.

```json
{
  "languages": ["en", "fr"],
  "sites": [
    {
      "name": "multi-language-site",
      "host": "my.site",
      "routes": ["/$language/"]
    },
    {
      "name": "english-only-site",
      "host": "en.my.site",
      "routes": ["/"],
      "languages": ["en"]
    }
  ]
}
```

**Note:** Any language specified by a site must be included in the top level `languages` field.

## Hierarchy

In general, you'll want to create a full set of translations for every supported language. However, some languages may only require small tweeks to a base language.

For example, only needing to translate a few strings with different spelling such as `color` to `colour` between 'en-US' and 'en-AU'.

In this case you can have one language extend another. sku will then copy any missing translations from the base language to the more specific language.

**Recommendation:** Avoid using a language extension where you don't want to risk sending the wrong translation to production. sku has no way to validate whether you intentionally missed a translation or simply made a mistake.

## Custom locale

When formatting ICU messages vocab will format values such dates and numbers according to the current language. In general, the language should match the locale that you want to use to format messages. However, where it doesn't, you can set the locale seperately in `<VocabProvider>`.

**E.g.** Using `en-AU` as the locale but only using one central `en` language.

```jsx
<VocabProvider language="en" locale="en-AU">
  <App />
</VocabProvider>
```
