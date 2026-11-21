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
- Copy only the response headers the browser needs (`Content-Type`,
  `Content-Length`, `Content-Disposition`, `X-Content-Type-Options`), as named
  constants.
- Relay an API error message unchanged where the UI shows it (413, 415). For a
  missing or foreign resource (`isMissingResourceStatus`), answer 404 without a
  body.

## Proxy

- The `matcher` in `src/proxy.ts` lists `/`, `/meetings/:id` and `/profile`
  only, as literal strings: Next.js reads it statically and ignores variables.
- A matched route has its request body buffered and truncated at 10 MB
  (`proxyClientMaxBodySize`), so the matcher must never cover a Route Handler.
  The upload e2e test sends an 11 MB file to catch that.
