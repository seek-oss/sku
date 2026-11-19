# Tasks

## 1. Production keep-alive

- [ ] 1.1 After a successful production `listen`, and before `onListen`, set `keepAliveTimeout` to 35000. Do not change `headersTimeout`. `sku start` does not set it. Ship with tasks 2.2 and 2.3, because without them a finished in-flight socket outlives the 25 second deadline. Verify: a production server test sees 35000 and headers timeout 60000 when `onListen` leaves them alone, and `sku start` stays at 5000.
- [ ] 1.2 After `onListen`, fail startup the same way a thrown `onListen` does when `headersTimeout` is greater than 0 and `keepAliveTimeout` is greater than or equal to it. Verify: 40000 is kept when headers timeout is 60000, 60000 fails startup, and a headers timeout of 0 does not fail.

## 2. SIGTERM drain

- [ ] 2.1 Add optional `onShutdown` to `defineServerEntry` and `SkuServerEntry`. Verify: a server entry without `onShutdown` type-checks and listens.
- [ ] 2.2 After `onListen` returns, register one production `SIGTERM` listener, and none from `sku start`. In production, fail startup when a listener already exists. The error gives the listener count and any function names, says a dependency can register one, points to `onShutdown`, and says how to remove a dependency's listener in `onListen`. Verify: one listener in production, none from sku in `sku start`, and an existing listener fails startup with that message.
- [ ] 2.3 On `SIGTERM`, stop accepting and close sockets with no in-flight response without waiting `keepAliveTimeout`, on Node 24 and Node 26. That includes an idle keep-alive, and a connected socket that has sent no bytes, which Node 24's `close()` and headers timer both leave open. Verify: both socket kinds close promptly on each Node major.
- [ ] 2.4 For an in-flight response that has not sent headers, send `Connection: close`. When any in-flight response finishes, close its socket without waiting `keepAliveTimeout`. Verify: the header is present only when headers were not yet sent, and the socket closes when the response ends.
- [ ] 2.5 On `SIGTERM`, start an `unref`ed 25 second timer that exits 1. Verify with fake timers: a response that never ends exits 1 at 25 seconds without calling `onShutdown`, and a drain that finishes early exits 0 without waiting.
- [ ] 2.6 Await `onShutdown` with no arguments after responses finish, then exit 0. Report a throw or rejection and continue. Verify: order is response, then `onShutdown`, then exit 0; a rejected `onShutdown` still exits 0.

## 3. Docs and release

- [ ] 3.1 Update the SSR entries docs so production keep-alive is 35 seconds, `onListen` may override it, and an enabled `headersTimeout` must stay above it. Say to set keep-alive above the idle timeout of the proxy in front of the app, with an example for a 60 second idle timeout (`keepAliveTimeout` 65000, `headersTimeout` 66000). Remove the 20 second assignment as the production example. Document `onShutdown` and the exit 1 at 25 seconds, and say the deadline assumes a 30 second grace period. Say that sku does not start or flush telemetry. Say to remove any `SIGTERM` handler the app's tracing setup registers, and how to handle one a dependency registers, because startup fails when one exists. Verify: `rg "20_000" site/docs/ssr` no longer shows it as the Managed Data Mode production default.
- [ ] 3.2 Add a shutdown section to the SSR docs with how to start and an `onShutdown` flush example for each common client: OpenTelemetry tracer, meter and logger providers, `dd-trace` traces and its DogStatsD client, a StatsD client such as `hot-shots`, the LaunchDarkly server SDK, and a logger that buffers output. Check each example against that library's own docs. Each flush awaits completion, fits inside the 25 second deadline, and does not call `process.exit`. Verify: each example type-checks in a docs snippet test or fixture.
- [ ] 3.3 Add a sku minor changeset. Verify: `pnpm changeset status` lists it.
