# 03 · WebSocket ticket auth

**Status:** done (pending review)

**Branch:** `feat/03-03-ws-ticket-auth` (stack layer 1)

## Done

- Added cookie-authenticated `POST /api/rt/ticket`.
- Added 60-second HS256 JWTs containing only `sub`, `name`, `avatarId`, and
  `isAnon`, signed with the independent `RT_TICKET_SECRET`.
- Added strict signature, issuer, audience, algorithm, expiration, and claim
  validation at the Worker WebSocket boundary.
- Removes the ticket query parameter before forwarding and injects trusted
  `x-user-id`, `x-user-name`, `x-user-avatar`, and `x-user-is-anonymous` headers.
- Added `getRealtimeTicketQuery()` for the later PartySocket wrapper to request a
  fresh ticket for every connection and reconnect.
- Added focused JWT round-trip, tampering, and expiration tests.

## Trust boundary

The `Room` Durable Object is reachable only through the Worker binding. It trusts
the injected identity headers because public WebSocket requests cannot address
the Durable Object directly and the Worker replaces those headers after ticket
verification.

## Verification

- No session → ticket endpoint returns `401`.
- Active anonymous session → ticket endpoint returns `200` with `expiresIn: 60`.
- Missing, tampered, or expired tickets are rejected before the Durable Object.
- A valid ticket reaches the `Room` stub without appearing in the forwarded URL.
- Full repository verification remains pending review.
