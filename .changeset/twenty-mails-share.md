---
'sku': minor
---

deps: Jest 30

This major release includes breaking changes. See the [Jest 30](https://jestjs.io/blog/2025/06/04/jest-30) announcement for more information.

Notable changes that may affect your tests:

- **JSDOM no longer allows mocking `window.location`**: If your tests mock `window.location`, or you use the [`jest-location-mock`](https://www.npmjs.com/package/jest-location-mock) package, you may need to [patch jsdom](https://jestjs.io/blog/2025/06/04/jest-30#known-issues). It's also worth considering whether you can avoid mocking `window.location` entirely by using `react-router`'s [`MemoryRouter`](https://reactrouter.com/6.30.1/routers/picking-a-router#testing) or [`createRoutesStub`](https://reactrouter.com/start/framework/testing).
- **Updated expect aliases**: Expect aliases have been removed which may affect your test assertions. Please run `skuba format` to update your test files automatically.
- **Updated snapshot printing**: Jest have updated the way snapshots are printed, which may require you to update your snapshot tests.

In this release, we have enabled the [global cleanup](https://jestjs.io/blog/2025/06/04/jest-30#globals-cleanup-between-test-files) feature by default. This automatically cleans up global state between test files, helping to prevent memory leaks and ensure test isolation.

If you need to revert to the previous behavior, you can configure the `globalsCleanup` option via `dangerouslySetJestConfig` in your `sku.config.ts` file:

```ts
export default {
  dangerouslySetJestConfig: (config) => ({
    ...config,
    testEnvironmentOptions: {
      globalsCleanup: 'soft', // Jest default or `'off'` to disable completely
    },
  }),
};
```
