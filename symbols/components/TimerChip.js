export const TimerChip = {
  flow: 'x',
  align: 'center center',
  display: (el, s) =>
    s.screen === 'playing' && s.phase !== 'reveal' ? 'flex' : 'none',
  childExtends: 'TimerFace',

  TimerNormal: {
    theme: 'surface',
    display: (el, s) =>
      s.phase === 'preview' ||
      s.phase === 'results' ||
      (s.phase === 'betting' && (s.secondsLeft ?? 99) > 5)
        ? 'flex'
        : 'none',

    PreviewLabel: {
      tag: 'span',
      text: '{{ timerPreview | polyglot }}',
      fontSize: 'Z',
      fontWeight: '600',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      display: (el, s) => (s.phase === 'preview' ? 'inline' : 'none')
    },

    BettingLabel: {
      tag: 'span',
      text: '{{ timerBetting | polyglot }}',
      fontSize: 'Z',
      fontWeight: '600',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      display: (el, s) => (s.phase === 'betting' ? 'inline' : 'none')
    },

    ResultsLabel: {
      tag: 'span',
      text: '{{ timerResults | polyglot }}',
      fontSize: 'Z',
      fontWeight: '600',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      display: (el, s) => (s.phase === 'results' ? 'inline' : 'none')
    },

    SecondsValue: {
      tag: 'span',
      text: (el, s) => `${Math.max(0, Math.ceil(s.secondsLeft ?? 0))}s`,
      fontSize: 'B',
      fontWeight: '800'
    }
  },

  TimerUrgent: {
    theme: 'danger',
    display: (el, s) =>
      s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5 ? 'flex' : 'none',

    UrgentLabel: {
      tag: 'span',
      text: '{{ timerBetting | polyglot }}',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase'
    },

    UrgentSeconds: {
      tag: 'span',
      text: (el, s) => `${Math.max(0, Math.ceil(s.secondsLeft ?? 0))}s`,
      fontSize: 'B',
      fontWeight: '800'
    }
  },

  TimerLocked: {
    theme: 'locked',
    display: (el, s) => (s.phase === 'locked' ? 'flex' : 'none'),

    LockedLabel: {
      tag: 'span',
      text: '{{ timerLocked | polyglot }}',
      fontSize: 'A',
      fontWeight: '800',
      letterSpacing: 'Y',
      textTransform: 'uppercase'
    }
  }
}
