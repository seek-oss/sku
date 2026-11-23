# Design

## Context

See proposal.md for why. Three keep-alive choices sit in front of the drain, in this order.

Node destroys an idle socket at `keepAliveTimeout` plus `keepAliveTimeoutBuffer` (default 1 second). The default `keepAliveTimeout` is 5 seconds, so the socket dies at 6 seconds. `headersTimeout` defaults to 60 seconds and limits how long a socket can take to send complete request headers. It starts when the socket connects and again when the next request begins, so it does not apply to an idle keep-alive socket after a finished response. On Node 24 and Node 26, a socket with `keepAliveTimeout` 5000 and `headersTimeout` 1000 stays open for 6 seconds after a response. The advice to keep `headersTimeout` above `keepAliveTimeout` worked around [nodejs/node#27363](https://github.com/nodejs/node/issues/27363), which Node 12.19 and Node 14 fixed.

`server.close()` drops sockets that are already idle. On Node 24 it does not drop a socket that has connected and not sent a request. The headers timer closes that socket with a 408, but only after `headersTimeout`, checked every `connectionsCheckingInterval` (30 seconds by default), so 60 to 90 seconds after it connected. That is past the 25 second deadline. On Node 26 `close()` drops it. A response that finishes during `close()` then waits out `keepAliveTimeout` plus the 1 second buffer unless the socket is closed again. Node does not add `Connection: close` to responses sent after `close()`.

On Kubernetes, the pod leaves its Service endpoints at the same time as it receives `SIGTERM`, after any `preStop` hook has run. The load balancer or mesh can route requests to the pod until it sees that change, so `SIGTERM` is delayed only when the platform or app sets a `preStop` sleep. `SIGKILL` follows when the termination grace period ends, 30 seconds by default, counted from the start of `preStop`. Node often runs as PID 1 in a container, so without a listener it ignores `SIGTERM` until the kill. `process.exit` skips `beforeExit`, so a `BatchSpanProcessor`, `dd-trace` or a StatsD client drops its last batch unless the app flushes it first.

## Goals / Non-Goals

**Goals:**

- One production default that outlives a peer idle timeout of about 30 seconds, without moving `headersTimeout`.
- An `onListen` override that can raise or lower that default.
- A `SIGTERM` drain that closes idle sockets and the socket of a finished in-flight response, on Node 24 and Node 26.
- An exit before `SIGKILL` that tells a stalled drain apart from a clean one.
- Apps can see how to start and flush the telemetry clients they use from `onShutdown`.

**Non-Goals:**

- See proposal.md. This design does not add a second listener, a drain-replacement hook, start telemetry, or flush or warn about any telemetry client.

## Decisions

### Set 35 seconds before onListen

The production listen path sets `keepAliveTimeout = 35_000` after `listen` and before `onListen`. The socket timer then fires at 36 seconds, after a peer that idles out at about 30 seconds. `headersTimeout` stays 60 seconds.

`onListen` runs next and may assign another `keepAliveTimeout`. The production path does not assign it again.

Alternatives considered:

- **Keep the docs' 20 second example.** The server still closes before a 30 second peer, so the next request is reset. An app that skips the example gets Node's 5 second default.
- **Use Node's 5 second default.** Same race, sooner.
- **Set the timeout after `onListen`.** That would wipe an app that knows its peer is longer than 35 seconds.

The 35 seconds depends on the drain below. Without it, a finished in-flight socket waits 36 seconds, past the 25 second deadline, so every drain with an in-flight keep-alive request would exit 1. The keep-alive default and the drain ship together.

### Leave headersTimeout alone

Sku does not change or check `headersTimeout` or `requestTimeout`. Neither applies to an idle keep-alive socket, so an app that needs a longer keep-alive sets only `keepAliveTimeout`.

Alternatives considered:

- **Fail startup when `keepAliveTimeout >= headersTimeout`.** That enforces the workaround for nodejs/node#27363, which no supported Node version needs, and would fail a valid config.
- **Bump `headersTimeout` to `keepAliveTimeout + 1000`.** That changes a second timer the app did not ask to change, for no effect on idle sockets.

### Close the socket instead of waiting out the keep-alive

The `SIGTERM` listener calls `server.close()`. When nothing is in flight, it then calls `closeAllConnections()`, which also closes Node 24's pre-request sockets that `close()` leaves open.

For a response that has not sent headers, set `Connection: close` so Node treats it as the last response on that socket and ends it when the response finishes. For a response that has already sent headers, close the socket when the response finishes. Neither path waits `keepAliveTimeout`.

A request that arrives after `SIGTERM` gets `Connection: close` too. On Node 24 a pre-request socket stays open while any response is in flight, so it can still send a request during the drain. Any socket that was part-way through sending headers at `SIGTERM` can too, on either Node major. Sku serves that request and closes the socket after it, rather than resetting it. The request listener is prepended, so it runs before Express and no middleware has sent headers yet.

Already-idle sockets are reset by `close()`, which is Node's own `closeIdleConnections`. Only a delay before `SIGTERM`, such as a `preStop` sleep, stops new requests from landing on those sockets. This design does not add a clean shutdown for a socket that is already idle.

Alternatives considered for Node 24's pre-request sockets:

- **Track every connection and destroy pre-request sockets at `SIGTERM`.** Closes them sooner, but adds per-connection bookkeeping to every production server for a socket that the deadline already bounds and that Node 26 closes itself.
- **Lower `headersTimeout` at `SIGTERM` so Node's own check sends a 408.** `close()` stops that check (`httpServerPreClose` clears the connections-checking interval), so it only works if the server keeps accepting until the next check, and with a shorter `connectionsCheckingInterval` running for the life of the server.
- **Call `closeAllConnections()` at `SIGTERM`.** Cuts in-flight responses.

### One listener, and onShutdown after the drain

After `onListen`, the production server registers one `SIGTERM` listener that runs the default drain, then awaits optional `onShutdown`.

The listener stays registered until the process exits. The HTTP server closes partway through the drain, before `onShutdown` finishes. Without a listener, a repeated `SIGTERM` would fall back to Node's default and end the process before the flush and the exit code.

A `SIGTERM` listener that already exists after `onListen` fails startup in production only. `sku start` does not check it, because the dev process can have listeners that are not the app's. The error says how many listeners exist, names each one that has a function name, and says that a dependency can register one. It points to `onShutdown`. For a dependency's listener, it says to turn off the dependency's signal handling with its own option or function in `onListen` and call its shutdown from `onShutdown`. Only when the dependency has neither does it say to call `process.removeAllListeners('SIGTERM')` in `onListen`, because removing a listener behind a library's back can leave it thinking its handler is still installed.

Alternative considered: `replaceShutdown(handler)` on `onListen`, so an app could skip sku's drain and own the whole `SIGTERM` path under the same deadline. Rejected. A hand-written drain is usually the same `server.close()` plus hard-exit pattern sku now owns, so an app can drop that handler and keep flush work in `onShutdown`. SSE is already an in-flight HTTP response under the deadline. WebSockets would need explicit close if an app adds them later, which is not a reason for a drain-replacement hook now.

### Exit 1 at 25 seconds

The listener first starts a 25 second timer that calls `process.exit(1)`. The timer is `unref`ed so it never holds a finished process open. Once it fires, the drain and `onShutdown` are abandoned.

A platform measures its grace period from outside the container, so 25 seconds leaves 5 seconds of a 30 second grace period as margin for signal delivery and process exit. `onShutdown` runs inside the 25 seconds, not the margin. A `preStop` hook runs inside the same grace period, so a `preStop` sleep longer than 5 seconds lets `SIGKILL` arrive before the deadline. Exit 1 shows up in container exit-code monitoring as a failed drain, where a `SIGKILL` would look like any other 137.

The deadline is fixed for now. 30 seconds is the Kubernetes default grace period. A server entry option can be added later without breaking apps, while removing one would. Until then a single value keeps apps consistent, and the first app that needs another value shows what the option should look like.

Alternatives considered:

- **No timer.** A response that never finishes is `SIGKILL`ed, `onShutdown` never runs, and the last spans are lost with no signal.
- **A configurable deadline (`shutdownTimeoutMs`).** Deferred. It matters on a platform with a shorter grace period, where `SIGKILL` arrives first and the exit 1 and the flush are lost, or a longer one, where sku cuts responses the platform would let finish. Add it when an app runs on such a platform or serves a response that legitimately outlives 25 seconds.

### Document how apps start and flush telemetry

Sku does not start, detect, flush, or warn about telemetry. Combinations of OpenTelemetry majors, separate logs packages, `dd-trace`, StatsD, LaunchDarkly, and buffering loggers are too many to account for from the production server, and sku did not start those clients.

The logging docs show the two flush shapes. `hot-shots` is the callback flush: `client.close(callback)`. `dd-trace` is described rather than shown: flush DogStatsD, then wait out one trace interval, because traces otherwise drain on `beforeExit`. A promise flush is an OpenTelemetry tracer provider calling `shutdown()`. The Node SDK, metrics SDK, and logs SDK are named as the same call. Pino is named as the same callback shape. LaunchDarkly is a sentence: await `flush()`, then `close()`. `onShutdown` runs inside the 25 second deadline and must not call `process.exit`.

Alternative considered: shut down globally registered OpenTelemetry providers from sku, and warn when a registration cannot be shut down. Sku does not start OpenTelemetry, so flushing it is the app's job. Warnings cannot cover every registration shape without becoming a second OpenTelemetry integration.

## Risks / Trade-offs

- [Peer idle timeout is longer than 35 seconds] → `onListen` sets a higher `keepAliveTimeout`.
- [Headers already sent when `SIGTERM` arrives] → the response cannot say `Connection: close`. The socket closes when the response ends.
- [Idle sockets are reset] → a request already written by the peer fails with `ECONNRESET`. Only a delay before `SIGTERM`, such as a `preStop` sleep, closes that window. This change does not set one.
- [`SIGTERM` arrives before the load balancer or mesh stops routing to the pod] → `close()` stops accepting at once, so new connections are refused until routing catches up. A `preStop` sleep avoids this. Sku does not set one.
- [A response runs past 25 seconds] → the process exits 1 and the remaining flush is lost.
- [The platform's grace period is not 30 seconds] → on a shorter one `SIGKILL` arrives first, as it did before this change; on a longer one sku exits before the platform requires. The app cannot change this until sku adds an option. The docs say the deadline assumes a 30 second grace period.
- [A dependency registers a `SIGTERM` listener] → production startup fails even though the app wrote no handler, for example through a library built on `signal-exit`. The error says a dependency can be the cause. The app turns off the library's signal handling with the library's own option or function, and calls its shutdown from `onShutdown`. When the library has neither, the app calls `process.removeAllListeners('SIGTERM')` in `onListen`.
- [A dependency registers a `SIGTERM` listener after startup] → the startup check does not see it. If that listener calls `process.exit`, it cuts the drain and `onShutdown` short.
- [An app omits a flush] → buffered telemetry is lost. The docs show how for common clients.
