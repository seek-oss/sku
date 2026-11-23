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

- **WHEN** `onListen` sets `keepAliveTimeout` to 65000
- **THEN** `keepAliveTimeout` is 65000 after `onListen` returns
- **AND** `headersTimeout` is 60000

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

#### Scenario: A repeated SIGTERM during onShutdown is ignored

- **WHEN** the production server has received `SIGTERM`
- **AND** the HTTP server has closed
- **AND** `onShutdown` has not finished
- **THEN** the process still has one `SIGTERM` listener
- **AND** another `SIGTERM` does not call `onShutdown` again or end the process

### Requirement: An existing SIGTERM listener fails production startup

When a `SIGTERM` listener exists after `onListen` returns, production startup MUST fail with an error that points to `onShutdown`.

#### Scenario: A listener registered by the app or a dependency

- **WHEN** a `SIGTERM` listener exists after `onListen` returns in production
- **THEN** startup fails
- **AND** the error says a dependency can register the listener
- **AND** the error points to `onShutdown`
- **AND** the error says to turn off a dependency's listener with the dependency's own option or function first
- **AND** the error says to call `process.removeAllListeners('SIGTERM')` in `onListen` only when the dependency has neither

### Requirement: Shutdown closes sockets that have no in-flight response

On `SIGTERM`, the production server MUST stop accepting connections and close every socket that is idle after a finished response, without waiting for `keepAliveTimeout`.
A socket that has connected and not sent a request MUST close without waiting for the client: at `SIGTERM` on Node 26, and once no response is in flight on Node 24.

#### Scenario: Idle keep-alive does not hold the process

- **WHEN** the production server receives `SIGTERM`
- **AND** a socket is idle after a finished response
- **THEN** that socket closes without waiting `keepAliveTimeout`

#### Scenario: A connected socket with no request does not hold the process

- **WHEN** the production server receives `SIGTERM` on Node 24 or Node 26
- **AND** no response is in flight
- **AND** a socket has connected and has not sent a request
- **THEN** that socket closes without waiting for the client

#### Scenario: Node 24 keeps a socket with no request until responses finish

- **WHEN** the production server receives `SIGTERM` on Node 24
- **AND** a response is in flight
- **AND** a socket has connected and has not sent a request
- **THEN** that socket stays open until no response is in flight, and then closes

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

#### Scenario: A request arrives during shutdown

- **WHEN** the production server has received `SIGTERM`
- **AND** a socket that is still open sends a request
- **THEN** the server responds
- **AND** the response tells the client the connection will close
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

### Requirement: Docs show the two onShutdown flush shapes

The logging docs MUST show one worked example of a flush that returns a promise and one of a flush that takes a callback.
Each example MUST finish inside the 25 second deadline and MUST NOT call `process.exit`.

#### Scenario: Both flush shapes are shown

- **WHEN** an app reads the logging docs for shutdown
- **THEN** the docs show a promise flush and a callback flush from `onShutdown`
- **AND** neither example calls `process.exit`

### Requirement: Docs show an OpenTelemetry promise flush

The promise example MUST start an OpenTelemetry tracer provider and call its `shutdown()` from `onShutdown`.

#### Scenario: An app uses OpenTelemetry

- **WHEN** an app reads the logging docs for shutdown
- **AND** the app uses OpenTelemetry
- **THEN** the docs show how to start a tracer provider
- **AND** the docs show an `onShutdown` that calls `shutdown()` within the 25 second deadline
- **AND** the docs name `@opentelemetry/sdk-node`, `@opentelemetry/sdk-metrics`, and `@opentelemetry/sdk-logs` as the same call

### Requirement: Docs show a hot-shots callback flush

The callback example MUST wrap `hot-shots` `client.close(callback)` in a promise returned from `onShutdown`.

#### Scenario: An app uses hot-shots

- **WHEN** an app reads the logging docs for shutdown
- **AND** the app uses `hot-shots`
- **THEN** the docs show an `onShutdown` that resolves when `client.close(callback)` calls back

#### Scenario: An app uses Pino with a buffering destination

- **WHEN** an app reads the logging docs for shutdown
- **AND** the app uses Pino with a buffering destination
- **THEN** the docs name `logger.flush(callback)` as the same shape as `hot-shots`

### Requirement: Docs describe the dd-trace and LaunchDarkly flushes

The docs MUST describe the `dd-trace` and `@launchdarkly/node-server-sdk` flushes in prose, without another worked example.

#### Scenario: An app uses dd-trace

- **WHEN** an app reads the logging docs for shutdown
- **AND** the app uses `dd-trace`
- **THEN** the docs say that `dd-trace` has no trace flush that resolves when the agent has the spans
- **AND** the docs say to call `tracer.dogstatsd.flush()` and wait out one trace flush interval within the 25 second deadline
- **AND** the docs do not call `process.exit` from that flush

#### Scenario: An app uses LaunchDarkly

- **WHEN** an app reads the logging docs for shutdown
- **AND** the app uses `@launchdarkly/node-server-sdk`
- **THEN** the docs say to await `flush()` before calling `close()`
