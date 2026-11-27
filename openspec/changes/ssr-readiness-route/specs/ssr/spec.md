# Spec Delta

## ADDED Requirements

### Requirement: Sku answers GET and HEAD /livez and /readyz before app middleware

`sku start` and the production server MUST answer `GET` and `HEAD /livez` and `GET` and `HEAD /readyz` (including a trailing slash) ahead of request context, static files, Vite, dev server middleware, and app middleware, without calling the app's middleware.

Other methods on `/livez` and `/readyz` MUST return 405 with `Allow: GET, HEAD` and MUST NOT reach the app.

`/health`, `/healthz`, `/startupz`, and subpaths such as `/livez/other` MUST reach the app. Sku MUST NOT serve `/health`, `/healthz`, or `/startupz`.

#### Scenario: App middleware handles every path

- **WHEN** the server entry's middleware responds to every request
- **AND** a request is sent to `GET /livez` or `GET /readyz`
- **THEN** sku responds
- **AND** the app's middleware does not run

#### Scenario: Other methods do not fall through

- **WHEN** a request is sent to `POST /livez` or `PUT /readyz`
- **THEN** the response is 405 with `Allow: GET, HEAD`
- **AND** the app's middleware does not run

#### Scenario: Other paths reach the app

- **WHEN** a request is sent to `GET /health`, `GET /healthz`, `GET /startupz`, or `GET /livez/other`
- **THEN** the app's middleware handles it

### Requirement: Probe responses are plain text and do not log each success

`GET` and `HEAD` responses from `/livez` and `/readyz`, and 405 responses on those paths, MUST send `Content-Type: text/plain; charset=utf-8` and `Cache-Control: no-store`.

A 200 response MUST use the body `ok`. A 503 response MUST use the body `unavailable`. `HEAD` responses MUST omit the body. Neither route accepts an app callback.

Sku MUST log readiness state transitions and MUST NOT log individual 200 probe responses. Bodies MUST NOT include versions, commit SHAs, hostnames, dependency names, connection strings, or stack traces.

#### Scenario: Successful probe

- **WHEN** `GET /livez` or `GET /readyz` returns 200
- **THEN** the body is `ok`
- **AND** `Content-Type` is `text/plain; charset=utf-8`
- **AND** `Cache-Control` is `no-store`
- **AND** sku does not log that response

### Requirement: /livez reports that the process can respond

`GET` and `HEAD /livez` MUST return 200 with the body `ok` whenever the handler runs, including while `onListen` has not returned and while the process is draining. The handler MUST NOT perform I/O, take a lock, or call a downstream dependency.

#### Scenario: During onListen and during drain

- **WHEN** the port is open and `onListen` has not returned
- **THEN** `GET /livez` returns 200 with the body `ok`
- **WHEN** the production server is draining after `SIGTERM` or `SIGINT`
- **THEN** `GET /livez` still returns 200 with the body `ok`

### Requirement: /readyz is 200 only after startup and while not draining

`GET` and `HEAD /readyz` MUST return 503 with the body `unavailable` until the server is listening and `onListen` has returned.

After that, they MUST return 200 with the body `ok` until the process is draining.

On `SIGTERM` or `SIGINT`, `/readyz` MUST return 503 with the body `unavailable` immediately, on both `sku start` and the production server, until the process exits.

#### Scenario: During onListen

- **WHEN** the port is open
- **AND** `onListen` has not returned
- **THEN** `GET /readyz` returns 503 with the body `unavailable` and `Cache-Control: no-store`

#### Scenario: After startup

- **WHEN** `onListen` has returned
- **AND** the process is not draining
- **THEN** `GET /readyz` returns 200 with the body `ok` and `Cache-Control: no-store`
- **AND** `HEAD /readyz` returns 200

#### Scenario: During the drain

- **WHEN** the production server has received `SIGTERM` or `SIGINT`
- **AND** a request to `/readyz` arrives on an open socket
- **THEN** the response is 503 with the body `unavailable` and `Cache-Control: no-store`
- **AND** sku has logged the transition to draining
