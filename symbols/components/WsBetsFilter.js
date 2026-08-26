// One filter row above the bets table: game, round, player, won. Every
// change goes through wsSetBetsFilter; the data layer re-queries.
export const WsBetsFilter = {
  flow: 'x',
  align: 'flex-end flex-start',
  gap: 'A',
  flexWrap: 'wrap',

  GameField: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'W',
    FieldLabel: {
      tag: 'label',
      fontSize: 'Y',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      text: '{{ wsFilterGame | polyglot }}'
    },
    WsSelect: {
      aria: { label: (el, s) => s.wsFilterGame || '' },
      onChange: (e, el) => el.call('wsSetBetsFilter', { gameSlug: e.target.value || null }),
      children: (el, s) => {
        const ws = s.ws || {}
        const current = (ws.betsFilter || {}).gameSlug || ''
        // ws.games is only loaded by the Games view — fall back to the games
        // named by the rounds list.
        const seen = {}
        const games = (ws.games || []).map((g) => {
          seen[g.slug] = true
          return { value: g.slug, label: g.title || g.slug, selected: current === g.slug }
        })
        ;(ws.rounds || []).forEach((r) => {
          if (!r.gameSlug || seen[r.gameSlug]) return
          seen[r.gameSlug] = true
          games.push({ value: r.gameSlug, label: r.gameTitle || r.gameSlug, selected: current === r.gameSlug })
        })
        return [{ value: '', label: s.wsFilterAll, selected: current === '' }].concat(games)
      }
    }
  },

  RoundField: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'W',
    FieldLabel: {
      tag: 'label',
      fontSize: 'Y',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      text: '{{ wsFilterRound | polyglot }}'
    },
    WsSelect: {
      aria: { label: (el, s) => s.wsFilterRound || '' },
      onChange: (e, el) => el.call('wsSetBetsFilter', { roundId: e.target.value || null }),
      children: (el, s) => {
        const ws = s.ws || {}
        const current = (ws.betsFilter || {}).roundId || ''
        // ws.rounds is only loaded by the Rounds view — fall back to the
        // round ids present in the bets themselves.
        const seen = {}
        const rounds = (ws.rounds || []).map((r) => {
          seen[r.id] = true
          return { value: r.id, label: `${r.gameTitle || r.gameSlug} #${r.roundIndex}`, selected: current === r.id }
        })
        ;(ws.bets || []).forEach((b) => {
          if (!b.roundId || seen[b.roundId]) return
          seen[b.roundId] = true
          rounds.push({ value: b.roundId, label: String(b.roundId), selected: current === b.roundId })
        })
        return [{ value: '', label: s.wsFilterAll, selected: current === '' }].concat(rounds)
      }
    }
  },

  PlayerField: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'W',
    FieldLabel: {
      tag: 'label',
      fontSize: 'Y',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      text: '{{ wsFilterPlayer | polyglot }}'
    },
    WsSelect: {
      aria: { label: (el, s) => s.wsFilterPlayer || '' },
      onChange: (e, el) => el.call('wsSetBetsFilter', { playerId: e.target.value || null }),
      children: (el, s) => {
        const ws = s.ws || {}
        const current = (ws.betsFilter || {}).playerId || ''
        // ws.players is only loaded by the Players view — fall back to the
        // players present in the bets themselves.
        const seen = {}
        const players = (ws.players || []).map((p) => {
          seen[p.id] = true
          return { value: p.id, label: p.name || p.id, selected: current === p.id }
        })
        ;(ws.bets || []).forEach((b) => {
          if (!b.playerId || seen[b.playerId]) return
          seen[b.playerId] = true
          players.push({ value: b.playerId, label: b.playerName || b.playerId, selected: current === b.playerId })
        })
        players.sort((x, y) => String(x.label).localeCompare(String(y.label)))
        return [{ value: '', label: s.wsFilterAll, selected: current === '' }].concat(players)
      }
    }
  },

  WonField: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'W',
    FieldLabel: {
      tag: 'label',
      fontSize: 'Y',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      text: '{{ wsFilterWon | polyglot }}'
    },
    WsSelect: {
      aria: { label: (el, s) => s.wsFilterWon || '' },
      onChange: (e, el) => {
        const v = e.target.value
        el.call('wsSetBetsFilter', { won: v === '' ? null : v === 'won' })
      },
      children: (el, s) => {
        const won = ((s.ws || {}).betsFilter || {}).won
        return [
          { value: '', label: s.wsFilterAll, selected: won == null },
          { value: 'won', label: s.wsFilterWonOnly, selected: won === true },
          { value: 'lost', label: s.wsFilterLostOnly, selected: won === false }
        ]
      }
    }
  },

  WsButton: {
    onClick: (e, el) => el.call('wsSetBetsFilter', { gameSlug: null, roundId: null, playerId: null, won: null }),
    ClearLabel: { tag: 'span', text: '{{ wsClearFilters | polyglot }}' }
  }
}
