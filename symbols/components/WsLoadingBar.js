// A thin sliding bar under the top bar while state.ws.loading is true.
// The previous render stays in place underneath — no skeleton flash.
export const WsLoadingBar = {
  position: 'relative',
  height: 'X',
  overflow: 'hidden',
  background: 'white.06',
  opacity: (el, s) => ((s.ws || {}).loading ? '1' : '0'),
  transition: 'A defaultBezier',
  transitionProperty: 'opacity',
  aria: { hidden: 'true' },

  Runner: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '25%',
    height: '100%',
    background: 'gold',
    animation: 'wsSlide 1.2s ease-in-out infinite'
  }
}
