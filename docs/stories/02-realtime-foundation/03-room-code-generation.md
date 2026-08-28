# Story 02-03 — Room-code generation

**Status:** done, pending review  
**Branch:** `test/02-03-room-code-generation`

## Goal

Lock down the existing shared room-code module before create/join reservations
make those codes externally observable.

## Implementation

- Covered canonical `LLLL-DDDD` generation and length.
- Covered the full letter/digit range and the no-`I`/`O` alphabet.
- Covered case-insensitive free-form normalization, partial input, punctuation
  stripping, dash insertion, and maximum length.
- Covered rejection of ambiguous letters and malformed canonical codes.

## Verification

- `pnpm --filter @wordle-clash/shared test`
