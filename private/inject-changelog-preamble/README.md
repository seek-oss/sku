# inject-changelog-preamble

Injects the contents of `.changeset/.PREAMBLE.md` at the beginning of the latest version in sku's changelog.
Typically used to summarise or highlight specific changes.
If `.changeset/.PREAMBLE.md` is missing then the CLI does nothing.

> [!IMPORTANT]
> The dot prefix on `.PREAMBLE.md` is intentional.
> If the file is named `PREAMBLE.md`, the `changeset` CLI will try and validate it, resulting in an error like `Error: could not parse changeset - missing or invalid frontmatter.`

Based off [a similar script in skuba] but with a bit of extra logging and ✨colours✨.

[a similar script in skuba]: https://github.com/seek-oss/skuba/blob/3134fa95252c81b016602ad93a20ba28ff1b9395/packages/changesets-changelog/src/inject.mjs

## API

The package exposes a `sku-inject-changelog` CLI that should be invoked in CI immediately after `changeset version`.
