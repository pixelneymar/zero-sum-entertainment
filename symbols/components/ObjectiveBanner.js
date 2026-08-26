export const ObjectiveBanner = {
  flow: 'y',
  align: 'center center',
  gap: 'X',
  padding: 'Y B',
  round: 'Z',
  theme: 'surface',
  border: '1px solid neutral.2',
  textAlign: 'center',
  display: (el, s) =>
    s.screen === 'playing' && (s.phase === 'preview' || s.phase === 'betting')
      ? 'flex'
      : 'none',

  ObjectiveKicker: {
    tag: 'span',
    text: '{{ objectiveKicker | polyglot }}',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'Y',
    textTransform: 'uppercase',
    color: 'brand'
  },

  ObjectiveText: {
    tag: 'p',
    text: (el, s) => (s.game ? s.game.objectiveLine : ''),
    fontSize: 'B',
    lineHeight: 'B',
    fontWeight: '600',
    letterSpacing: '-X',
    margin: '0'
  },

  RakeNote: {
    tag: 'span',
    text: '{{ rakeNote | polyglot }}',
    fontSize: 'Z',
    theme: 'muted'
  }
}
