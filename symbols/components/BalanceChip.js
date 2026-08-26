export const BalanceChip = {
  flow: 'x',
  align: 'baseline center',
  gap: 'Y',
  padding: 'Y A',
  round: 'Z',
  theme: 'surface',
  border: '1px solid neutral.2',
  fontVariantNumeric: 'tabular-nums',

  BalanceLabel: {
    tag: 'span',
    text: '{{ balanceLabel | polyglot }}',
    fontSize: 'Z',
    fontWeight: '600',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    theme: 'muted'
  },

  BalanceValue: {
    tag: 'span',
    text: (el, s) => (s.balance ?? 0).toLocaleString('en-US'),
    fontSize: 'A2',
    fontWeight: '800',
    letterSpacing: '-X'
  },

  BalanceUnit: {
    tag: 'span',
    text: '{{ chipsUnit | polyglot }}',
    fontSize: 'Z',
    theme: 'muted'
  }
}
