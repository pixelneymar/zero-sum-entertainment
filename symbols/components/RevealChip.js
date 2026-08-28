// Minimal chrome while the footage plays out: your locked pick, and, once the
// first challenger's scale is read, that number, so the second attempt plays
// as a real contest. A large brand badge (badges.md): 14px, radius 10, 1px
// border-brand-subtle, with a dark badge (derived 6px radius) as the lead.
export const RevealChip = {
  display: (el, s) => (s.screen === 'playing' && s.phase === 'reveal' ? 'inline-flex' : 'none'),
  align: 'center center',
  gap: 'spacing2',
  padding: 'spacing1 spacing2 spacing1 spacing1',
  round: 'radiusDefault',
  theme: 'badgeBrand',
  borderWidth: 'spacingPx',
  borderStyle: 'solid',
  borderColor: 'borderBrandSubtle',
  fontFamily: 'sans',
  fontSize: 'fontSm',
  lineHeight: '1.3',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  attr: { role: 'status' },

  RevealBadge: {
    extends: 'CkBadge',
    theme: 'badgeDark',
    borderColor: 'transparent',
    round: 'radiusSm',
    Icon: { name: 'lock', boxSize: 'icon14', attr: { 'aria-hidden': 'true' } },
    RevealLead: { tag: 'span', text: '{{ revealWatching | polyglot }}' }
  },

  RevealYourPick: {
    tag: 'span',
    display: (el, s) => (s.myBet ? 'inline' : 'none'),
    text: (el, s) => {
      if (!s.myBet) return ''
      const c = s.game && s.game.challengers ? s.game.challengers[s.myBet.side - 1] : null
      return `${s.yourPick || 'Your pick'}: ${c ? c.name : `Challenger ${s.myBet.side}`}`
    }
  },

  FirstDivider: {
    tag: 'span',
    text: '·',
    attr: { 'aria-hidden': 'true' },
    display: (el, s) => (s.myBet && s.result && s.result.attempts && s.result.attempts[0] ? 'inline' : 'none')
  },

  FirstAttempt: {
    tag: 'span',
    fontWeight: '600',
    display: (el, s) => (s.result && s.result.attempts && s.result.attempts[0] ? 'inline' : 'none'),
    text: (el, s) => {
      const a = s.result && s.result.attempts ? s.result.attempts[0] : null
      if (!a) return ''
      const c = s.game && s.game.challengers ? s.game.challengers[a.side - 1] : null
      const name = c ? c.name : `Challenger ${a.side}`
      const readings = a.readings && a.readings.length ? `${a.readings.join(' / ')} = ` : ''
      return `${name}: ${readings}${Math.abs(a.offset)} ${s.result.unit} ${s.offWord || 'off'}`
    }
  }
}
