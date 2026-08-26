export default {
  document: {
    '@light': { background: 'white', color: 'black' },
    '@dark': { background: 'black', color: 'white' }
  },

  surface: {
    '@light': { background: 'white-4', color: 'black' },
    '@dark': { background: 'black+6', color: 'white' }
  },

  muted: {
    '@light': { color: 'black+35' },
    '@dark': { color: 'white-35' }
  },

  primary: {
    background: 'brand',
    color: 'white',
    ':hover': { background: 'brand+8' }
  }
}
