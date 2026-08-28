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
      flow: 'x',
      align: 'center flex-end',
      gap: 'spacing4',
      BalanceChip: {},
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
  // A navy section (document theme) behind one blurred brand orb; a glass top
  // bar; the framed 16:9 video centred in the remaining space; a HUD layer
  // of stage-glass panels; and the bet dock in its own strip below.
  Stage: {
    display: (el, s) => (s.screen === 'playing' ? 'flex' : 'none'),
    flow: 'y',
    align: 'stretch flex-start',
    position: 'fixed',
    inset: '0 0 0 0',
    // Narrow viewports scroll: the footage keeps its height and the dock
    // strip sits below it instead of squeezing it to nothing.
    overflowX: 'hidden',
    overflowY: 'auto',
    theme: 'document',

    // Atmosphere behind the glass (layout.md): one blurred brand orb.
    StageOrb: {
      position: 'absolute',
      top: '-14rem',
      right: '-10rem',
      width: 'orb',
      height: 'orb',
      round: 'radiusFull',
      background: 'orbBrand',
      filter: 'blur(40px)',
      opacity: '.6',
      pointerEvents: 'none',
      attr: { 'aria-hidden': 'true' }
    },

    // Screen-reader-only: the stage h1 and one live region that is always
    // rendered (toggling role=status elements never announce).
    StageTitle: {
      tag: 'h1',
      position: 'absolute',
      width: 'spacingPx',
      height: 'spacingPx',
      overflow: 'hidden',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
      margin: '0',
      text: (el, s) => (s.game ? s.game.title : '')
    },
    StageAnnouncer: {
      tag: 'p',
      attr: { role: 'status', 'aria-live': 'polite' },
      position: 'absolute',
      width: 'spacingPx',
      height: 'spacingPx',
      overflow: 'hidden',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
      margin: '0',
      text: (el, s) => {
        if (s.screen !== 'playing') return ''
        if (s.phase === 'results' && s.settlement) {
          if (s.settlement.voided) return s.voidTitle || 'Dead heat'
          if (!s.myBet) return s.resultKicker || 'Result'
          return s.settlement.iWon ? `${s.youWon || 'You won'} ${s.settlement.myPayout} ${s.chipsUnit || 'chips'}` : s.youLost || 'Not this time'
        }
        if (s.phase === 'locked') return s.betsLocked || 'Bets locked'
        if (s.myBet) return s.betPlaced || 'Bet placed'
        return ''
      }
    },

    TopBar: {
      tag: 'header',
      flexShrink: '0',
      display: 'grid',
      columns: '1fr auto 1fr',
      alignItems: 'center',
      gap: 'spacing4',
      padding: 'spacing3 spacing6',
      '@tabletS': { padding: 'spacing3 spacing4' },
      position: 'relative',
      zIndex: '1',
      theme: 'glass',
      backdropFilter: 'blur(1rem) saturate(1.4)',
      borderBottomWidth: 'spacingPx',
      borderBottomStyle: 'solid',
      borderBottomColor: 'paper.10',
      shadow: 'shadowLg',

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
      tag: 'main',
      position: 'relative',
      zIndex: '1',
      flex: '1',
      minHeight: '0',
      flow: 'y',
      align: 'stretch flex-start',

      // The footage. Nothing that belongs to betting sits on it: the dock
      // lives in its own strip below, so the cut and the scales stay visible.
      Screen: {
        position: 'relative',
        flex: '1',
        minHeight: '0',
        flow: 'y',
        align: 'center center',
        '@tabletS': { flex: '0 0 auto', minHeight: '56.25vw' },

        // Height-driven 16:9 frame: as wide as the screen height allows,
        // never wider than the viewport (then the footage letterboxes inside).
        Frame: {
          height: '100%',
          width: 'auto',
          maxWidth: '100%',
          aspectRatio: '16 / 9',
          background: 'videoBlack',
          borderWidth: 'spacingPx',
          borderStyle: 'solid',
          borderColor: 'paper.10',
          round: 'radiusBase',
          shadow: 'shadowXl',
          overflow: 'hidden',
          VideoSurface: {}
        },

        // HUD layer over the footage: side rails and the centred status panels.
        Hud: {
          position: 'absolute',
          inset: '0 0 0 0',
          pointerEvents: 'none',

          // Narrow viewports: the crowd widget moves into the dock strip.
          LeftRail: {
            position: 'absolute',
            left: 'spacing6',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
            '@tabletS': { display: 'none' },
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

          // The lock stamp sits at the top of the frame, away from the scales.
          Top: {
            position: 'absolute',
            top: 'spacing6',
            left: '0',
            right: '0',
            flow: 'y',
            align: 'center flex-start',
            pointerEvents: 'none',
            LockStamp: { pointerEvents: 'auto' }
          },

          Centre: {
            position: 'absolute',
            inset: '0 0 0 0',
            flow: 'y',
            align: 'center center',
            pointerEvents: 'none',
            ResultsCard: { pointerEvents: 'auto' },
            SessionSummary: { pointerEvents: 'auto' }
          }
        }
      },

      // Bet dock strip, separate from the footage. 80px bottom clearance keeps
      // the fixed TypeUI panel off the PLACE BET row.
      DockStrip: {
        flexShrink: '0',
        flow: 'y',
        align: 'center flex-start',
        gap: 'spacing3',
        // Always present, so the 80px clearance also keeps the fixed TypeUI
        // panel off the footage while the duel plays out.
        padding: 'spacing3 spacing6 spacing20',
        '@tabletS': { padding: 'spacing3 spacing4 spacing20' },

        MobileCrowd: {
          display: 'none',
          '@tabletS': { display: 'block' },
          width: 'dock',
          maxWidth: '100%',
          // Compact: head + stats only.
          CrowdPanel: {
            width: '100%',
            theme: 'glass',
            display: (el, s) => (s.screen === 'playing' && s.phase !== 'ended' ? 'flex' : 'none'),
            Ticker: { display: 'none' },
            FrozenNote: { display: 'none' }
          }
        },
        BetPanel: { maxWidth: '100%' }
      }
    }
  }
}
