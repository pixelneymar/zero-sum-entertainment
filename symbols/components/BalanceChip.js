// Chip balance on the stage top bar: label, tabular value, unit.
export const BalanceChip = {
  flow: 'x',
  align: 'baseline center',
  gap: 'spacing2',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  color: 'body',

  BalanceLabel: { extends: 'CkEyebrow', text: '{{ balanceLabel | polyglot }}' },
  BalanceValue: {
    tag: 'span',
    fontFamily: 'sans',
    fontSize: 'font2xl',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '1.3',
    fontWeight: '600',
    color: 'heading',
    text: (el, s) => (s.balance ?? 0).toLocaleString('en-US')
  },
  BalanceUnit: { tag: 'span', fontSize: 'fontSm', lineHeight: '1.3', text: '{{ chipsUnit | polyglot }}' }
}
