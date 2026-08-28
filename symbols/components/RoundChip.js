// "Duel 1 of 1 · Banana Cut": the one line that tells the viewer where they
// are. A large bordered badge (badges.md) on the stage top bar.
export const RoundChip = {
  extends: 'CkBadgeBordered',
  theme: 'badgeAlt',
  padding: 'spacing1 spacing2',
  fontSize: 'fontSm',
  gap: 'spacing1_5',
  alignSelf: 'center',
  fontVariantNumeric: 'tabular-nums',
  display: (el, s) => (s.screen === 'playing' && s.round ? 'inline-flex' : 'none'),

  RoundWord: { tag: 'span', text: '{{ roundWord | polyglot }}' },
  RoundIndex: { tag: 'span', fontWeight: '700', text: (el, s) => (s.round ? String(s.round.index) : '') },
  OfWord: { tag: 'span', text: '{{ ofWord | polyglot }}' },
  RoundCount: { tag: 'span', fontWeight: '700', text: (el, s) => (s.round ? String(s.round.count) : '') },
  Divider: { tag: 'span', text: '·', attr: { 'aria-hidden': 'true' } },
  GameTitle: { tag: 'span', fontWeight: '700', text: (el, s) => (s.game ? s.game.title : '') }
}
