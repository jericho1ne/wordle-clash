# Guess submission flow

The Room Durable Object validates, evaluates, and persists every accepted guess
before the UI receives authoritative tile feedback. D1 is not part of this hot
path; it receives account-owned match history after the match ends.

```mermaid
sequenceDiagram
    autonumber

    actor Player
    participant UI as Web UI
    participant Room as Room Durable Object
    participant Storage as Durable Object Storage
    participant Peers as Other Players
    participant D1 as D1 Match History

    Player->>UI: Submit five-letter guess
    UI->>UI: Show letters as pending
    UI->>Room: WebSocket: submitGuess

    Room->>Room: Validate player and match state
    Room->>Room: Validate five-letter format

    alt Guess rejected
        Room-->>UI: WebSocket: error
        UI->>UI: Unlock input and show error
    else Guess accepted
        Room->>Room: Compare guess with secret answer
        Room->>Room: Calculate five tile states
        alt Synchronous mode
            Room->>Room: Lock private submission for current round
            Room-->>UI: WebSocket: guessAccepted
            Note over Room: Reveal after all active players submit,<br/>or deadline + 400ms network grace
        else Real-time mode
            Room->>Room: Record guess and increment guesses used
        end

        alt Correct guess
            Room->>Room: Declare winner and end match
        else Final incorrect guess
            Room->>Room: Eliminate this player

            alt Every player is eliminated
                Room->>Room: End match with no winner
            end
        else Incorrect with guesses remaining
            Room->>Room: Keep player active
        end

        Room->>Storage: Persist authoritative match state
        Storage-->>Room: Persistence confirmed

        Room-->>UI: WebSocket: sanitized matchState
        UI->>UI: Render correct, present, and absent colors

        opt Opponent progress is visible
            Room-->>Peers: WebSocket: sanitized matchState
        end

        opt Match ended
            Room-->>UI: WebSocket: terminal matchState
            Room-->>Peers: WebSocket: terminal matchState
            UI->>UI: Show winner or no-winner result
            Note over Room,D1: Account match-history persistence is deferred
        end
    end
```
