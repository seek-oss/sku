# Spec Delta

## ADDED Requirements

### Requirement: Production keep-alive timeout defaults to 35 seconds

Before calling `onListen`, the production server MUST set `keepAliveTimeout` to 35000 and leave `headersTimeout` unchanged.

#### Scenario: Production default

- **WHEN** the production server has listened
- **AND** `onListen` does not set `keepAliveTimeout`
- **THEN** `keepAliveTimeout` is 35000
- **AND** `headersTimeout` is 60000

#### Scenario: onListen replaces the timeout

- **WHEN** `onListen` sets `keepAliveTimeout` to 40000
- **AND** `headersTimeout` is still greater than 40000
- **THEN** `keepAliveTimeout` is 40000 after `onListen` returns

### Requirement: Keep-alive timeout stays below an enabled headers timeout

After `onListen` returns, startup MUST fail when `headersTimeout` is greater than 0 and `keepAliveTimeout` is greater than or equal to it.

#### Scenario: App sets keep-alive at the headers timeout

- **WHEN** `onListen` sets `keepAliveTimeout` to 60000
- **AND** `headersTimeout` is 60000
- **THEN** startup fails

#### Scenario: App turns off the headers timeout

- **WHEN** `onListen` sets `headersTimeout` to 0
- **THEN** startup does not fail on `keepAliveTimeout`

### Requirement: sku start leaves keep-alive and SIGTERM to the app

`sku start` MUST NOT set `keepAliveTimeout` or register a `SIGTERM` listener.

#### Scenario: Development is unchanged

- **WHEN** `sku start` has finished `onListen`
- **AND** `onListen` set neither
- **THEN** `keepAliveTimeout` is 5000
- **AND** the process has no `SIGTERM` listener from sku

### Requirement: Production server registers one SIGTERM listener

After `onListen` returns, the production server MUST register exactly one `SIGTERM` listener.

#### Scenario: Production registers one listener

- **WHEN** the production server has finished `onListen`
- **AND** the process had no `SIGTERM` listener
- **THEN** the process has one `SIGTERM` listener

### Requirement: An existing SIGTERM listener fails production startup

When a `SIGTERM` listener exists after `onListen` returns, production startup MUST fail with an error that points to `onShutdown`.

#### Scenario: A listener registered by the app or a dependency

- **WHEN** a `SIGTERM` listener exists after `onListen` returns in production
- **THEN** startup fails
- **AND** the error says a dependency can register the listener
- **AND** the error points to `onShutdown`

### Requirement: Shutdown closes sockets that have no in-flight response

On `SIGTERM`, the production server MUST stop accepting connections and close every socket that has no in-flight response, without waiting for `keepAliveTimeout`.

#### Scenario: Idle keep-alive does not hold the process

- **WHEN** the production server receives `SIGTERM`
- **AND** a socket is idle after a finished response
- **THEN** that socket closes without waiting `keepAliveTimeout`

#### Scenario: A connected socket with no request does not hold the process

- **WHEN** the production server receives `SIGTERM` on Node 24 or Node 26
- **AND** a socket has connected and has not sent a request
- **THEN** that socket closes without waiting for the client

### Requirement: In-flight responses finish and then close

On `SIGTERM`, the production server MUST let in-flight responses finish and then close their sockets without waiting for `keepAliveTimeout`.

#### Scenario: Headers not yet sent

- **WHEN** the production server receives `SIGTERM` during a response
- **AND** that response has not sent headers
- **THEN** the response tells the client the connection will close
- **AND** the socket closes when the response finishes

#### Scenario: Headers already sent

- **WHEN** the production server receives `SIGTERM` during a response
- **AND** that response has already sent headers
- **THEN** the response finishes
- **AND** the socket closes when the response finishes

### Requirement: Shutdown awaits onShutdown

After in-flight responses finish, the production server MUST await `onShutdown` when the server entry defines it, and continue shutting down when it throws or rejects.

#### Scenario: onShutdown runs after responses finish

- **WHEN** the server entry defines `onShutdown`
- **AND** the production server receives `SIGTERM`
- **THEN** `onShutdown` runs after in-flight responses finish
- **AND** the process exits 0

#### Scenario: onShutdown failure still exits 0

- **WHEN** `onShutdown` throws or rejects
- **THEN** the error is reported
- **AND** the process exits 0

### Requirement: Shutdown exits 1 after 25 seconds

The production server MUST exit 1 when shutdown has not finished 25 seconds after `SIGTERM`.

#### Scenario: A response never finishes

- **WHEN** the production server receives `SIGTERM`
- **AND** an in-flight response has not finished 25 seconds later
- **THEN** the process exits 1
- **AND** `onShutdown` has not run

#### Scenario: The deadline does not delay a clean exit

- **WHEN** the production server receives `SIGTERM`
- **AND** shutdown finishes before 25 seconds
- **THEN** the process exits 0 without waiting for the deadline

### Requirement: Docs show how to start and flush telemetry clients

The logging docs MUST show the two `onShutdown` flush shapes, each with one worked example that finishes inside the 25 second deadline and does not call `process.exit`: a flush that returns a promise, and a flush that takes a callback.

The promise example MUST be an OpenTelemetry tracer provider calling `shutdown()`.
The docs MUST name `@opentelemetry/sdk-node`, `@opentelemetry/sdk-metrics`, and `@opentelemetry/sdk-logs` as the same call.

The callback example MUST be `hot-shots` calling `client.close(callback)`.
The docs MUST name Pino as the same shape, via `logger.flush(callback)` on a buffering destination.

Clients MUST appear in this order: `hot-shots`, `dd-trace`, OpenTelemetry, Pino, `@launchdarkly/node-server-sdk`.

The docs MUST say that `dd-trace` has no trace flush that resolves when the agent has the spans, and that the app calls `tracer.dogstatsd.flush()` and then waits out one trace flush interval.
The docs MUST say that `@launchdarkly/node-server-sdk` needs `flush()` before `close()`.

#### Scenario: An app uses OpenTelemetry

- **WHEN** an app reads the logging docs for shutdown
- **AND** the app uses OpenTelemetry
- **THEN** the docs show how to start a tracer provider
- **AND** the docs show an `onShutdown` that calls `shutdown()` within the 25 second deadline
- **AND** the example does not call `process.exit`
- **AND** the docs name the Node SDK, metrics SDK, and logs SDK as the same call

#### Scenario: An app uses dd-trace

- **WHEN** an app reads the logging docs for shutdown
- **AND** the app uses `dd-trace`
- **THEN** the docs say to flush DogStatsD and wait out one trace flush interval within the 25 second deadline
- **AND** the docs do not call `process.exit` from that flush
