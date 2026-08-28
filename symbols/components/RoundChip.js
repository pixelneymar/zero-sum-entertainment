// "Duel 1 of 1 · Banana Cut": the one line that tells the viewer where they
// are. A large bordered badge (badges.md) on the stage top bar.
export const RoundChip = {
  extends: 'CkBadgeLg',
  theme: 'badgeAlt',
  padding: 'spacing1 spacing2',
  fontSize: 'fontSm',
  alignSelf: 'center',
  fontVariantNumeric: 'tabular-nums',
  display: (el, s) => (s.screen === 'playing' && s.round ? 'inline-flex' : 'none'),

  RoundWord: { tag: 'span', text: '{{ roundWord | polyglot }}' },
  RoundIndex: { tag: 'span', fontWeight: '600', text: (el, s) => (s.round ? String(s.round.index) : '') },
  // "of N" only when the count carries information (server rounds have none).
  OfWord: { tag: 'span', text: '{{ ofWord | polyglot }}', display: (el, s) => (s.round && s.round.count > 1 ? 'inline' : 'none') },
  RoundCount: { tag: 'span', fontWeight: '600', display: (el, s) => (s.round && s.round.count > 1 ? 'inline' : 'none'), text: (el, s) => (s.round && s.round.count > 1 ? String(s.round.count) : '') },
  Divider: { tag: 'span', text: '·', attr: { 'aria-hidden': 'true' } },
  GameTitle: { tag: 'span', fontWeight: '600', text: (el, s) => (s.game ? s.game.title : '') }
}
