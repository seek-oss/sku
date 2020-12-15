# Multi-language applications

(via [Vocab](https://github.com/seek-oss/vocab))

If your application supports in multiple languages you can designate those languages with the `languages` configuration.

Languages can be either a string, e.g. `en` or an object that designates a parent language. E.g `{name: "en-AU", extends: "en"}`

**Note:** sku assumes that the development language is `en`. This will be used as the base language for all development, including your initial translations.

## Usage

To create your first translation you need to create a file ending in `translations.json` anywhere in your source code.

In the file you want to add an array of translations in the form of `translationKey: {message: "The english translation"}`

**Recommendation:** Whilst you can use any key that you like we recommended to use a copy, or simplied version of the english translation.

Once created, when `yarn start` or `yarn build` is ran sku will create the appropriate files to allow you to import the translations into you code.

**Recommendation:** You can add `translation.json` files anywhere in your source code. We recommend co-locating components with their translations. When you want to re-use a translation in multiple places you can move the `translation.json` as needed.

Now with the appropriate files created you can start importing your translations.

```tsx
import translations from './translations.json';
import { useTranslation } from '@vocab/react';

export function MyComponent() {
  const { t } = useTranslation(translations);
  return <div>t('my key')</div>;
}
```

See the [Vocab documentation](https://github.com/seek-oss/vocab) for more the full syntax.

## Complex messages

Sometimes when translating a dynamic value, or custom formatting might want to be applied in the middle of a translation.

This is done using the [ICU Message syntax](https://formatjs.io/docs/core-concepts/icu-syntax/).

## Hierarchy

In general you'll want to create a full set of translations for every supported language. However, some languages may only require small tweeks to a base language.

For example, only needing to translate a few strings with different spelling such as `color` to `colour` between 'en-US' and 'en-AU'.

In this case you can have one language extend another. sku will then copy any missing translations from the base language to the more specific language.

**Recommendation:** Avoid using a language extension where you don't want to risk sending the wrong translation to production. sku has no way to validate whether you intentionally missed a translation or simply made a mistake.
