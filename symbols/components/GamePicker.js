// Start screen. TypeUI section 1 (hero): one centred stack on the lime
// section surface with a low-contrast grid texture; header block capped at
// 768px, copy at 672px; 64px between the header block and the game cards.
export const GamePicker = {
  tag: 'section',
  flow: 'y',
  align: 'center flex-start',
  width: '100%',
  minHeight: '100vh',
  // Symmetric 64px band padding, plus 96px bottom clearance so the fixed
  // TypeUI panel never covers the last link (fundamentals: overlays must not
  // obscure focusable content).
  padding: 'spacing16 spacing6 spacing24',
  '@tabletS': { padding: 'spacing12 spacing4 spacing24' },
  backgroundImage: 'gridTexture',
  backgroundSize: '2rem 2rem',
  backgroundPosition: 'left top',
  display: (el, s) => (s.screen === 'picker' ? 'flex' : 'none'),

  Container: {
    flow: 'y',
    align: 'center flex-start',
    width: '100%',
    maxWidth: 'containerMax',
    margin: '0 auto',

    PickerIntro: {
      tag: 'header',
      flow: 'y',
      align: 'center flex-start',
      textAlign: 'center',
      width: '100%',
      maxWidth: 'headerMax',
      marginBottom: 'spacing16',

      PickerKicker: {
        extends: 'CkEyebrow',
        text: '{{ pickerKicker | polyglot }}',
        marginBottom: 'spacing3'
      },

      PickerTitle: {
        tag: 'h1',
        text: '{{ pickerTitle | polyglot }}',
        fontFamily: 'mono',
        fontSize: 'fontHero',
        '@tabletS': { fontSize: 'font9xl' },
        lineHeight: '1',
        fontWeight: '700',
        letterSpacing: '-0.1rem',
        textWrap: 'balance',
        color: 'heading',
        margin: '0 0 spacing8'
      },

      PickerLead: {
        tag: 'p',
        text: '{{ pickerLead | polyglot }}',
        fontFamily: 'sans',
        fontSize: 'fontXl',
        '@tabletS': { fontSize: 'fontLg' },
        lineHeight: '1.5',
        color: 'body',
        maxWidth: 'copyMax',
        margin: '0'
      }
    },

    GameCards: {
      flow: 'x',
      align: 'stretch center',
      gap: 'spacing6',
      flexWrap: 'wrap',
      width: '100%',
      maxWidth: 'headerMax',
      marginBottom: 'spacing16',
      childExtends: 'GameCard',

      BananaCard: {
        onClick: (e, el) => el.call('selectGame', 'banana_cut'),
        Img: { src: '/assets/posters/banana.jpg', alt: (el, s) => s.bananaPosterAlt || '' },
        CardBody: {
          CardKicker: { text: '{{ bananaKicker | polyglot }}' },
          CardTitle: { text: '{{ bananaTitle | polyglot }}' },
          CardLine: { text: '{{ bananaObjective | polyglot }}' }
        }
      },

      WaterCard: {
        onClick: (e, el) => el.call('selectGame', 'water_200g'),
        // Card still is challenger 2 (navy tee, 33 s), not the frame-0 stage poster.
        Img: { src: '/assets/posters/water-card.jpg', alt: (el, s) => s.waterPosterAlt || '' },
        CardBody: {
          CardKicker: { text: '{{ waterKicker | polyglot }}' },
          CardTitle: { text: '{{ waterTitle | polyglot }}' },
          CardLine: { text: '{{ waterObjective | polyglot }}' }
        }
      }
    },

    // The product's one promise, in body copy. Paragraph -> next block: 24px.
    PickerHonesty: {
      tag: 'p',
      text: '{{ pickerHonesty | polyglot }}',
      fontFamily: 'sans',
      fontSize: 'fontMd',
      lineHeight: '1.5',
      color: 'body',
      textAlign: 'center',
      maxWidth: 'copyMax',
      margin: '0 0 spacing6'
    },

    // Staff door to the analytics console (docs/workspace.md). Navigation, so
    // it is a link; the router still handles the click.
    WorkspaceLink: {
      extends: 'CkLink',
      attr: { href: '/workspace' },
      onClick: (e, el) => {
        e.preventDefault()
        let root = el
        while (root && root.parent && root.parent.key !== undefined) root = root.parent
        if (root && typeof root.navigate === 'function') root.navigate('/workspace')
        else if (root && typeof root.router === 'function') root.router('/workspace', root, {}, { pushState: true })
      },
      LinkLabel: { tag: 'span', text: '{{ wsOpenWorkspace | polyglot }}' },
      LinkArrow: { extends: 'Icon', name: 'arrowRight', boxSize: 'icon16', attr: { 'aria-hidden': 'true' } }
    }
  }
}
