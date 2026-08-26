// The operator console. A dense two-column shell: nav rail on the left,
// top bar + one view at a time on the right. Every view renders state.ws
// exactly as the data layer returns it — nothing here computes a payout.
export const workspace = {
  extends: 'Page',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  width: '100%',
  minHeight: '100vh',
  theme: 'wsShell',

  metadata: {
    title: '{{ wsMetaTitle | polyglot }}',
    description: '{{ wsMetaDescription | polyglot }}'
  },

  onRender: (el) => el.call('wsBoot'),

  WsNav: {},
  WsMain: {}
}
