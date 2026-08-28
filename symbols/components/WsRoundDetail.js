// Round detail: header with the winner and each attempt's reading, the
// crowd split with the winning side marked, and the bet list. Pre-reveal
// rows are sealed by the source; this view never fills them in.
export const WsRoundDetail = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'A',
  display: (el, s) => ((s.ws || {}).view === 'round' ? 'flex' : 'none'),

  BackRow: {
    flow: 'x',
    align: 'center flex-start',
    WsButton: {
      onClick: (e, el) => el.call('wsOpen', 'rounds'),
      BackLabel: { tag: 'span', text: '{{ wsBackToRounds | polyglot }}' }
    }
  },

  WsEmpty: {
    display: (el, s) => ((s.ws || {}).roundDetail ? 'none' : 'flex'),
    EmptyText: { text: '{{ wsRoundDetailEmpty | polyglot }}' }
  },

  WsPanel: {
    gap: 'A',
    display: (el, s) => ((s.ws || {}).roundDetail ? 'flex' : 'none'),

    PanelHead: {
      PanelTitle: {
        text: (el, s) => {
          const r = ((s.ws || {}).roundDetail || {}).round || {}
          return `${r.gameTitle || r.gameSlug || ''} · #${r.roundIndex ?? ''}`
        }
      },
      HeadRight: {
        flow: 'x',
        align: 'center flex-end',
        gap: 'Y',
        WsPhaseChip: {
          text: (el, s) => String((((s.ws || {}).roundDetail || {}).round || {}).phase || '—'),
          background: (el, s) => {
            const p = (((s.ws || {}).roundDetail || {}).round || {}).phase
            if (p === 'betting' || p === 'preview') return 'gold'
            if (p === 'locked') return 'white'
            if (p === 'settled' || p === 'ended' || p === 'results') return 'mint'
            if (p === 'void' || p === 'voided') return 'ember'
            return 'white.08'
          },
          color: (el, s) => {
            const p = (((s.ws || {}).roundDetail || {}).round || {}).phase
            return p === 'betting' || p === 'preview' || p === 'locked' ? 'black' : 'white'
          }
        },
        WsConfirmButton: {
          state: { armed: false, fn: 'wsVoidRound', argPath: 'ws.roundDetail.round.id' },
          disabled: (el, s) => {
            const ws = s.root.ws || {}
            const r = (ws.roundDetail || {}).round || {}
            if (r.phase === 'void' || r.phase === 'voided') return true
            return ws.source === 'server' && !(ws.me && ws.me.isStaff)
          },
          title: (el, s) => {
            const ws = s.root.ws || {}
            return ws.source === 'server' && !(ws.me && ws.me.isStaff) ? s.root.wsStaffOnly : ''
          },
          IdleLabel: { text: '{{ wsVoidRound | polyglot }}' }
        }
      }
    },

    ResultRow: {
      flow: 'x',
      align: 'baseline flex-start',
      gap: 'A',
      flexWrap: 'wrap',

      ResultBlock: {
        flow: 'y',
        align: 'flex-start flex-start',
        gap: 'W',
        ResultLabel: {
          tag: 'span',
          fontSize: 'Y',
          fontWeight: '700',
          letterSpacing: 'X',
          textTransform: 'uppercase',
          theme: 'wsMuted',
          text: '{{ wsColResult | polyglot }}'
        },
        ResultLine: {
          flow: 'x',
          align: 'baseline flex-start',
          gap: 'Y',
          ResultValue: {
            tag: 'span',
            fontSize: 'E',
            lineHeight: 'E',
            fontWeight: '800',
            letterSpacing: '-Y',
            color: 'gold',
            display: (el, s) => {
              const r = ((s.ws || {}).roundDetail || {}).round || {}
              return r.result == null || r.sealed ? 'none' : 'inline'
            },
            text: (el, s) => {
              const r = ((s.ws || {}).roundDetail || {}).round || {}
              if (r.result == null) return ''
              const v = Number(r.result)
              return v === 0 ? s.wsDeadHeat || 'Dead heat' : `${s.wsChallenger || 'Challenger'} ${v}`
            }
          },
          WsSealedCell: {
            fontSize: 'A',
            display: (el, s) => {
              const r = ((s.ws || {}).roundDetail || {}).round || {}
              return r.result == null || r.sealed ? 'flex' : 'none'
            }
          },
          ReadingsText: {
            tag: 'span',
            fontSize: 'A',
            theme: 'wsMuted',
            text: (el, s) => {
              const r = ((s.ws || {}).roundDetail || {}).round || {}
              const readings = r.readings || []
              const offsets = r.offsets || []
              if (!readings.length && !offsets.length) return ''
              const n = Math.max(readings.length, offsets.length)
              const parts = []
              for (let i = 0; i < n; i++) {
                const rd = readings[i] ? readings[i] : ''
                const off = offsets[i] == null ? '' : `${Math.abs(Number(offsets[i]))} ${r.unit || ''} off`
                parts.push(`C${i + 1} ${[rd, off].filter(Boolean).join(' → ')}`)
              }
              return `· ${parts.join(' · ')}`
            }
          }
        }
      },

      Metrics: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(6.5em, 1fr))',
        gap: 'A',
        flex: '1',
        childrenAs: 'state',
        children: (el, s) => {
          const r = ((s.ws || {}).roundDetail || {}).round || {}
          const num = (v) => (v == null ? '—' : Math.round(Number(v)).toLocaleString('en-US'))
          return [
            { labelKey: 'wsColPlayers', value: num(r.players), small: true },
            { labelKey: 'wsColPot', value: num(r.pot), small: true },
            { labelKey: 'wsColPrize', value: num(r.prize), small: true },
            { labelKey: 'wsColWinners', value: num(r.winners), small: true },
            { labelKey: 'wsColPayout', value: num(r.payout), small: true },
            { labelKey: 'wsColMultiplier', value: r.multiplier == null ? '—' : `${Number(r.multiplier).toFixed(2)}×`, small: true },
            { labelKey: 'wsColHouse', value: num(r.house), small: true },
            { labelKey: 'wsColConserved', value: r.conservationOk == null ? '—' : r.conservationOk ? '✓' : '✗', small: true }
          ]
        },
        childExtends: 'WsKpi'
      }
    }
  },

  WsHistogram: {
    display: (el, s) => ((s.ws || {}).roundDetail ? 'flex' : 'none')
  },

  WsPanel_1: {
    gap: 'Y',
    display: (el, s) => ((s.ws || {}).roundDetail ? 'flex' : 'none'),
    PanelHead: {
      PanelTitle: { text: '{{ wsBetsTitle | polyglot }}' },
      RowCount: {
        tag: 'span',
        fontSize: 'Z',
        fontVariantNumeric: 'tabular-nums',
        theme: 'wsDim',
        text: (el, s) => String((((s.ws || {}).roundDetail || {}).bets || []).length)
      }
    },
    WsBetsTable: {
      state: { rowsKey: 'detail' },
      display: (el, s) => ((((s.root.ws || {}).roundDetail || {}).bets || []).length ? 'flex' : 'none')
    },
    WsEmpty: {
      display: (el, s) => ((((s.ws || {}).roundDetail || {}).bets || []).length ? 'none' : 'flex'),
      EmptyText: { text: '{{ wsBetsEmpty | polyglot }}' }
    }
  }
}
