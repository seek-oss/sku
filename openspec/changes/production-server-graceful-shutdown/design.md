# Design

## Context

See proposal.md for why. Three keep-alive choices sit in front of the drain, in this order.

Node destroys an idle socket at `keepAliveTimeout` plus `keepAliveTimeoutBuffer` (default 1 second). The default `keepAliveTimeout` is 5 seconds, so the socket dies at 6 seconds. `headersTimeout` defaults to 60 seconds and must stay strictly above `keepAliveTimeout`, or the headers timer cuts the idle socket first. A `headersTimeout` of 0 turns the headers timer off.

`server.close()` drops sockets that are already idle. On Node 24 it does not drop a socket that has connected and not sent a request, and the headers timer does not start until the first byte arrives, so that socket stays open until the client closes it. On Node 26 `close()` drops it. A response that finishes during `close()` then waits out `keepAliveTimeout` plus the 1 second buffer unless the socket is closed again. Node does not add `Connection: close` to responses sent after `close()`.

On Kubernetes, the platform usually delays `SIGTERM` while the pod leaves the load balancer or mesh, then sends `SIGKILL` when the termination grace period ends, 30 seconds by default. Node often runs as PID 1 in a container, so without a listener it ignores `SIGTERM` until the kill. `process.exit` skips `beforeExit`, so a `BatchSpanProcessor`, `dd-trace` or a StatsD client drops its last batch unless the app flushes it first.

## Goals / Non-Goals

**Goals:**

- One production default that outlives a peer idle timeout of about 30 seconds, without moving `headersTimeout`.
- An `onListen` override that cannot invert that relationship.
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

- **Keep the docs' 20 second example.** The server still closes before a 30 second peer, so the next request is reset. Apps also skip the example, and the default is then 5 seconds.
- **Use Node's 5 second default.** Same race, sooner.
- **Set the timeout after `onListen`.** That would wipe an app that knows its peer is longer than 35 seconds.

The 35 seconds depends on the drain below. Without it, a finished in-flight socket waits 36 seconds, past the 25 second deadline, so every drain with an in-flight keep-alive request would exit 1. The keep-alive default and the drain ship together.

### Fail startup when keep-alive meets the headers timeout

After `onListen`, if `headersTimeout` is greater than 0 and `keepAliveTimeout >= headersTimeout`, startup fails through the same path as a thrown `onListen`. A `headersTimeout` of 0 means the app turned the headers timer off, so there is nothing to compare. Sku does not raise `headersTimeout` or `requestTimeout`. An app that needs a longer keep-alive sets both, with `headersTimeout` still less than or equal to `requestTimeout` (Node rejects the opposite).

Alternative considered: bump `headersTimeout` to `keepAliveTimeout + 1000`. That hides a second timer the app did not ask to change, and it fails anyway once `headersTimeout` would exceed `requestTimeout`.

### Close the socket instead of waiting out the keep-alive

The `SIGTERM` listener calls `server.close()`, then closes any socket that still has no in-flight response. That covers Node 24's pre-request sockets, which `close()` leaves open.

For a response that has not sent headers, set `Connection: close` so Node treats it as the last response on that socket and ends it when the response finishes. For a response that has already sent headers, close the socket when the response finishes. Neither path waits `keepAliveTimeout`.

Already-idle sockets are reset by `close()`, which is Node's own `closeIdleConnections`. The time a supervisor waits before `SIGTERM` is what stops new requests from landing on those sockets. This design does not add a clean shutdown for a socket that is already idle.

### One listener, and onShutdown after the drain

After `onListen`, the production server registers one `SIGTERM` listener that runs the default drain, then awaits optional `onShutdown`.

A `SIGTERM` listener that already exists after `onListen` fails startup in production only. `sku start` does not check it, because the dev process can have listeners that are not the app's. The error says how many listeners exist, names each one that has a function name, and says that a dependency can register one. It points to `onShutdown`, and says that a dependency's listener can be removed in `onListen` and its cleanup called from `onShutdown`.

Alternative considered: `replaceShutdown(handler)` on `onListen`, so an app could skip sku's drain and own the whole `SIGTERM` path under the same deadline. Rejected. Apps that already register their own drain do the same `server.close()` plus hard-exit pattern sku will own; they should drop that handler and keep flush work in `onShutdown`. No Managed Data Mode need was found for a different drain. SSE is already an in-flight HTTP response under the deadline. WebSockets would need explicit close if an app adds them later, which is not a reason for a drain-replacement hook now.

### Exit 1 at 25 seconds

The listener first starts a 25 second timer that calls `process.exit(1)`. The timer is `unref`ed so it never holds a finished process open. Once it fires, the drain and `onShutdown` are abandoned.

A platform measures its grace period from outside the container, so 25 seconds leaves 5 seconds of a 30 second grace period for signal delivery and the flush. Exit 1 shows up in container exit-code monitoring as a failed drain, where a `SIGKILL` would look like any other 137.

The deadline is fixed for now. Every app on Managed Data Mode today deploys to a 30 second grace period, and the existing app handlers that could migrate also exit at 25 seconds without overriding it. A server entry option can be added later without breaking apps, while removing one would. Until then a single value keeps apps consistent, and the first app that needs another value shows what the option should look like.

Alternatives considered:

- **No timer.** A response that never finishes is `SIGKILL`ed, `onShutdown` never runs, and the last spans are lost with no signal.
- **A configurable deadline (`shutdownTimeoutMs`).** Deferred. It matters on a platform with a shorter grace period, where `SIGKILL` arrives first and the exit 1 and the flush are lost, or a longer one, where sku cuts responses the platform would let finish. Add it when an app runs on such a platform or serves a response that legitimately outlives 25 seconds.

### Document how apps start and flush telemetry

Sku does not start, detect, flush, or warn about telemetry. Combinations of OpenTelemetry majors, separate logs packages, `dd-trace`, StatsD, LaunchDarkly, and buffering loggers are too many to account for from the production server, and sku did not start those clients.

The SSR docs show how to register providers or clients at startup, and an `onShutdown` that flushes each common client: OpenTelemetry tracer, meter and logger providers, `dd-trace` traces and its DogStatsD client, a StatsD client such as `hot-shots`, the LaunchDarkly server SDK, and a logger that buffers output. They say that `onShutdown` runs inside the 25 second deadline and must not call `process.exit`.

Alternative considered: shut down globally registered OpenTelemetry providers from sku, and warn when a registration cannot be shut down. Sku does not start OpenTelemetry, so flushing it is the app's job. Warnings cannot cover every registration shape without becoming a second OpenTelemetry integration.

## Risks / Trade-offs

- [Peer idle timeout is longer than 35 seconds] → `onListen` sets a higher `keepAliveTimeout` and a higher `headersTimeout`. Startup fails if it forgets the headers timeout.
- [Headers already sent when `SIGTERM` arrives] → the response cannot say `Connection: close`. The socket closes when the response ends.
- [Idle sockets are reset] → a request already written by the peer fails with `ECONNRESET`. That window is the supervisor's delay before `SIGTERM`, which this change does not set.
- [A response runs past 25 seconds] → the process exits 1 and the remaining flush is lost.
- [The platform's grace period is not 30 seconds] → on a shorter one `SIGKILL` arrives first, as it did before this change; on a longer one sku exits before the platform requires. The app cannot change this until sku adds an option. The docs say the deadline assumes a 30 second grace period.
- [A dependency registers a `SIGTERM` listener] → production startup fails even though the app wrote no handler, for example through a library built on `signal-exit`. The error says a dependency can be the cause. The app removes that listener in `onListen` and calls the library's cleanup from `onShutdown`.
- [An app omits a flush] → buffered telemetry is lost. The docs show how for common clients.
