## Purpose

Webpack SSR apps need the listening server after startup so they can set timeouts and close it on shutdown.

## ADDED Requirements

### Requirement: onStart receives the Express app and the listening server

When the Webpack SSR server entry provides `onStart`, sku MUST call it once after `listen` succeeds.
This applies in `sku start-ssr` and in production `node ./dist/server.js`.

```ts
onStart?: (
  app: Express,
  server: {
    httpServer: http.Server | https.Server;
    port: number;
  },
) => void | Promise<void>;
```

Sku MUST pass the Express app as `app`.
`httpServer` MUST be the `http.Server` or `https.Server` that called `listen`.
`port` MUST be the bound port.
If `onStart` returns a promise, sku MUST await it.

#### Scenario: HTTP listen

- **WHEN** the server entry provides `onStart` and the server listens over HTTP
- **THEN** sku calls `onStart` once with the Express app and `{ httpServer, port }`
- **AND** `httpServer` is that HTTP server

#### Scenario: HTTPS listen

- **WHEN** the server entry provides `onStart` and the server listens over HTTPS
- **THEN** sku calls `onStart` once with the Express app and `{ httpServer, port }`
- **AND** `httpServer` is that HTTPS server

#### Scenario: Callback only reads the Express app

- **WHEN** `onStart` uses only its first argument
- **THEN** that argument is the Express app
- **AND** the server listens

### Requirement: onStart failure fails startup

When `onStart` throws or returns a rejected promise, sku MUST fail startup.

#### Scenario: onStart throws

- **WHEN** `onStart` throws
- **THEN** startup fails

#### Scenario: onStart rejects

- **WHEN** `onStart` returns a rejected promise
- **THEN** startup fails

### Requirement: Omitting onStart is not an error

Omitting `onStart` MUST NOT be an error.

#### Scenario: Server entry has no onStart

- **WHEN** the server entry omits `onStart`
- **THEN** the server listens

### Requirement: Hot reload does not call onStart

Sku MUST NOT call `onStart` when the server entry hot reloads.

#### Scenario: Server entry hot reload

- **WHEN** the server entry hot reloads after a successful listen
- **THEN** sku does not call `onStart`
