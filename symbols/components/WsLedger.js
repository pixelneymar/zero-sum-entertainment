// Ledger: kind chips, the entry stream, and the audit panel beside it.
export const WsLedger = {
  display: (el, s) => ((s.ws || {}).view === 'ledger' ? 'grid' : 'none'),
  gridTemplateColumns: 'minmax(0, 3fr) minmax(18em, 2fr)',
  alignItems: 'start',
  gap: 'A',
  '@tabletS': { gridTemplateColumns: '1fr' },

  WsPanel: {
    gap: 'Y',

    PanelHead: {
      PanelTitle: { text: '{{ wsLedgerTitle | polyglot }}' },
      RowCount: {
        tag: 'span',
        fontSize: 'Z',
        fontVariantNumeric: 'tabular-nums',
        theme: 'wsDim',
        text: (el, s) => String(((s.ws || {}).ledger || []).length)
      }
    },

    Chips: {
      flow: 'x',
      align: 'center flex-start',
      gap: 'Y',
      flexWrap: 'wrap',
      childrenAs: 'state',
      children: [
        { kind: null, labelKey: 'wsKindAll' },
        { kind: 'grant', labelKey: 'wsKindGrant' },
        { kind: 'stake', labelKey: 'wsKindStake' },
        { kind: 'payout', labelKey: 'wsKindPayout' },
        { kind: 'rake', labelKey: 'wsKindRake' },
        { kind: 'refund', labelKey: 'wsKindRefund' }
      ],
      childExtends: 'WsKindChip'
    },

    Table: {
      flow: 'y',
      align: 'stretch flex-start',
      overflowX: 'auto',
      role: 'table',
      display: (el, s) => (((s.ws || {}).ledger || []).length ? 'flex' : 'none'),

      Head: {
        display: 'grid',
        gridTemplateColumns: '10em 12em 6em 6em 8em',
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
        ThAt: { tag: 'span', fontSize: 'Y', padding: '0 Z', text: '{{ wsColAt | polyglot }}' },
        ThPlayer: { tag: 'span', fontSize: 'Y', text: '{{ wsColPlayer | polyglot }}' },
        ThKind: { tag: 'span', fontSize: 'Y', text: '{{ wsColKind | polyglot }}' },
        ThAmount: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColAmount | polyglot }}' },
        ThRound: { tag: 'span', fontSize: 'Y', text: '{{ wsColRound | polyglot }}' }
      },

      Rows: {
        flow: 'y',
        align: 'stretch flex-start',
        childrenAs: 'state',
        children: (el, s) => (s.ws || {}).ledger || [],
        childExtends: 'WsLedgerRow'
      }
    },

    WsEmpty: {
      display: (el, s) => (((s.ws || {}).ledger || []).length ? 'none' : 'flex'),
      EmptyText: { text: '{{ wsLedgerEmpty | polyglot }}' }
    }
  },

  WsAuditPanel: {}
}
