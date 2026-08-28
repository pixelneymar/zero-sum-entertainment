// One row of the rounds table. Child state: a round. Click opens detail.
export const WsRoundRow = {
  tag: 'button',
  fontFamily: 'inherit',
  display: 'grid',
  gridTemplateColumns: 'minmax(8em, 1.4fr) 3em 9em 4.5em 5em 5em 4.5em 5em 4.5em 4.5em 8em 5.5em',
  alignItems: 'center',
  gap: 'Y',
  width: '100%',
  padding: 'Y 0',
  border: 'none',
  borderBottom: '1px solid white.08',
  background: 'transparent',
  color: 'white',
  textAlign: 'left',
  fontSize: 'Z',
  fontVariantNumeric: 'tabular-nums',
  cursor: 'pointer',
  role: 'row',
  ':hover': { background: 'white.06' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '-2px' },
  onClick: (e, el, s) => el.call('wsSelectRound', s.id),

  GameCell: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'Y',
    padding: '0 Z',
    minWidth: '0',
    GameName: {
      tag: 'span',
      fontWeight: '700',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      text: (el, s) => s.gameTitle || s.gameSlug || ''
    },
    WsPhaseChip: {}
  },
  IndexCell: { tag: 'span', text: (el, s) => `#${s.roundIndex ?? ''}`, theme: 'wsMuted' },
  ResultCell: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'X',
    minWidth: '0',
    Icon: {
      name: 'lock',
      boxSize: 'Z',
      color: 'haze',
      display: (el, s) => (s.sealed || s.result == null ? 'block' : 'none')
    },
    ResultValue: {
      tag: 'span',
      fontWeight: '800',
      whiteSpace: 'nowrap',
      color: 'gold',
      text: (el, s) => {
        if (s.sealed || s.result == null) return '—'
        const v = Number(s.result)
        return v === 0 ? s.root.wsDeadHeat || 'Dead heat' : `${s.root.wsChallenger || 'Challenger'} ${v}`
      }
    },
    Readings: {
      tag: 'span',
      theme: 'wsDim',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      text: (el, s) => {
        const o = s.offsets || []
        if (o.length >= 2 && o[0] != null && o[1] != null) return `${Math.abs(Number(o[0]))} · ${Math.abs(Number(o[1]))} ${s.unit || ''}`
        return s.readings && s.readings.length ? s.readings.join(' · ') : ''
      }
    }
  },
  PlayersCell: { tag: 'span', textAlign: 'right', text: (el, s) => Math.round(Number(s.players) || 0).toLocaleString('en-US') },
  PotCell: { tag: 'span', textAlign: 'right', text: (el, s) => Math.round(Number(s.pot) || 0).toLocaleString('en-US') },
  PrizeCell: { tag: 'span', textAlign: 'right', text: (el, s) => Math.round(Number(s.prize) || 0).toLocaleString('en-US') },
  WinnersCell: { tag: 'span', textAlign: 'right', text: (el, s) => (s.winners == null ? '—' : String(s.winners)) },
  PayoutCell: { tag: 'span', textAlign: 'right', text: (el, s) => (s.payout == null ? '—' : Math.round(Number(s.payout)).toLocaleString('en-US')) },
  MultCell: {
    tag: 'span',
    textAlign: 'right',
    fontWeight: '700',
    text: (el, s) => (s.multiplier == null ? '—' : `${Number(s.multiplier).toFixed(2)}×`)
  },
  HouseCell: { tag: 'span', textAlign: 'right', text: (el, s) => (s.house == null ? '—' : Math.round(Number(s.house)).toLocaleString('en-US')) },
  SettledCell: {
    tag: 'span',
    theme: 'wsMuted',
    whiteSpace: 'nowrap',
    text: (el, s) => {
      if (!s.settledAt) return '—'
      const d = new Date(s.settledAt)
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour12: false })}`
    }
  },
  ConservedCell: {
    tag: 'span',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 'A',
    text: (el, s) => (s.conservationOk == null ? '—' : s.conservationOk ? '✓' : '✗'),
    color: (el, s) => (s.conservationOk == null ? 'neutral' : s.conservationOk ? 'mint' : 'ember'),
    aria: { label: (el, s) => (s.conservationOk ? s.root.wsStatusPass : s.root.wsStatusFail) || '' }
  }
}
