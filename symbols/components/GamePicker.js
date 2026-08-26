export const GamePicker = {
  tag: 'section',
  flow: 'y',
  align: 'center center',
  gap: 'C',
  padding: 'D B',
  width: '100%',
  display: (el, s) => (s.screen === 'picker' ? 'flex' : 'none'),

  PickerIntro: {
    flow: 'y',
    align: 'center center',
    gap: 'Y',
    textAlign: 'center',
    maxWidth: '38em',
    animation: 'riseIn .6s ease-out both',

    PickerKicker: {
      tag: 'span',
      text: '{{ pickerKicker | polyglot }}',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'Y',
      textTransform: 'uppercase',
      color: 'gold'
    },

    PickerTitle: {
      tag: 'h1',
      text: '{{ pickerTitle | polyglot }}',
      fontSize: 'G',
      lineHeight: 'G',
      fontWeight: '900',
      letterSpacing: '-Y',
      margin: '0'
    },

    PickerLead: {
      tag: 'p',
      text: '{{ pickerLead | polyglot }}',
      fontSize: 'A2',
      lineHeight: 'B',
      theme: 'muted',
      margin: '0'
    }
  },

  GameCards: {
    flow: 'x',
    align: 'stretch center',
    gap: 'B',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: '52em',
    animation: 'riseIn .6s ease-out .15s both',
    childExtends: 'GameCard',

    BananaCard: {
      onClick: (e, el) => el.call('selectGame', 'banana_cut'),
      Img: { src: '/assets/posters/banana.jpg', alt: (el, s) => s.bananaPosterAlt || '' },
      CardBody: {
        CardKicker: { text: '{{ bananaKicker | polyglot }}' },
        CardTitle: { text: '{{ bananaTitle | polyglot }}' },
        CardLine: { text: '{{ bananaObjective | polyglot }}' },
        CardMeta: { RangeNote: { text: '{{ bananaRange | polyglot }}' } }
      }
    },

    WaterCard: {
      onClick: (e, el) => el.call('selectGame', 'water_200g'),
      Img: { src: '/assets/posters/water.jpg', alt: (el, s) => s.waterPosterAlt || '' },
      CardBody: {
        CardKicker: { text: '{{ waterKicker | polyglot }}' },
        CardTitle: { text: '{{ waterTitle | polyglot }}' },
        CardLine: { text: '{{ waterObjective | polyglot }}' },
        CardMeta: { RangeNote: { text: '{{ waterRange | polyglot }}' } }
      }
    }
  },

  PickerHonesty: {
    tag: 'p',
    text: '{{ pickerHonesty | polyglot }}',
    fontSize: 'Z',
    lineHeight: 'A',
    theme: 'muted',
    textAlign: 'center',
    maxWidth: '34em',
    margin: '0'
  },

  // Staff door to the analytics console (docs/workspace.md).
  WorkspaceLink: {
    tag: 'button',
    fontFamily: 'inherit',
    background: 'transparent',
    border: 'none',
    padding: 'X Y',
    round: 'Y',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    theme: 'muted',
    cursor: 'pointer',
    animation: 'fadeIn .6s ease-out .3s both',
    ':hover': { color: 'gold' },
    ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
    // router(path, element, state, options) lives on the root element.
    onClick: (e, el) => {
      let root = el
      while (root && root.parent && root.parent.key !== undefined) root = root.parent
      if (root && typeof root.navigate === 'function') root.navigate('/workspace')
      else if (root && typeof root.router === 'function') root.router('/workspace', root, {}, { pushState: true })
    },
    LinkLabel: { tag: 'span', text: '{{ wsOpenWorkspace | polyglot }}' },
    LinkArrow: { tag: 'span', text: ' →' }
  }
}
