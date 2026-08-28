// Game config card. Child state: a game { slug, title, active, sides, unit,
// videoSrc, scripts }. The Active toggle and
// Schedule button are management writes — staff-gated on the server.
export const WsGameCard = {
  extends: 'WsPanel',
  gap: 'A',

  PanelHead: {
    PanelTitle: { text: (el, s) => `${s.title || s.slug}` },
    HeadRight: {
      flow: 'x',
      align: 'center flex-end',
      gap: 'Y',
      SlugText: { tag: 'span', fontSize: 'Z', fontVariantNumeric: 'tabular-nums', theme: 'wsDim', text: (el, s) => String(s.slug || '') },
      WsButton: {
        role: 'switch',
        aria: { checked: (el, s) => (s.active ? 'true' : 'false') },
        background: (el, s) => (s.active ? 'mint' : 'white.08'),
        color: (el, s) => (s.active ? 'white' : 'haze'),
        disabled: (el, s) => {
          const ws = s.root.ws || {}
          return ws.source === 'server' && !(ws.me && ws.me.isStaff)
        },
        title: (el, s) => {
          const ws = s.root.ws || {}
          return ws.source === 'server' && !(ws.me && ws.me.isStaff) ? s.root.wsStaffOnly : ''
        },
        onClick: (e, el, s) => el.call('wsSetGameActive', s.slug, !s.active),
        ToggleDot: {
          tag: 'span',
          width: 'Y',
          height: 'Y',
          round: 'Y',
          background: 'white',
          opacity: (el, s) => (s.active ? '1' : '.4')
        },
        ActiveLabel: { tag: 'span', text: '{{ wsActive | polyglot }}', display: (el, s) => (s.active ? 'inline' : 'none') },
        InactiveLabel: { tag: 'span', text: '{{ wsInactive | polyglot }}', display: (el, s) => (s.active ? 'none' : 'inline') }
      }
    }
  },

  Config: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(7em, 1fr))',
    gap: 'A',
    childrenAs: 'state',
    children: (el, s) => [
      { labelKey: 'wsSides', value: String(s.sides ?? 2), small: true },
      { labelKey: 'wsUnit', value: String(s.unit || ''), small: true }
    ],
    childExtends: 'WsKpi'
  },

  VideoRow: {
    flow: 'x',
    align: 'baseline flex-start',
    gap: 'Y',
    fontSize: 'Z',
    minWidth: '0',
    VideoLabel: {
      tag: 'span',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      text: '{{ wsVideo | polyglot }}'
    },
    VideoLink: {
      tag: 'a',
      color: 'azure',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      href: (el, s) => s.videoSrc || '#',
      target: '_blank',
      rel: 'noreferrer',
      text: (el, s) => s.videoSrc || '—'
    }
  },

  ScriptsBlock: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'X',
    ScriptsTitle: {
      tag: 'span',
      fontSize: 'Y',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      text: '{{ wsScripts | polyglot }}'
    },
    Scripts: {
      flow: 'y',
      align: 'stretch flex-start',
      childrenAs: 'state',
      children: (el, s) => {
        const scripts = s.scripts || []
        const max = scripts.reduce((m, r) => Math.max(m, Number(r.endAt) || 0), 0) || 1
        return scripts.map((r) => ({ ...r, unit: s.unit, max }))
      },
      childExtends: 'WsScriptTimeline'
    }
  },

  Actions: {
    flow: 'x',
    align: 'center flex-end',
    gap: 'Y',
    ServerOnlyNote: {
      tag: 'span',
      fontSize: 'Y',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsDim',
      text: '{{ wsServerOnly | polyglot }}',
      display: (el, s) => ((s.root.ws || {}).source === 'server' ? 'none' : 'inline')
    },
    WsConfirmButton: {
      state: { armed: false, fn: 'wsScheduleRound', argPath: 'slug' },
      disabled: (el, s) => {
        const ws = s.root.ws || {}
        if (ws.source !== 'server') return true
        return !(ws.me && ws.me.isStaff)
      },
      title: (el, s) => {
        const ws = s.root.ws || {}
        if (ws.source !== 'server') return s.root.wsServerOnly
        return ws.me && ws.me.isStaff ? '' : s.root.wsStaffOnly
      },
      IdleLabel: { text: '{{ wsScheduleRound | polyglot }}' }
    }
  }
}
