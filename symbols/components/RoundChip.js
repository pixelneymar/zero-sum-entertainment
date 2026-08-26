// "Round 1 of 2 · Banana Cut" — the one line that tells the viewer where they
// are. During the cold open it becomes the intro cue ("— watch").
export const RoundChip = {
  flow: 'x',
  align: 'baseline flex-start',
  gap: 'Y',
  padding: 'Y A',
  round: 'C',
  theme: 'glass',
  border: '1px solid white.12',
  shadow: 'glass',
  backdropFilter: 'blur(1.1rem)',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  display: (el, s) => (s.screen === 'playing' && s.round ? 'flex' : 'none'),

  RoundWord: {
    tag: 'span',
    text: '{{ roundWord | polyglot }}',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    theme: 'onVideoMuted'
  },

  RoundIndex: {
    tag: 'span',
    text: (el, s) => (s.round ? String(s.round.index) : ''),
    fontSize: 'B',
    fontWeight: '800',
    letterSpacing: '-X'
  },

  OfWord: {
    tag: 'span',
    text: '{{ ofWord | polyglot }}',
    fontSize: 'Z',
    theme: 'onVideoMuted'
  },

  RoundCount: {
    tag: 'span',
    text: (el, s) => (s.round ? String(s.round.count) : ''),
    fontSize: 'B',
    fontWeight: '800',
    letterSpacing: '-X'
  },

  Divider: {
    tag: 'span',
    text: '·',
    fontSize: 'Z',
    theme: 'onVideoMuted'
  },

  GameTitle: {
    tag: 'span',
    text: (el, s) => (s.game ? s.game.title : ''),
    fontSize: 'A',
    fontWeight: '600'
  },

  WatchCue: {
    tag: 'span',
    text: '{{ introWatch | polyglot }}',
    fontSize: 'A',
    fontWeight: '600',
    color: 'gold',
    display: (el, s) => (s.phase === 'intro' ? 'inline' : 'none')
  }
}
