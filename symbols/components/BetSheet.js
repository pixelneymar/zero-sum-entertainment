// The betting overlay (research: "notched quick-bet sheet"). Two mirrored
// panes sit in the bottom corners of the frame, one per challenger, on the
// side of the frame where that person stands; the centre column (the notch,
// x 28-72%) never carries glass, so the scales at bottom-centre stay in raw
// footage in every phase. Each pane is the challenger card plus ONE button
// whose label carries the state: "Pick Sara" -> "Place 20 chips" ->
// "Bet placed" (the other side reads "or back Ben" once a side is picked).
// At the lock frame both panes collapse to 44px pills; from the reveal on,
// each pill carries that side's reading, and the winner's pill a trophy.
// Picks go through setSide, the bet through submitBet: the server is the
// only judge. Two instances exist: the overlay (desktop) and the band under
// the video (phones); both read the root state.
//
// The side is derived from the element key (LeftPane/RightPane,
// LeftPill/RightPill): the runtime re-creates component functions from
// source, so closures are lost, and a local state delays theme functions.
const sideOf = (el) => {
  let n = el
  while (n) {
    if (n.key === 'LeftPane' || n.key === 'LeftPill') return 1
    if (n.key === 'RightPane' || n.key === 'RightPill') return 2
    n = n.parent
  }
  return 1
}
const challengerOf = (s, k) => (s.game && s.game.challengers ? s.game.challengers[k - 1] : null)
const nameOf = (s, k) => {
  const c = challengerOf(s, k)
  return c ? c.name : `Challenger ${k}`
}
const canPick = (s) => !s.myBet && (s.phase === 'preview' || s.phase === 'betting')
const expanded = (s) => s.phase === 'preview' || s.phase === 'betting'
const pillPhase = (s) => s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results'
const readingOf = (s, k) => {
  const a = s.result && s.result.attempts ? s.result.attempts.find((x) => x && x.side === k) : null
  return a ? `${Math.abs(a.offset)} ${s.result.unit} ${s.offWord || 'off'}` : ''
}

// ---- one pane -------------------------------------------------------------
export const BetPane = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'spacing2',
  pointerEvents: 'auto',
  display: (el, s) => (s.screen === 'playing' && expanded(s) ? 'flex' : 'none'),

  // The challenger card, bound to this side (childrenAs: state).
  CardSlot: {
    flow: 'y',
    align: 'stretch flex-start',
    childrenAs: 'state',
    children: (el, s) => [challengerOf(s, sideOf(el))].filter(Boolean),
    childExtends: 'ChallengerCard'
  },

  // The one commit control. Its label is the state.
  PaneButton: {
    extends: 'CkButton',
    width: '100%',
    // background/color functions, not a theme function: theme functions
    // resolve one root update late in this runtime.
    background: (el, s) => {
      const k = sideOf(el)
      if (s.myBet) return s.myBet.side === k ? 'successSoft' : 'disabled'
      return s.mySide === k ? 'brand' : 'neutralSecondaryMedium'
    },
    color: (el, s) => {
      const k = sideOf(el)
      if (s.myBet) return s.myBet.side === k ? 'fgSuccessStrong' : 'fgDisabled'
      return s.mySide === k ? 'paper' : 'body'
    },
    borderColor: (el, s) => {
      const k = sideOf(el)
      if (s.myBet) return s.myBet.side === k ? 'borderSuccessSubtle' : 'borderDefaultMedium'
      return s.mySide === k ? 'transparent' : 'paper.40'
    },
    shadow: (el, s) => (s.myBet ? 'none' : 'buttonGlint'),
    ':hover': { shadow: 'buttonGlintHover' },
    attr: {
      type: 'button',
      // Placed: the receipt stays focusable (aria-disabled, not disabled).
      'aria-disabled': (el, s) => (s.myBet || (s.phase === 'preview' && s.mySide === sideOf(el)) ? 'true' : 'false'),
      'aria-pressed': (el, s) => (!s.myBet && s.mySide === sideOf(el) ? 'true' : 'false')
    },
    cursor: (el, s) => (s.myBet ? 'default' : 'pointer'),
    onClick: (e, el, s) => {
      const k = sideOf(el)
      if (s.myBet) return
      if (s.mySide === k) {
        if (s.phase === 'betting') el.call('submitBet', k)
        return
      }
      if (canPick(s)) el.call('setSide', k)
    },

    Icon: {
      name: (el, s) => (s.myBet && s.myBet.side === sideOf(el) ? 'check' : 'radio'),
      boxSize: 'icon16',
      attr: { 'aria-hidden': 'true' },
      display: (el, s) => {
        const k = sideOf(el)
        return (s.myBet && s.myBet.side === k) || (!s.myBet && s.mySide === k) ? 'block' : 'none'
      }
    },
    Label: {
      tag: 'span',
      text: (el, s) => {
        const k = sideOf(el)
        if (s.myBet) return s.myBet.side === k ? `${s.betPlaced || 'Bet placed'} · ${s.myBet.stake} ${s.chipsUnit || 'chips'}` : s.notBacked || 'Not backed'
        if (s.mySide === k) return s.placeStake || 'Place 20 chips'
        if (s.mySide) return `${s.orBackVerb || 'or back'} ${nameOf(s, k)}`
        return `${s.pickVerb || 'Pick'} ${nameOf(s, k)}`
      }
    }
  },

  // Deadline and finality, only on the picked pane (mirrors the dial's clock).
  CloseNote: {
    tag: 'span',
    fontSize: 'fontSm',
    lineHeight: '1.3',
    fontWeight: '500',
    color: 'heading',
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
    display: (el, s) => (!s.myBet && s.mySide === sideOf(el) ? 'block' : 'none'),
    text: (el, s) => {
      const left = Math.max(0, Math.ceil(s.secondsLeft ?? 0))
      if (s.phase === 'preview') return `${s.timerPreview || 'Bets open in'} ${left} ${s.secondsUnit || 's'}`
      return `${s.closesIn || 'Closes in'} ${left} ${s.secondsUnit || 's'} · ${s.finalNote || 'Final once placed'}`
    }
  }
}

// ---- one pill (locked, reveal, results) -----------------------------------
export const PanePill = {
  display: (el, s) => (s.screen === 'playing' && pillPhase(s) ? 'inline-flex' : 'none'),
  align: 'center flex-start',
  gap: 'spacing2',
  minHeight: 'touchMin',
  maxWidth: '100%',
  padding: 'spacing1_5 spacing3',
  round: 'radiusFull',
  borderWidth: 'spacingPx',
  borderStyle: 'solid',
  backdropFilter: 'blur(1rem) saturate(1.4)',
  shadow: 'shadowLg',
  fontFamily: 'sans',
  fontSize: 'fontMd',
  lineHeight: '1.3',
  fontWeight: '500',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  pointerEvents: 'auto',
  background: (el, s) => (s.myBet && s.myBet.side === sideOf(el) ? 'brand' : 'neutralPrimary.85'),
  color: (el, s) => (s.myBet && s.myBet.side === sideOf(el) ? 'paper' : 'body'),
  borderColor: (el, s) => (s.myBet && s.myBet.side === sideOf(el) ? 'paper.30' : 'paper.10'),

  Portrait: {
    tag: 'img',
    width: 'spacing6',
    height: 'spacing6',
    flexShrink: '0',
    round: 'radiusFull',
    objectFit: 'cover',
    background: 'neutralPrimaryMedium',
    attr: {
      alt: '',
      src: (el, s) => {
        const c = challengerOf(s, sideOf(el))
        return c && c.poster ? c.poster : ''
      }
    }
  },
  LockIcon: {
    extends: 'Icon',
    name: 'lock',
    boxSize: 'icon14',
    flexShrink: '0',
    attr: { 'aria-hidden': 'true' },
    display: (el, s) => (s.phase === 'locked' ? 'block' : 'none')
  },
  Name: {
    tag: 'span',
    color: 'inherit',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    text: (el, s) => {
      const k = sideOf(el)
      const stake = s.myBet && s.myBet.side === k ? ` · ${s.myBet.stake} ${s.chipsUnit || 'chips'}` : ''
      return `${nameOf(s, k)}${stake}`
    }
  },
  // The reading, once the engine has read that side's scale (bound to revealAt).
  Reading: {
    tag: 'span',
    fontVariantNumeric: 'tabular-nums',
    color: 'inherit',
    display: (el, s) => (readingOf(s, sideOf(el)) ? 'inline' : 'none'),
    text: (el, s) => `· ${readingOf(s, sideOf(el))}`
  },
  Trophy: {
    extends: 'Icon',
    name: 'trophy',
    boxSize: 'icon16',
    flexShrink: '0',
    attr: { 'aria-hidden': 'true' },
    display: (el, s) => (s.result && s.result.winner === sideOf(el) ? 'block' : 'none')
  }
}

// ---- the sheet: overlay mode (desktop) --------------------------------------
// Panes occupy x 2-28% and 72-98% of the frame, bottom 3%; the notch between
// them (x 28-72%) is never covered. Pills share the same corners.
export const BetSheet = {
  position: 'absolute',
  inset: '0 0 0 0',
  pointerEvents: 'none',

  LeftPane: { extends: 'BetPane', position: 'absolute', left: '2%', bottom: '3%', width: '26%' },
  RightPane: { extends: 'BetPane', position: 'absolute', right: '2%', bottom: '3%', width: '26%' },
  LeftPill: { extends: 'PanePill', position: 'absolute', left: '2%', bottom: '3%', maxWidth: '26%' },
  RightPill: { extends: 'PanePill', position: 'absolute', right: '2%', bottom: '3%', maxWidth: '26%' }
}

// ---- the sheet: band mode (phones) -------------------------------------------
export const BetSheetBelow = {
  flow: 'x',
  align: 'stretch center',
  gap: 'spacing3',
  width: '100%',
  padding: 'spacing3 spacing4',
  display: (el, s) => (s.screen === 'playing' && (expanded(s) || pillPhase(s)) ? 'flex' : 'none'),

  LeftPane: { extends: 'BetPane', flex: '1', minWidth: '0' },
  RightPane: { extends: 'BetPane', flex: '1', minWidth: '0' },
  LeftPill: { extends: 'PanePill', flex: '1', minWidth: '0' },
  RightPill: { extends: 'PanePill', flex: '1', minWidth: '0' }
}

// ---- objective chip (top-left of the frame, away from the faces) ------------
export const ObjectiveChip = {
  extends: 'CkStageGlass',
  flow: 'y',
  align: 'flex-start flex-start',
  gap: 'spacing2',
  padding: 'spacing3 spacing4',
  maxWidth: '100%',
  pointerEvents: 'auto',
  display: (el, s) => (s.screen === 'playing' && expanded(s) ? 'flex' : 'none'),

  ObjectiveText: {
    tag: 'span',
    fontFamily: 'sans',
    fontSize: 'fontMd',
    lineHeight: '1.3',
    fontWeight: '500',
    color: 'heading',
    text: (el, s) => (s.game ? s.game.objectiveLine : '')
  },
  Meta: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'spacing2',
    flexWrap: 'wrap',
    TargetChip: {
      extends: 'CkBadgeLg',
      theme: 'badgeBrand',
      borderColor: 'borderBrandSubtle',
      text: (el, s) => (s.game ? s.game.targetLine : '')
    },
    StakeNote: {
      tag: 'span',
      fontSize: 'fontSm',
      lineHeight: '1.3',
      color: 'heading',
      text: (el, s) => `${s.rakeNote || ''} · ${s.finalNote || 'Final once placed'}`
    }
  }
}
