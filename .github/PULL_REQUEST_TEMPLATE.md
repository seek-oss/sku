ARE YOU PLANNING TO CHANGE THE PUBLIC API? If so, please make sure you've first gone through the RFC approval process by opening a new issue and using the provided template.

IMPORTANT
=========

Please ensure that, when eventually merging this PR to master, you copy the completed "Commit Message For Review" section below into your final commit body. This allows us to review our release notes, validating that they're clear enough for consumers to follow.

Don't forget that what's written here forms the upgrade guide for consumers, and upgrading can easily become a long and arduous process. To counter this, please be as descriptive as possible, explaining the reasoning behind the change, and showing a clear usage example or migration guide where appropriate. Since there are many different consumers, changes should be documented from the perspective of this project, so avoid making specific reference to the application you're working on.


Major release template
======================


## Commit Message For Review

BREAKING CHANGE:

{{ Description of breaking API change }}

RFC URL:

{{ URL of associated RFC }}

REASON FOR CHANGE:

{{ Reason for change }}

MIGRATION GUIDE:

Before:

```js
{{ Old code }}
```

After:

```js
{{ New code }}
```


Minor release template
======================


## Commit Message For Review

{{ Optional description of change }}

RFC URL:

{{ URL of associated RFC }}

REASON FOR CHANGE:

{{ Reason for change }}

EXAMPLE USAGE:

```js
{{ Code }}
```


Patch release template
======================


## Commit Message For Review

{{ Optional description of change }}

REASON FOR CHANGE:

{{ Reason for change }}


Non-release template
====================


## Commit Message For Review

{{ Optional description of change }}
