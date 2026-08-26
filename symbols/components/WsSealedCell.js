// A guess that the source has not revealed yet. Staff see the seal too.
export const WsSealedCell = {
  flow: 'x',
  align: 'center flex-start',
  gap: 'X',
  fontSize: 'Z',
  fontWeight: '700',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  theme: 'wsMuted',
  whiteSpace: 'nowrap',

  Icon: { name: 'lock', boxSize: 'Z', color: 'haze' },
  SealedText: { tag: 'span', text: '{{ wsSealed | polyglot }}' }
}
