// Empty state for a view. Override EmptyText per use with a polyglot key.
export const WsEmpty = {
  flow: 'y',
  align: 'center center',
  gap: 'Y',
  padding: 'C A',
  round: 'A',
  border: '1px dashed white.14',
  textAlign: 'center',

  EmptyText: {
    tag: 'span',
    fontSize: 'A',
    theme: 'wsMuted'
  }
}
