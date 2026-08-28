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
    description: '{{ appMetaDescription | polyglot }}',
    // Brand mark (docs/brand.md). The head generator adds type="image/png".
    icon: '/assets/brand/logo-mark-64.png'
  },

  // App bootstrap — the engine is the only writer of root state.
  onRender: (el) => el.call('startEngine'),

  // Brand face (docs/brand.md). designSystem/font.js declares the same face,
  // but the runtime hands its @font-face strings to the CSS injector as an
  // array, which the injector mangles into an empty rule (verified
  // 2026-08-28 against the served bundle; Google URLs fail too, as an
  // @import appended after other rules). A <style> in the tree is the one
  // path that reaches the browser. Remove this when font.js loads on its own.
  BrandFont: {
    tag: 'style',
    text:
      "@font-face{font-family:'darkerGrotesque';src:url('/assets/fonts/darker-grotesque-latin-wght-normal.woff2') format('woff2');font-weight:300 900;font-display:swap}"
  },

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
        if (s.phase === 'locked') return s.betsLocked || 'Bets locked'
        if (s.myBet) return s.betPlaced || 'Bet placed'
        return ''
      }
    },

    StageAlert: {
      tag: 'p',
      attr: { role: 'alert' },
      position: 'absolute',
      width: 'spacingPx',
      height: 'spacingPx',
      overflow: 'hidden',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
      margin: '0',
      text: (el, s) => {
        if (s.screen !== 'playing' || s.phase !== 'results' || !s.settlement) return ''
        if (s.settlement.voided) return s.voidTitle || 'Dead heat'
        if (!s.myBet) return s.resultKicker || 'Result'
        return s.settlement.iWon ? `${s.youWon || 'You won'} ${s.settlement.myPayout} ${s.chipsUnit || 'chips'}` : s.youLost || 'Not this time'
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
      zIndex: '3',
      theme: 'glass',
      backdropFilter: 'blur(1rem) saturate(1.4)',
      borderBottomWidth: 'spacingPx',
      borderBottomStyle: 'solid',
      borderBottomColor: 'paper.10',
      shadow: 'shadowLg',

      // Popover state is this bar's own (never root state). Esc, an outside
      // tap and the lock frame close it.
      // A local state delays function props by one root update, so the bar
      // re-renders itself on every root field the chips read.
      state: { popover: null, tick: 0 },
      stateDeps: [
        (el, s) => s.root.phase,
        (el, s) => s.root.screen,
        (el, s) => s.root.playerCount,
        (el, s) => s.root.pot,
        (el, s) => s.root.frozen,
        (el, s) => s.root.history,
        (el, s) => s.root.game
      ],
      onStateUpdate: (el, s, ctx, change) => {
        const next = change && change.next ? change.next[0] : null
        s.update({ tick: (s.tick || 0) + 1, popover: next === 'locked' ? null : s.popover })
      },
      onRender: (el, s) => {
        if (typeof document === 'undefined' || document.__zseHudPopover) return
        document.__zseHudPopover = true
        const live = () => el.state || s
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && live().popover) live().update({ popover: null })
        })
        document.addEventListener('click', () => {
          if (live().popover) live().update({ popover: null })
        })
      },

      TopLeft: {
        flow: 'x',
        align: 'center flex-start',
        gap: 'spacing3',
        flexWrap: 'wrap',
        // Brand (docs/brand.md): the same stacked wordmark as the start
        // screen, compact (owner: the lockup read too big and different).
        LogoStacked: {
          LogoImg: { width: 'auto', maxWidth: 'none', height: 'spacing10', '@tabletS': { height: 'spacing8' } }
        },
        RoundChip: {},
        DemoBadge: {},
        CrowdChip: {}
      },

      TopCentre: {
        flow: 'y',
        align: 'center center',
        gap: 'spacing2',
        PhaseTimer: {},
        ErrorBanner: {}
      },

      TopRight: {
        flow: 'x',
        align: 'center flex-end',
        gap: 'spacing3',
        flexWrap: 'wrap',
        HistoryChip: {},
        BalanceChip: {},
        SoundToggle: {},
        ExitButton: {}
      },

      // Anchored popovers holding the existing widgets.
      CrowdPopover: {},
      HistoryPopover: {}
    },

    Body: {
      tag: 'main',
      position: 'relative',
      zIndex: '1',
      flex: '1',
      minHeight: '0',
      flow: 'y',
      align: 'center flex-start',
      '@tabletS': { flex: '0 0 auto' },

      // Height-driven 16:9 box: as wide as the remaining height allows, never
      // wider than the viewport. Every overlay percentage is relative to it.
      FrameBox: {
        position: 'relative',
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: '16 / 9',
        flexShrink: '0',
        '@tabletS': { height: 'auto', width: '100%' },

        Frame: {
          position: 'absolute',
          inset: '0 0 0 0',
          background: 'videoBlack',
          borderWidth: 'spacingPx',
          borderStyle: 'solid',
          borderColor: 'paper.10',
          round: 'radiusBase',
          '@tabletS': { round: 'radiusNone', borderWidth: '0' },
          overflow: 'hidden',
          shadow: 'shadowXl',
          VideoSurface: {}
        },

        // Overlays (desktop). The notch, x 28-72% below the top band, is
        // never covered: the scales at bottom-centre stay in raw footage.
        Hud: {
          position: 'absolute',
          inset: '0 0 0 0',
          pointerEvents: 'none',
          '@tabletS': { display: 'none' },

          // Top-left slot (x 2-36%, top 3%): objective while betting, the
          // lock band at lock. Faces sit centre-top, so nothing goes there.
          TopLeftSlot: {
            position: 'absolute',
            top: '3%',
            left: '2%',
            width: '34%',
            flow: 'y',
            align: 'flex-start flex-start',
            pointerEvents: 'none',
            ObjectiveChip: {},
            LockStamp: { pointerEvents: 'auto' }
          },

          BetSheet: {},

          // Results and the session summary, centred in the y 18-74% band so
          // the scales with the deciding reading stay visible under them.
          Centre: {
            position: 'absolute',
            inset: '0 0 0 0',
            padding: '18% 0 26%',
            flow: 'y',
            align: 'center center',
            pointerEvents: 'none',
            ResultsCard: { pointerEvents: 'auto' },
            SessionSummary: { pointerEvents: 'auto' }
          }
        }
      },

      // Phones: the same sheet in a band under the footage; the video is
      // never covered.
      MobileBand: {
        display: 'none',
        '@tabletS': { display: 'flex' },
        flow: 'y',
        align: 'stretch flex-start',
        gap: 'spacing3',
        width: '100%',
        padding: '0 0 spacing20',
        BetSheetBelow: {},
        MobileLock: {
          flow: 'x',
          align: 'center center',
          padding: 'spacing2 spacing4',
          LockStamp: {}
        },
        MobileCentre: {
          flow: 'y',
          align: 'center flex-start',
          padding: 'spacing2 spacing4',
          gap: 'spacing3',
          ResultsCard: {},
          SessionSummary: {}
        }
      }
    }
  }
}
