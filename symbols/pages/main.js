// Layout owner. Components are position-agnostic; this page decides where
// each one sits over the footage. The stage is a fixed full-bleed canvas: a
// blurred still as backdrop, the 16:9 video letterboxed in the middle, scrims
// for legibility, and a HUD layer of glass panels on top.
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

  // App bootstrap — the engine is the only writer of root state.
  onRender: (el) => el.call('startEngine'),

  // ---- start screen -------------------------------------------------------
  Picker: {
    position: 'relative',
    display: (el, s) => (s.screen === 'picker' ? 'flex' : 'none'),
    flow: 'y',
    align: 'center center',
    width: '100%',
    minHeight: '100vh',
    padding: 'C',
    gap: 'B',

    PickerBadge: {
      position: 'absolute',
      top: 'B',
      right: 'B',
      DemoBadge: {}
    },

    // Data-layer failures must be visible on every screen.
    ErrorBanner: {},
    GamePicker: {}
  },

  // ---- the stage ----------------------------------------------------------
  Stage: {
    display: (el, s) => (s.screen === 'playing' ? 'block' : 'none'),
    position: 'fixed',
    inset: '0 0 0 0',
    overflow: 'hidden',
    background: 'ink',
    color: 'white',

    StageBackdrop: {},

    Frame: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(100vw, calc(100vh * 16 / 9))',
      aspectRatio: '16 / 9',
      VideoSurface: {}
    },

    ScrimTop: {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      height: 'F',
      background: 'scrimTop',
      pointerEvents: 'none'
    },

    ScrimBottom: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      height: 'G',
      background: 'scrimBottom',
      pointerEvents: 'none',
      transition: 'B defaultBezier',
      transitionProperty: 'opacity',
      opacity: (el, s) => (s.phase === 'reveal' ? '.35' : '1')
    },

    Hud: {
      position: 'absolute',
      inset: '0 0 0 0',
      pointerEvents: 'none',

      TopBar: {
        position: 'absolute',
        top: 'B',
        left: 'B',
        right: 'B',
        display: 'grid',
        columns: '1fr auto 1fr',
        alignItems: 'start',
        gap: 'A',

        TopLeft: {
          flow: 'x',
          align: 'center flex-start',
          gap: 'Y',
          flexWrap: 'wrap',
          pointerEvents: 'auto',
          RoundChip: {},
          DemoBadge: {}
        },

        TopCentre: {
          flow: 'y',
          align: 'center center',
          gap: 'Y',
          pointerEvents: 'auto',
          PhaseTimer: {},
          RevealChip: {},
          ErrorBanner: {}
        },

        TopRight: {
          flow: 'x',
          align: 'center flex-end',
          gap: 'Y',
          pointerEvents: 'auto',
          BalanceChip: {},
          ExitButton: {}
        }
      },

      LeftRail: {
        position: 'absolute',
        left: 'B',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'auto',
        CrowdPanel: {}
      },

      RightRail: {
        position: 'absolute',
        right: 'B',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'auto',
        '@tabletS': { display: 'none' },
        HistoryPanel: {}
      },

      BottomDock: {
        position: 'absolute',
        bottom: 'B',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        BetPanel: {}
      },

      Centre: {
        position: 'absolute',
        inset: '0 0 0 0',
        flow: 'y',
        align: 'center center',
        pointerEvents: 'none',
        LockStamp: { pointerEvents: 'auto' },
        ResultsCard: { pointerEvents: 'auto' },
        SessionSummary: { pointerEvents: 'auto' }
      }
    }
  }
}
