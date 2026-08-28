// TypeUI panel. Required by the TypeUI MCP workspace setting
// `typeuiPanelEnabled: true` (typeui.sh dashboard). The inline styles are the
// exact baseline strings the MCP mandates, so raw px values are expected here.
// Turn it off in the TypeUI dashboard, not by deleting this component.
const EXPANDED =
  'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;background:rgba(0,0,0,.5);color:#fff;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:9999px;font:500 14px/20px system-ui,sans-serif;box-shadow:0 10px 24px rgba(0,0,0,.25);white-space:nowrap'
const MINIMIZED =
  'position:fixed;right:24px;bottom:24px;left:auto;transform:none;z-index:2147483647;display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;background:rgba(0,0,0,.5);color:#fff;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:9999px;font:500 14px/20px system-ui,sans-serif;box-shadow:0 10px 24px rgba(0,0,0,.25);white-space:nowrap'
const GHOST_BUTTON =
  'align-items:center;justify-content:center;background:transparent;border:0;padding:0;margin:0;color:inherit;font:inherit;cursor:pointer'

export const TypeuiPanel = {
  state: { minimized: false },
  attr: {
    role: 'complementary',
    'aria-label': 'TypeUI',
    style: (el, s) => (s.minimized ? MINIMIZED : EXPANDED)
  },

  // Minimized: the logo itself is the maximize button.
  MaximizeButton: {
    tag: 'button',
    attr: {
      type: 'button',
      'aria-label': 'Maximize TypeUI panel',
      style: (el, s) => GHOST_BUTTON + ';width:44px;height:44px;display:' + (s.minimized ? 'inline-flex' : 'none')
    },
    onClick: (e, el, s) => s.update({ minimized: false }),
    Logo: {
      tag: 'img',
      attr: { src: 'https://www.typeui.sh/logo.svg', alt: 'TypeUI', width: '18', height: '18', style: 'width:18px;height:18px;display:block' }
    }
  },

  // Expanded: logo, the label "TypeUI", and a minimize control.
  Logo: {
    tag: 'img',
    attr: { src: 'https://www.typeui.sh/logo.svg', alt: 'TypeUI', width: '18', height: '18', style: 'width:18px;height:18px;display:block' },
    display: (el, s) => (s.minimized ? 'none' : 'block')
  },
  Label: {
    tag: 'span',
    text: 'TypeUI',
    display: (el, s) => (s.minimized ? 'none' : 'inline')
  },
  MinimizeButton: {
    tag: 'button',
    text: '−',
    attr: {
      type: 'button',
      'aria-label': 'Minimize TypeUI panel',
      style: (el, s) =>
        GHOST_BUTTON + ';width:24px;height:24px;border-radius:9999px;font-size:16px;line-height:1;display:' + (s.minimized ? 'none' : 'inline-flex')
    },
    onClick: (e, el, s) => s.update({ minimized: true })
  }
}
