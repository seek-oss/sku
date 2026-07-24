# Proposal: tsconfig-project-references

## Why

Typechecking recompiles every source package from scratch on every run, since the packages aren't wired together into a project reference graph. `eslint-tsconfig-references` fixed the equivalent problem for the eslint import resolver but deliberately left typechecking untouched, calling out the full migration as a separate, larger change. This proposal is that follow-up: wiring the source packages into a real TypeScript project reference graph so typechecking can skip packages that haven't changed.

## What Changes

- Wire the source packages into a TypeScript project reference graph, so the root typecheck understands how they relate to each other.
- Switch the root typecheck script to use TypeScript's incremental build mode instead of a single flat run.
- Revisit the eslint resolver setup from `eslint-tsconfig-references` if it becomes redundant once the root project has real references.

This is internal tooling only. It changes how fast and how incrementally typechecking runs, not any package's behaviour, public API, or published output.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none)

## Impact

- Affected code: tsconfig files across the repo and the typecheck script.
- No change to published build output.
- Typecheck times should drop for incremental runs; a from-scratch run isn't expected to get faster. Before and after timings will confirm that.
- Higher risk than the eslint-only change, since making packages part of a reference graph can surface typecheck errors that were previously hidden. See `design.md` for details.
