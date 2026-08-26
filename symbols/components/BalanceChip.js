export const BalanceChip = {
  flow: 'x',
  align: 'baseline center',
  gap: 'Y',
  padding: 'Y A',
  round: 'C',
  theme: 'glass',
  border: '1px solid white.12',
  shadow: 'glass',
  backdropFilter: 'blur(1.1rem)',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',

  BalanceLabel: {
    tag: 'span',
    text: '{{ balanceLabel | polyglot }}',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    theme: 'onVideoMuted'
  },

  BalanceValue: {
    tag: 'span',
    text: (el, s) => (s.balance ?? 0).toLocaleString('en-US'),
    fontSize: 'B',
    fontWeight: '800',
    letterSpacing: '-X'
  },

  BalanceUnit: {
    tag: 'span',
    text: '{{ chipsUnit | polyglot }}',
    fontSize: 'Z',
    theme: 'onVideoMuted'
  }
}
