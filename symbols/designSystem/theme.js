export default {
  document: {
    '@light': { background: 'white', color: 'black' },
    '@dark': { background: 'ink', color: 'white' }
  },

  surface: {
    '@light': { background: 'white-4', color: 'black' },
    '@dark': { background: 'black+6', color: 'white' }
  },

  muted: {
    '@light': { color: 'black+35' },
    '@dark': { color: 'white-35' }
  },

  // Translucent broadcast panel over video. Identical in both schemes because
  // the footage under it is always dark.
  glass: {
    '@light': { background: 'steel.62', color: 'white' },
    '@dark': { background: 'steel.62', color: 'white' }
  },

  // Glass panel after LOCK — denser, colder, nothing moves.
  glassLocked: {
    '@light': { background: 'ink.86', color: 'white' },
    '@dark': { background: 'ink.86', color: 'white' }
  },

  // Secondary text over video.
  onVideoMuted: {
    '@light': { color: 'haze' },
    '@dark': { color: 'haze' }
  },

  chip: {
    '@light': { background: 'white.08', color: 'white' },
    '@dark': { background: 'white.08', color: 'white' }
  },

  chipActive: {
    '@light': { background: 'white', color: 'black' },
    '@dark': { background: 'white', color: 'black' }
  },

  primary: {
    background: 'brand',
    color: 'white',
    ':hover': { background: 'brand+8' }
  },

  danger: {
    '@light': { background: 'ember', color: 'white' },
    '@dark': { background: 'ember', color: 'white' }
  },

  success: {
    '@light': { background: 'mint', color: 'white' },
    '@dark': { background: 'mint', color: 'white' }
  },

  locked: {
    '@light': { background: 'white', color: 'black' },
    '@dark': { background: 'white', color: 'black' }
  },

  // ---- workspace console (always dark; no footage underneath) ----------
  wsShell: {
    '@light': { background: 'ink', color: 'white' },
    '@dark': { background: 'ink', color: 'white' }
  },

  wsPanel: {
    '@light': { background: 'slate', color: 'white' },
    '@dark': { background: 'slate', color: 'white' }
  },

  wsRail: {
    '@light': { background: 'black', color: 'white' },
    '@dark': { background: 'black', color: 'white' }
  },

  wsMuted: {
    '@light': { color: 'haze' },
    '@dark': { color: 'haze' }
  },

  wsDim: {
    '@light': { color: 'neutral' },
    '@dark': { color: 'neutral' }
  }
}
