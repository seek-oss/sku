---
'sku': minor
---

Add auto-translate feature for translations push command

Adds a new `--auto-translate` flag to the `sku translations push` command that enables automatic translation for missing translations in the Phrase platform. When enabled, this flag instructs Phrase to automatically translate any missing keys using machine translation.

```sh
$ sku translations push --auto-translate
```