# 07 · Username/password accounts

**Status:** in progress

## Goal

Let a guest create or access an account without requiring email delivery. The
account remains optional and never blocks the title → setup → lobby → gameplay
flow.

## Scope

- Enable Better Auth's email/password and username plugins.
- Add a unique username to the existing Better Auth `user` table.
- Preserve an anonymous player's Wordle Clash profile when Better Auth links
  that guest to a newly created credential account.
- Place equal-width Sign up and Sign in actions below Play on the title screen.
- Collect username, email, and password on account creation; accept username
  and password on sign-in. Email verification and password-reset delivery are
  deliberately out of scope until an email service exists.

## Local UI verification

At `http://localhost:5173`, open the title screen as a guest, select **Sign
up**, create an account, reload the app, then use **Sign in** with the username
and password. The player profile remains available after the account link.

## Follow-up

Epic 07 will offer an unauthenticated winner an account prompt on the terminal
results screen. Only the currently completed, explicitly claimed winning result
will become leaderboard-eligible; older guest matches remain local.
