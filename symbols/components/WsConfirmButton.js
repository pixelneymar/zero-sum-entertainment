// Two-click management button: the first click arms it ("Sure?"), the
// second fires. Never window.confirm — it blocks automation. State:
//   fn      — function name for el.call
//   argPath — dot path resolved against the parent state (e.g. 'slug',
//             'ws.roundDetail.round.id'); omitted → called with no args
// Focus loss disarms it, so a stray first click never lingers.
export const WsConfirmButton = {
  extends: 'WsButton',
  state: { armed: false, fn: null, argPath: null },

  background: (el, s) => (s.armed ? 'ember' : 'white.08'),
  borderColor: (el, s) => (s.armed ? 'ember' : 'white.14'),

  onClick: (e, el, s) => {
    if (!s.armed) {
      s.update({ armed: true })
      return
    }
    s.update({ armed: false })
    let arg
    if (s.argPath) {
      arg = s.argPath.split('.').reduce((o, k) => (o == null ? o : o[k]), s.parent)
    }
    if (s.fn) el.call(s.fn, arg)
  },
  onBlur: (e, el, s) => {
    if (s.armed) s.update({ armed: false })
  },

  IdleLabel: {
    tag: 'span',
    display: (el, s) => (s.armed ? 'none' : 'inline')
  },
  ArmedLabel: {
    tag: 'span',
    text: '{{ wsSure | polyglot }}',
    display: (el, s) => (s.armed ? 'inline' : 'none')
  }
}
