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

    PickerKicker: {
      tag: 'span',
      text: '{{ pickerKicker | polyglot }}',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'Y',
      textTransform: 'uppercase',
      color: 'brand'
    },

    PickerTitle: {
      tag: 'h1',
      text: '{{ pickerTitle | polyglot }}',
      fontSize: 'E',
      lineHeight: 'E',
      fontWeight: '800',
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
    maxWidth: '46em',
    childExtends: 'GameCard',

    BananaCard: {
      onClick: (e, el, s) =>
        s.update({
          screen: 'playing',
          phase: 'preview',
          game: {
            slug: 'banana_cut',
            title: 'Banana Cut',
            objectiveLine: 'Cut the banana exactly in half',
            guessMin: -20,
            guessMax: 20,
            guessStep: 1,
            resultUnit: 'g'
          }
        }),

      CardGlyph: { text: '🍌' },
      CardTitle: { text: '{{ bananaTitle | polyglot }}' },
      CardLine: { text: '{{ bananaObjective | polyglot }}' }
    },

    WaterCard: {
      onClick: (e, el, s) =>
        s.update({
          screen: 'playing',
          phase: 'preview',
          game: {
            slug: 'water_200g',
            title: 'Water Pour',
            objectiveLine: 'Pour exactly 200 g of water',
            guessMin: -20,
            guessMax: 20,
            guessStep: 1,
            resultUnit: 'g'
          }
        }),

      CardGlyph: { text: '💧' },
      CardTitle: { text: '{{ waterTitle | polyglot }}' },
      CardLine: { text: '{{ waterObjective | polyglot }}' }
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
  }
}
