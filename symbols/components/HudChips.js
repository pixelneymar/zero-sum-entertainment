// Top-bar chips (research: crowd and history leave the frame). Each is a
// 44px button that toggles an anchored popover holding the existing widget.
// The open state lives on the TopBar (component-local, never root state);
// Esc, an outside tap or the lock frame close it.
const frozenPhase = (s) => s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results'
const lastResult = (s) => {
  const h = (s.history || []).filter((x) => !s.game || x.gameSlug === s.game.slug)
  if (!h.length) return null
  return h.reduce((a, b) => (b.roundIndex > a.roundIndex ? b : a))
}

export const HudChip = {
  extends: 'CkButtonSecondary',
  padding: 'spacing2 spacing3',
  gap: 'spacing2',
  fontVariantNumeric: 'tabular-nums',
  attr: { type: 'button', 'aria-haspopup': 'dialog' }
}

// s here is the TopBar state ({ popover }); the app state is s.root.
export const CrowdChip = {
  extends: 'HudChip',
  display: (el, s) => (s.root.screen === 'playing' && s.root.phase !== 'ended' ? 'inline-flex' : 'none'),
  attr: { 'aria-label': 'Crowd', 'aria-expanded': (el, s) => (s.popover === 'crowd' ? 'true' : 'false') },
  onClick: (e, el, s) => {
    e.stopPropagation()
    s.update({ popover: s.popover === 'crowd' ? null : 'crowd' })
  },

  LiveDot: {
    tag: 'span',
    width: 'dot',
    height: 'dot',
    flexShrink: '0',
    round: 'radiusFull',
    background: 'fgBrand',
    animation: 'livePulse 1.4s ease-in-out infinite',
    '@reducedMotion': { animation: 'none' },
    attr: { 'aria-hidden': 'true' },
    display: (el, s) => (frozenPhase(s.root) ? 'none' : 'block')
  },
  LockIcon: { extends: 'Icon', name: 'lock', boxSize: 'icon16', attr: { 'aria-hidden': 'true' }, display: (el, s) => (frozenPhase(s.root) ? 'block' : 'none') },
  Users: { extends: 'Icon', name: 'users', boxSize: 'icon16', attr: { 'aria-hidden': 'true' } },
  Count: {
    tag: 'span',
    text: (el, s) => {
      const r = s.root
      const f = r.frozen && frozenPhase(r)
      const players = f ? r.frozen.playerCount : r.playerCount
      const pot = f ? r.frozen.pot : r.pot
      return `${(players ?? 0).toLocaleString('en-US')} · ${(pot ?? 0).toLocaleString('en-US')} ${r.chipsUnit || 'chips'}`
    }
  }
}

export const HistoryChip = {
  extends: 'HudChip',
  display: (el, s) => (s.root.screen === 'playing' && s.root.phase !== 'ended' ? 'inline-flex' : 'none'),
  attr: { 'aria-label': 'History', 'aria-expanded': (el, s) => (s.popover === 'history' ? 'true' : 'false') },
  onClick: (e, el, s) => {
    e.stopPropagation()
    s.update({ popover: s.popover === 'history' ? null : 'history' })
  },

  Icon: { name: 'history', boxSize: 'icon16', attr: { 'aria-hidden': 'true' } },
  Last: {
    tag: 'span',
    text: (el, s) => {
      const r = s.root
      const h = lastResult(r)
      if (!h) return r.historyEmpty || 'No rounds yet'
      if (h.winner === 0) return r.deadHeat || 'Dead heat'
      const c = r.game && r.game.challengers ? r.game.challengers[h.winner - 1] : null
      return c ? c.name : `Challenger ${h.winner}`
    }
  }
}

// Anchored popovers under the bar, clamped to the outer columns.
export const HudPopover = {
  position: 'absolute',
  top: '100%',
  marginTop: 'spacing2',
  zIndex: '4',
  pointerEvents: 'auto',
  attr: { role: 'dialog' },
  onClick: (e) => e.stopPropagation()
}

export const CrowdPopover = {
  extends: 'HudPopover',
  left: 'spacing6',
  '@tabletS': { left: 'spacing4', right: 'spacing4' },
  display: (el, s) => (s.popover === 'crowd' ? 'block' : 'none'),
  CrowdPanel: { '@tabletS': { width: '100%' } }
}

export const HistoryPopover = {
  extends: 'HudPopover',
  right: 'spacing6',
  '@tabletS': { left: 'spacing4', right: 'spacing4' },
  display: (el, s) => (s.popover === 'history' ? 'block' : 'none'),
  HistoryPanel: { '@tabletS': { width: '100%' } }
}
