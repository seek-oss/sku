# Contributing to sku

⚠️ 🌏 👀 First and foremost, remember that this repo is **open source**.

Don't post anything or commit any code that isn't ready for the entire world to see. Avoid making specific reference to internal processes or features under development. While a lot of this information is probably harmless, it's better to be safe than sorry.

If you work at SEEK and run into issues along the way, or even if you find some of these steps confusing or intimidating, please reach out to your friendly neighbourhood developer in the sku development Slack channel. We'll be super excited to help out!

## Setup

First, install [Node.js v8+](https://nodejs.org/).

After cloning the project, install the dependencies:

```bash
$ npm install
```

## Before Starting

If you're planning to change the public API, please [open a new issue](https://github.com/seek-oss/sku/issues/new) and follow the provided RFC template. If you think it's a more straightforward API change and doesn't require a formal RFC, feel free to raise it in Slack first to see what others think.

## Workflow

Before starting your work, first ensure you're in the `master` branch and that you've pulled down the latest changes:

```bash
$ git checkout master
$ git pull
```

Next, create a new branch for your work, with an appropriate name for your change:

```bash
$ git checkout -b add-my-cool-new-feature
```

To run the test suite locally:

```bash
$ npm test
```

Note that the test suite needs to pass for your changes to be accepted, so it's worth running this locally during development and before committing.

Once you've made the desired changes and you're ready to commit, stage your local changes, being careful to exclude irrelevant changes.

## Semantic Release

Before committing, consider the scope of your changes according to [semantic versioning](http://semver.org), noting whether this is a breaking change, a feature release or a patch.

New versions are published automatically from [Travis CI](https://travis-ci.org) using [semantic-release](https://github.com/semantic-release/semantic-release). In order to automatically increment version numbers correctly, commit messages must follow our [semantic commit message convention](https://github.com/seek-oss/commitlint-config-seek). If your commit includes a breaking change, be sure to prefix your commit body with `BREAKING CHANGE:`. To make this process easier, we have a commit script (powered by [commitizen](https://github.com/commitizen/cz-cli)) to help guide you through the commit process:

```bash
$ npm run commit
```

Once you've committed your work, push your changes to an upstream branch of the same name, and create a new pull request from your branch. You'll be presented with a pull request template, which provides separate outlines for major, minor, patch and non-release branches. Please follow this guide carefully, but raise any questions and concerns along the way if anything is unclear.

In order for your pull request to be accepted, the [Travis CI](https://travis-ci.org) build needs to pass, and another contributor needs to approve your work. It's likely that you might need to make some changes for your work to be accepted, but don't take this personally! Ultimately, the aim is to make it feel like the codebase was written by a single person, but this takes a lot of work and constant review of each others' work.

### Merging

Once your work is approved and ready to go, follow these steps:

1. Hit the merge button
2. Ensure the commit message matches the title of the PR (it may have been edited!)
3. Copy and paste the text under **"Commit Message For Review"** into the commit body (again, it may have been edited!)

Finally, take a deep breath, hit the green "confirm" button, and we have liftoff—your work should be automatically deployed!

🎨📦🚀
