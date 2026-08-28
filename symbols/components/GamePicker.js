// Start screen (SKILL.md hero, layout.md): a navy section with blurred
// atmosphere orbs, a flat copy column, and the two game cards as separate
// glass cards in one row (they wrap on narrow screens).
export const GamePicker = {
  tag: 'main',
  position: 'relative',
  flow: 'y',
  align: 'center flex-start',
  width: '100%',
  minHeight: '100vh',
  overflow: 'hidden',
  padding: 'spacing16 spacing6',
  '@tabletS': { padding: 'spacing16 spacing4' },
  '@mobileL': { padding: 'spacing16 spacing4' },
  display: (el, s) => (s.screen === 'picker' ? 'flex' : 'none'),

  // Atmosphere: two blurred orbs (layout.md backgrounds). Decorative only.
  OrbBrand: {
    position: 'absolute',
    top: '-10rem',
    left: '-8rem',
    width: 'orb',
    height: 'orb',
    round: 'radiusFull',
    background: 'orbBrand',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    attr: { 'aria-hidden': 'true' }
  },
  OrbPurple: {
    position: 'absolute',
    bottom: '-12rem',
    right: '-10rem',
    width: 'orb',
    height: 'orb',
    round: 'radiusFull',
    background: 'orbPurple',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    attr: { 'aria-hidden': 'true' }
  },

  Container: {
    position: 'relative',
    flow: 'y',
    align: 'center flex-start',
    width: '100%',
    maxWidth: 'containerMax',
    margin: '0 auto',
    // Clearance for the fixed TypeUI panel (a spacer, not section rhythm).
    paddingBottom: 'spacing20',

    PickerIntro: {
      tag: 'header',
      flow: 'y',
      align: 'center flex-start',
      textAlign: 'center',
      width: '100%',
      maxWidth: 'headerMax',
      marginBottom: 'spacing8',

      // Brand (docs/brand.md): the stacked wordmark is the hero image; the
      // h1 below keeps the page's heading semantics.
      LogoStacked: { marginBottom: 'spacing6' },

      // h1 (typography.md): 72 / tablet 48 / mobile 36, -1.5px tracking,
      // display line-height 1 (fundamentals floor for display type).
      PickerTitle: {
        tag: 'h1',
        text: '{{ pickerTitle | polyglot }}',
        fontFamily: 'sans',
        fontSize: 'fontHero',
        '@tabletS': { fontSize: 'font6xl' },
        '@mobileL': { fontSize: 'font5xl' },
        lineHeight: '1',
        fontWeight: '900',
        letterSpacing: '-0.09375rem',
        textWrap: 'balance',
        color: 'heading',
        margin: '0 0 spacing6'
      },

      // Leading paragraph: 20px / 1.7, ~70ch, body colour.
      PickerLead: {
        tag: 'p',
        text: '{{ pickerLead | polyglot }}',
        fontFamily: 'sans',
        fontSize: 'fontXl',
        '@tabletS': { fontSize: 'fontLg' },
        lineHeight: '1.7',
        color: 'body',
        maxWidth: 'copyMax',
        margin: '0'
      }
    },

    // The gallery: the kicker badge, then the two game cards as separate
    // glass surfaces in one row. Each card carries its own border, blur and
    // shadow (CkCardInteractive); a shared panel made them read as one block.
    Gallery: {
      flow: 'y',
      align: 'center flex-start',
      gap: 'spacing6',
      width: '100%',
      maxWidth: 'galleryMax',
      marginBottom: 'spacing12',

      Kicker: {
        extends: 'CkBadgeLg',
        theme: 'badgeBrand',
        borderColor: 'borderBrandSubtle',
        round: 'radiusFull',
        alignSelf: 'center',
        text: '{{ pickerKicker | polyglot }}'
      },

      GameCards: {
        flow: 'x',
        align: 'stretch center',
        gap: 'spacing8',
        '@tabletS': { gap: 'spacing6' },
        flexWrap: 'wrap',
        width: '100%',
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
      }
    },

    // The product's one promise, in body copy.
    PickerHonesty: {
      tag: 'p',
      text: '{{ pickerHonesty | polyglot }}',
      fontFamily: 'sans',
      fontSize: 'fontMd',
      lineHeight: '1.7',
      color: 'body',
      textAlign: 'center',
      maxWidth: 'copyMax',
      margin: '0 0 spacing4'
    },

    // Staff door to the analytics console (docs/workspace.md).
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
