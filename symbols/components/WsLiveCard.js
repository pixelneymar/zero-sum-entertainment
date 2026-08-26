// One active game. Child state: { gameSlug, gameTitle, roundIndex, phase,
// secondsLeft, playerCount, pot, frozen }. From LOCK onward the frozen
// snapshot is what renders — the live counters are hidden, not re-read.
export const WsLiveCard = {
  extends: 'WsPanel',
  gap: 'A',

  PanelHead: {
    PanelTitle: { text: (el, s) => s.gameTitle || s.gameSlug },
    HeadRight: {
      flow: 'x',
      align: 'center flex-end',
      gap: 'Y',
      RoundTag: {
        flow: 'x',
        align: 'baseline flex-start',
        gap: 'X',
        fontSize: 'Z',
        theme: 'wsMuted',
        RoundWord: { tag: 'span', text: '{{ wsRoundWord | polyglot }}' },
        RoundNum: { tag: 'span', fontWeight: '800', color: 'white', text: (el, s) => String(s.roundIndex ?? '') }
      },
      WsPhaseChip: {}
    }
  },

  Body: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'B',
    flexWrap: 'wrap',

    Dial: {
      position: 'relative',
      flow: 'y',
      align: 'center center',
      width: 'wsRing',
      height: 'wsRing',
      round: 'wsRing',
      flexShrink: '0',
      border: '1px solid white.12',
      background: (el, s) => (s.phase === 'locked' ? 'white' : 'ink'),
      color: (el, s) => (s.phase === 'locked' ? 'black' : 'white'),

      Svg: {
        position: 'absolute',
        inset: '0 0 0 0',
        width: '100%',
        height: '100%',
        transform: 'rotate(-90deg)',
        attr: { viewBox: '0 0 100 100', 'aria-hidden': 'true' },
        color: (el, s) => {
          if (s.phase === 'locked') return 'black'
          if (s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5) return 'ember'
          if (s.phase === 'results') return 'haze'
          return 'gold'
        },
        Track: {
          tag: 'circle',
          opacity: '.18',
          attr: { cx: '50', cy: '50', r: '44', fill: 'none', stroke: 'currentColor', 'stroke-width': '8' }
        },
        Arc: {
          tag: 'circle',
          transition: 'stroke-dashoffset 1s linear',
          attr: {
            cx: '50',
            cy: '50',
            r: '44',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '8',
            'stroke-linecap': 'round',
            'stroke-dasharray': '276.46',
            'stroke-dashoffset': (el, s) => {
              const totals = { preview: 5, betting: 25, locked: 5, results: 8 }
              const total = totals[s.phase] || 1
              const left = Math.max(0, Math.min(total, s.secondsLeft ?? 0))
              const fraction = s.phase === 'locked' ? 1 : left / total
              return String(276.46 * (1 - fraction))
            }
          }
        }
      },

      Seconds: {
        tag: 'span',
        position: 'relative',
        fontSize: 'B',
        fontWeight: '800',
        fontVariantNumeric: 'tabular-nums',
        text: (el, s) => String(Math.max(0, Math.ceil(s.secondsLeft ?? 0))),
        display: (el, s) => (s.phase === 'locked' ? 'none' : 'inline')
      },
      Icon: {
        name: 'lock',
        position: 'relative',
        boxSize: 'A',
        color: 'black',
        display: (el, s) => (s.phase === 'locked' ? 'block' : 'none')
      }
    },

    Stats: {
      flow: 'x',
      align: 'flex-start flex-start',
      gap: 'B',
      flexWrap: 'wrap',

      PlayersStat: {
        flow: 'y',
        align: 'flex-start flex-start',
        gap: 'W',
        StatLabel: {
          tag: 'span',
          fontSize: 'Y',
          fontWeight: '700',
          letterSpacing: 'X',
          textTransform: 'uppercase',
          theme: 'wsMuted',
          text: '{{ playersLabel | polyglot }}'
        },
        StatValue: {
          tag: 'span',
          fontSize: 'C',
          lineHeight: 'C',
          fontWeight: '800',
          text: (el, s) => {
            const v = s.frozen ? s.frozen.playerCount : s.playerCount
            return Math.round(Number(v) || 0).toLocaleString('en-US')
          }
        }
      },

      PotStat: {
        flow: 'y',
        align: 'flex-start flex-start',
        gap: 'W',
        StatLabel: {
          tag: 'span',
          fontSize: 'Y',
          fontWeight: '700',
          letterSpacing: 'X',
          textTransform: 'uppercase',
          theme: 'wsMuted',
          text: '{{ potLabel | polyglot }}'
        },
        StatValue: {
          tag: 'span',
          fontSize: 'C',
          lineHeight: 'C',
          fontWeight: '800',
          text: (el, s) => {
            const v = s.frozen ? s.frozen.pot : s.pot
            return Math.round(Number(v) || 0).toLocaleString('en-US')
          }
        }
      },

      FrozenNote: {
        flow: 'x',
        align: 'center flex-start',
        gap: 'Y',
        alignSelf: 'flex-end',
        padding: 'X Z',
        round: 'C',
        background: 'white',
        color: 'black',
        fontSize: 'Y',
        fontWeight: '800',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        display: (el, s) => (s.frozen ? 'flex' : 'none'),
        Icon: { name: 'lock', boxSize: 'Z', color: 'black' },
        FrozenText: { tag: 'span', text: '{{ wsFrozen | polyglot }}' }
      }
    }
  }
}
