// Chip balance on the stage top bar: label, tabular value, unit.
export const BalanceChip = {
  flow: 'x',
  align: 'baseline center',
  gap: 'spacing1_5',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  color: 'body',

  BalanceLabel: { extends: 'CkEyebrow', text: '{{ balanceLabel | polyglot }}' },
  BalanceValue: {
    tag: 'span',
    fontFamily: 'mono',
    fontSize: 'font2xl',
    lineHeight: '1.3',
    fontWeight: '700',
    color: 'heading',
    text: (el, s) => (s.balance ?? 0).toLocaleString('en-US')
  },
  BalanceUnit: { tag: 'span', fontSize: 'fontSm', lineHeight: '1.3', text: '{{ chipsUnit | polyglot }}' }
}
