## Context

The root layout renders `<html>`.
React Router replaces that route’s `Component` when `ErrorBoundary` or `errorElement` is on the same route.
The create template already nests the page boundary on a child.

## Decisions

Document two placements:

1. Child under `RootLayout` for page failures and failures after the document shell is on the wire.
2. Optional html-route `ErrorBoundary` that renders a full `<html>` document, for failures before sku pipes the shell.

The template stays child-only.
A body-only html-route fallback is still a mistake.
Docs state that.

## Risks / Trade-offs

- [Body-only html-route fallback] → Shell failure HTML has no `<html>`. Docs warn.
- [Html-route boundary after the shell is sent] → The head is already on the wire. A child boundary keeps the shell in the React tree. An html-route boundary would replace it on the client if it catches.
