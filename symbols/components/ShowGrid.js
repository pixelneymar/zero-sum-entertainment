export const ShowGrid = {
  extends: 'Grid',
  columns: 'repeat(auto-fill, minmax(16em, 1fr))',
  gap: 'A',
  width: '100%',

  childExtends: 'ShowCard',
  childrenAs: 'state',
  children: (el, s) => s.productions
}
