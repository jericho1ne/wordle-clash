import { useNavigate } from 'react-router';

/**
 * SCAFFOLD PLACEHOLDER. The faithful port (animated CLASH tiles, wordmark,
 * tagline, Play CTA) lands in epic 04-title-screen.
 */
export function TitleScreen() {
  const navigate = useNavigate();
  return (
    <div className="app-stage">
      <div className="app-stage__inner">
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            opacity: 0.55,
            marginBottom: 'var(--space-3)',
          }}
        >
          Multiplayer
        </div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 32,
            fontWeight: 500,
            marginBottom: 'var(--space-2)',
          }}
        >
          Wordle Clash
        </div>
        <p style={{ opacity: 0.65, marginBottom: 'var(--space-6)' }}>
          Race friends to the word. Tie for first? Settle it in a bboy dance-off.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => navigate('/setup')}
        >
          Play
        </button>
        <p style={{ fontSize: 12, opacity: 0.45, marginTop: 'var(--space-6)' }}>
          Scaffold placeholder — see docs/stories/04-title-screen.
        </p>
      </div>
    </div>
  );
}
