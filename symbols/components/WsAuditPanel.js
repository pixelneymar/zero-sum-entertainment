// Ledger audit: Σ ledger per player against the balances table, and the
// overall verdict. The source computes both numbers; this compares nothing.
export const WsAuditPanel = {
  extends: 'WsPanel',
  gap: 'Y',

  PanelHead: {
    PanelTitle: { text: '{{ wsAuditTitle | polyglot }}' },
    Verdict: {
      flow: 'x',
      align: 'center flex-end',
      gap: 'Y',
      padding: 'X Z',
      round: 'C',
      fontSize: 'Y',
      fontWeight: '800',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      color: 'white',
      background: (el, s) => {
        const a = (s.ws || {}).ledgerAudit || {}
        if (!(a.rows || []).length) return 'white.08'
        return a.allOk ? 'mint' : 'ember'
      },
      VerdictMark: {
        tag: 'span',
        text: (el, s) => {
          const a = (s.ws || {}).ledgerAudit || {}
          if (!(a.rows || []).length) return '—'
          return a.allOk ? '✓' : '✗'
        }
      },
      VerdictOk: {
        tag: 'span',
        text: '{{ wsAuditOk | polyglot }}',
        display: (el, s) => {
          const a = (s.ws || {}).ledgerAudit || {}
          return (a.rows || []).length && a.allOk ? 'inline' : 'none'
        }
      },
      VerdictFail: {
        tag: 'span',
        text: '{{ wsAuditFail | polyglot }}',
        display: (el, s) => {
          const a = (s.ws || {}).ledgerAudit || {}
          return (a.rows || []).length && !a.allOk ? 'inline' : 'none'
        }
      },
      VerdictNone: {
        tag: 'span',
        text: '{{ wsAuditEmpty | polyglot }}',
        display: (el, s) => (((s.ws || {}).ledgerAudit || {}).rows || []).length ? 'none' : 'inline'
      }
    }
  },

  Table: {
    flow: 'y',
    align: 'stretch flex-start',
    overflowX: 'auto',
    role: 'table',
    display: (el, s) => ((((s.ws || {}).ledgerAudit || {}).rows || []).length ? 'flex' : 'none'),

    Head: {
      display: 'grid',
      gridTemplateColumns: 'minmax(8em, 1.4fr) 6em 6em 3em',
      alignItems: 'center',
      gap: 'Y',
      padding: 'Y 0',
      borderBottom: '1px solid white.14',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      role: 'row',
      ThPlayer: { tag: 'span', fontSize: 'Y', padding: '0 Z', text: '{{ wsColPlayer | polyglot }}' },
      ThSum: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColLedgerSum | polyglot }}' },
      ThBalance: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColBalance | polyglot }}' },
      ThOk: { tag: 'span', fontSize: 'Y', textAlign: 'center', text: '{{ wsColOk | polyglot }}' }
    },

    Rows: {
      flow: 'y',
      align: 'stretch flex-start',
      childrenAs: 'state',
      children: (el, s) => {
        const rows = (((s.ws || {}).ledgerAudit || {}).rows || []).slice()
        rows.sort((a, b) => (a.ok === b.ok ? 0 : a.ok ? 1 : -1))
        return rows
      },
      childExtends: 'WsAuditRow'
    }
  }
}
