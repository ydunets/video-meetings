---
paths:
  - 'apps/web/src/app/**/route.ts'
  - 'apps/web/src/proxy.ts'
---

# Route Handlers and the proxy

Route Handlers carry the requests that Server Actions cannot: bodies over the
1 MB Server Action limit and streamed downloads. They call the API server to
server, because the API does not enable CORS.

## Route Handlers

- Read the session with `findAccessToken()` (`@/lib/session`). Without a
  token, answer `new Response(null, { status: HTTP_STATUS.UNAUTHORIZED })`.
- Type the second argument as `RouteContext<'/meetings/[id]/files'>` and
  await `context.params`.
- Build the API URL from `getApiUrl()` and an endpoint builder in
  `@/lib/api` (`getMeetingFilesEndpoint`), and send
  `Authorization: buildBearerAuthorization(accessToken)`.
- Stream in both directions: pass `request.body` with `duplex: 'half'`, return
  `apiResponse.body` without buffering it, and forward
  `signal: request.signal` so an aborted browser request aborts the API call.
- Header names are named constants (`CONTENT_TYPE_HEADER`). Which headers each
  existing handler copies, and how it relays errors, is described in
  `apps/web/CLAUDE.md` (uploads and downloads).

## Proxy

- A route matched by the proxy has its request body buffered and truncated at 10 MB
  (the Next.js default of `proxyClientMaxBodySize`, which `next.config.ts`
  does not set), so the matcher must never cover a Route Handler.
  The upload e2e test sends an 11 MB file to catch that.
