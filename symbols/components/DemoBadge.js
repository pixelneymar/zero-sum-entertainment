// Product requirement (docs/decisions.md O2): a simulated crowd must be
// labelled. Visible for the whole session whenever state.mode === 'demo'.
// Warning-intent badge with a status dot (badges.md "with dot"); the text
// label is the non-colour cue.
export const DemoBadge = {
  extends: 'CkBadgeBordered',
  theme: 'badgeWarning',
  padding: 'spacing1 spacing2',
  fontSize: 'fontSm',
  gap: 'spacing1_5',
  alignSelf: 'center',
  display: (el, s) => (s.mode === 'demo' ? 'inline-flex' : 'none'),

  DemoDot: {
    tag: 'span',
    width: 'dot',
    height: 'dot',
    flexShrink: '0',
    round: 'radiusFull',
    background: 'fgWarning',
    attr: { 'aria-hidden': 'true' }
  },
  DemoLabel: { tag: 'span', text: '{{ demoBadge | polyglot }}' }
}
