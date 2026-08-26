// Integrity: one row per guarantee, status straight from the source.
export const WsIntegrity = {
  extends: 'WsPanel',
  gap: 'Y',
  display: (el, s) => ((s.ws || {}).view === 'integrity' ? 'flex' : 'none'),

  PanelHead: {
    PanelTitle: { text: '{{ wsIntegrityTitle | polyglot }}' },
    Summary: {
      flow: 'x',
      align: 'center flex-end',
      gap: 'Y',
      fontSize: 'Z',
      fontVariantNumeric: 'tabular-nums',
      theme: 'wsMuted',
      SummaryText: {
        tag: 'span',
        text: (el, s) => {
          const checks = (s.ws || {}).integrity || []
          if (!checks.length) return ''
          const pass = checks.filter((c) => c.status === 'pass').length
          const fail = checks.filter((c) => c.status === 'fail').length
          return `${pass} ✓ · ${fail} ✗ · ${checks.length - pass - fail} –`
        }
      }
    }
  },

  Table: {
    flow: 'y',
    align: 'stretch flex-start',
    overflowX: 'auto',
    role: 'table',
    display: (el, s) => (((s.ws || {}).integrity || []).length ? 'flex' : 'none'),

    Head: {
      display: 'grid',
      gridTemplateColumns: '7em minmax(10em, 1fr) minmax(12em, 2fr)',
      alignItems: 'center',
      gap: 'A',
      padding: 'Y 0',
      borderBottom: '1px solid white.14',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      role: 'row',
      ThStatus: { tag: 'span', fontSize: 'Y', text: '{{ wsColStatus | polyglot }}' },
      ThCheck: { tag: 'span', fontSize: 'Y', text: '{{ wsColCheck | polyglot }}' },
      ThDetail: { tag: 'span', fontSize: 'Y', text: '{{ wsColDetail | polyglot }}' }
    },

    Rows: {
      flow: 'y',
      align: 'stretch flex-start',
      childrenAs: 'state',
      children: (el, s) => (s.ws || {}).integrity || [],
      childExtends: 'WsIntegrityRow'
    }
  },

  WsEmpty: {
    display: (el, s) => (((s.ws || {}).integrity || []).length ? 'none' : 'flex'),
    EmptyText: { text: '{{ wsIntegrityEmpty | polyglot }}' }
  }
}
