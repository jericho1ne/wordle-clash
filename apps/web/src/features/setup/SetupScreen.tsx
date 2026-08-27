import { useNavigate, useSearchParams } from 'react-router';

/**
 * SCAFFOLD PLACEHOLDER. Name field, avatar picker, create/join segmented
 * control, and conditional room-code field land in epic 05-setup-screen.
 */
export function SetupScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const join = params.get('join');

  return (
    <div className="app-stage">
      <div className="app-stage__inner">
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Back"
          onClick={() => navigate('/')}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ‹
        </button>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 500 }}>
          Set up your player
        </div>
        <p style={{ fontSize: 12, opacity: 0.45, marginTop: 'var(--space-6)' }}>
          Scaffold placeholder — see docs/stories/05-setup-screen.
          {join ? ` Deep-link join code: ${join}` : ''}
        </p>
      </div>
    </div>
  );
}
