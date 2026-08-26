// Sortable column header. Child state: { key, labelKey, align }. The
// table's own state (the parent) holds sortKey / sortDir.
export const WsSortTh = {
  tag: 'button',
  fontFamily: 'inherit',
  flow: 'x',
  align: 'center flex-start',
  gap: 'X',
  padding: 'Y Z',
  border: 'none',
  background: 'transparent',
  fontSize: 'Y',
  fontWeight: '700',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  minWidth: '0',
  role: 'columnheader',
  justifyContent: (el, s) => (s.align === 'end' ? 'flex-end' : 'flex-start'),
  color: (el, s) => (s.parent.sortKey === s.key ? 'white' : 'haze'),
  ':hover': { color: 'white' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '-2px' },
  onClick: (e, el, s) => {
    const same = s.parent.sortKey === s.key
    s.parent.update({ sortKey: s.key, sortDir: same ? -(s.parent.sortDir || -1) : -1 })
  },

  ThLabel: { tag: 'span', text: (el, s) => s.root[s.labelKey] || s.labelKey },
  ThArrow: {
    tag: 'span',
    text: (el, s) => ((s.parent.sortDir || -1) < 0 ? '▾' : '▴'),
    display: (el, s) => (s.parent.sortKey === s.key ? 'inline' : 'none')
  }
}
