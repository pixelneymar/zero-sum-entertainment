export const main = {
  extends: 'Page',
  position: 'relative',
  flow: 'y',
  width: '100%',
  minHeight: '100vh',
  overflow: 'hidden',
  theme: 'document',

  metadata: {
    title: '{{ appMetaTitle | polyglot }}',
    description: '{{ appMetaDescription | polyglot }}'
  },

  // App bootstrap: signs in anonymously (ensure_profile), measures the server
  // clock, loads the balance, and starts the 250ms display tick. Idempotent —
  // engineStart no-ops when the tick loop is already running.
  onRender: (el) => el.call('startEngine'),

  // ---- start screen -------------------------------------------------------
  Picker: {
    display: (el, s) => (s.screen === 'picker' ? 'flex' : 'none'),
    flow: 'y',
    align: 'center center',
    width: '100%',
    minHeight: '100vh',
    padding: 'C',
    gap: 'B',

    // Data-layer failures must be visible on every screen — a silently
    // failing data layer is exactly what this banner exists to prevent.
    ErrorBanner: {},
    GamePicker: {}
  },

  // ---- betting stage ------------------------------------------------------
  Stage: {
    display: (el, s) => (s.screen === 'playing' ? 'block' : 'none'),
    position: 'relative',
    width: '100%',
    minHeight: '100vh',

    Surface: {
      tag: 'video',
      position: 'absolute',
      inset: '0 0 0 0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      attr: {
        playsinline: 'true',
        preload: 'auto',
        muted: 'true'
      },
      src: (el, s) => (s.game ? `/videos/${s.game.slug === 'water_200g' ? 'water' : 'banana'}.mov` : null)
    },

    Scrim: {
      position: 'absolute',
      inset: '0 0 0 0',
      background: 'rgba(0,0,0,.42)'
    },

    TopLeft: {
      position: 'absolute',
      top: 'B',
      left: 'B',
      flow: 'y',
      gap: 'Y',
      CrowdCounter: {}
    },

    TopCentre: {
      position: 'absolute',
      top: 'B',
      left: '50%',
      transform: 'translateX(-50%)',
      flow: 'y',
      align: 'center center',
      gap: 'Y',
      TimerChip: {},
      ObjectiveBanner: {}
    },

    TopRight: {
      position: 'absolute',
      top: 'B',
      right: 'B',
      BalanceChip: {}
    },

    RightRail: {
      position: 'absolute',
      top: '30%',
      right: 'B',
      HistoryPanel: {}
    },

    BottomCentre: {
      position: 'absolute',
      bottom: 'B',
      left: '50%',
      transform: 'translateX(-50%)',
      flow: 'y',
      align: 'center center',
      gap: 'Y',
      ErrorBanner: {},
      BetPanel: {}
    },

    Centre: {
      display: (el, s) => (s.phase === 'results' ? 'flex' : 'none'),
      position: 'absolute',
      inset: '0 0 0 0',
      align: 'center center',
      ResultsCard: {}
    }
  }
}
