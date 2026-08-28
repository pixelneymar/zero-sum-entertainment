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
    align: 'stretch flex-start',
    width: '100%',
    minHeight: '100vh',

    PickerBadge: {
      position: 'absolute',
      top: 'spacing6',
      right: 'spacing6',
      DemoBadge: {}
    },

    // Data-layer failures must be visible on every screen.
    ErrorSlot: {
      width: '100%',
      maxWidth: 'containerMax',
      margin: '0 auto',
      padding: 'spacing4 spacing6 0',
      '@tabletS': { padding: 'spacing4 spacing4 0' },
      ErrorBanner: {}
    },
    GamePicker: {}
  },

  // Required by the TypeUI MCP workspace setting (see TypeuiPanel.js).
  TypeuiPanel: {},

  // ---- the stage ----------------------------------------------------------
  // A lime section (document theme) with the grid texture; a flush beige top
  // bar (TypeUI section 3, application navbar); the framed 16:9 video centred
  // in the remaining space; and a HUD layer of raised cards on top.
  Stage: {
    display: (el, s) => (s.screen === 'playing' ? 'flex' : 'none'),
    flow: 'y',
    align: 'stretch flex-start',
    position: 'fixed',
    inset: '0 0 0 0',
    overflow: 'hidden',
    theme: 'document',
    backgroundImage: 'gridTexture',
    backgroundSize: '2rem 2rem',
    backgroundPosition: 'left top',

    TopBar: {
      tag: 'header',
      flexShrink: '0',
      display: 'grid',
      columns: '1fr auto 1fr',
      alignItems: 'center',
      gap: 'spacing4',
      padding: 'spacing3 spacing6',
      '@tabletS': { padding: 'spacing3 spacing4' },
      theme: 'raised',
      borderBottomWidth: 'spacing0_5',
      borderBottomStyle: 'solid',
      borderBottomColor: 'borderDefault',

      TopLeft: {
        flow: 'x',
        align: 'center flex-start',
        gap: 'spacing3',
        flexWrap: 'wrap',
        RoundChip: {},
        DemoBadge: {}
      },

      TopCentre: {
        flow: 'y',
        align: 'center center',
        gap: 'spacing2',
        PhaseTimer: {},
        RevealChip: {},
        ErrorBanner: {}
      },

      TopRight: {
        flow: 'x',
        align: 'center flex-end',
        gap: 'spacing4',
        flexWrap: 'wrap',
        BalanceChip: {},
        SoundToggle: {},
        ExitButton: {}
      }
    },

    Body: {
      position: 'relative',
      flex: '1',
      minHeight: '0',
      flow: 'y',
      align: 'center center',

      // Height-driven 16:9 frame: as wide as the body height allows, never
      // wider than the viewport (then the footage letterboxes inside).
      Frame: {
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: '16 / 9',
        background: 'darkStrong',
        borderWidth: 'spacing0_5',
        borderStyle: 'solid',
        borderColor: 'borderDefault',
        round: 'radiusXxl',
        overflow: 'hidden',
        VideoSurface: {}
      },

      // HUD layer over the video body only; the top bar is not covered.
      Hud: {
      position: 'absolute',
      inset: '0 0 0 0',
      pointerEvents: 'none',

      // Narrow viewports: the crowd widget moves into the dock (below).
      LeftRail: {
        position: 'absolute',
        left: 'spacing6',
        '@tabletS': { display: 'none' },
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'auto',
        CrowdPanel: {}
      },

      RightRail: {
        position: 'absolute',
        right: 'spacing6',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'auto',
        '@tabletS': { display: 'none' },
        HistoryPanel: {}
      },

      // 80px from the bottom so the fixed TypeUI panel never covers the dock.
      BottomDock: {
        position: 'absolute',
        bottom: 'spacing20',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        flow: 'y',
        align: 'center flex-end',
        gap: 'spacing3',
        width: 'dock',
        maxWidth: '94vw',
        MobileCrowd: {
          display: 'none',
          '@tabletS': { display: 'block' },
          width: '100%',
          // Compact: head + stats only, so the stack clears the top bar.
          CrowdPanel: {
            width: '100%',
            display: (el, s) => (s.screen === 'playing' && s.phase !== 'ended' ? 'flex' : 'none'),
            Ticker: { display: 'none' },
            FrozenNote: { display: 'none' }
          }
        },
        BetPanel: { width: '100%' }
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
}
