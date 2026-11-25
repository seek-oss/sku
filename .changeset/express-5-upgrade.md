---
'sku': major
---

Upgrade to Express 5 and `webpack-dev-server` 6

**BREAKING CHANGE:**

Sku now requires Express 5. Your app and middleware may need to be updated to use Express 5.

**MIGRATION GUIDE**

1. Upgrade `express` to `^5.2.1` in your app, and `@types/express` to `^5.0.6` if you use it.
   Upgrade any Express middleware you depend on to a version that supports Express 5.
   Express's [migration guide](https://expressjs.com/en/guide/migrating-5.html) covers the full list of changes.

2. Update route paths in your server `middleware` and `devServerMiddleware` files.
   Express 5 uses `path-to-regexp` v8, so bare wildcards and optional parameters throw at startup:

   ```diff
   - app.get('*', handler);
   + app.get('/{*splat}', handler);

   - app.get('/users/:id?', handler);
   + app.get('/users{/:id}', handler);
   ```

3. Check how your app reads query strings.
   Express 5 defaults to the `simple` query parser, so `?a[b]=c` is no longer parsed into a nested object.
   If you rely on nested query values, restore the old behaviour in your server entry `middleware`:

   ```ts
   app.set('query parser', 'extended');
   ```

   `req.query` is also now a read-only getter, so assignments like `req.query = …` no longer work.

4. Remove use of APIs that Express 5 removed, such as `app.del()`, `req.param()`, `res.json(status, body)`, `res.send(status)` and `res.redirect('back')`.

5. Fix any type errors from `@types/express` 5, make sure tests pass and that the dev server starts without errors.
