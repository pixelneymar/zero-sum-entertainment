// Start screen (SKILL.md hero, layout.md): a navy section with blurred
// atmosphere orbs, a flat copy column, and the two game cards in a CSS
// perspective container with a static 3D tilt and a mouse parallax. The
// parallax is rAF-throttled and switched off under prefers-reduced-motion.
let parallaxFrame = 0

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

  state: {
    rx: 4,
    ry: -8,
    motion: !(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  },
  // Native listener: the runtime does not wire onMouseMove. rAF-throttled;
  // skipped entirely under prefers-reduced-motion.
  onRender: (el, s) => {
    let motion = true
    try {
      motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {}
    if (!motion) {
      s.update({ motion: false })
      return
    }
    const node = el.node
    if (!node || node.__parallax) return
    node.__parallax = true
    const live = () => el.state || s
    node.addEventListener('mousemove', (e) => {
      if (parallaxFrame) return
      parallaxFrame = requestAnimationFrame(() => {
        parallaxFrame = 0
        const r = node.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        live().update({ rx: 4 - y * 8, ry: -8 + x * 12 })
      })
    })
    node.addEventListener('mouseleave', () => live().update({ rx: 4, ry: -8 }))
  },

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

    // The gallery (SKILL.md hero): a perspective context holding the main
    // glass panel, tilted in 3D and parallaxed; the cards float inside it and
    // a floating pill sits outside it, also rotated in 3D.
    Gallery: {
      position: 'relative',
      width: '100%',
      maxWidth: 'headerMax',
      marginBottom: 'spacing8',
      perspective: '1200px',

      // Floating pill (SKILL.md hero): the kicker, outside the panel.
      FloatingPill: {
        extends: 'CkBadgeLg',
        theme: 'badgeBrand',
        borderColor: 'borderBrandSubtle',
        round: 'radiusFull',
        backdropFilter: 'blur(1rem) saturate(1.4)',
        shadow: 'shadowLg',
        position: 'absolute',
        top: '0',
        left: '50%',
        zIndex: '1',
        transform: 'translate(-50%, -50%) translateZ(3rem) rotateX(4deg)',
        text: '{{ pickerKicker | polyglot }}'
      },

      // The main glass panel keeps the spec 6% fill: a 12% lift drops the
      // brand kicker inside the cards below 4.5:1.
      GalleryPanel: {
        theme: 'glass',
        backdropFilter: 'blur(1rem) saturate(1.4)',
        borderWidth: 'spacingPx',
        borderStyle: 'solid',
        borderColor: 'paper.10',
        round: 'radiusBase',
        shadow: 'shadow2xl',
        padding: 'spacing6',
        '@tabletS': { padding: 'spacing4' },
        transformStyle: 'preserve-3d',
        transition: 'transform .2s ease-out',
        '@reducedMotion': { transition: 'none' },
        transform: (el, s) => (s.motion ? `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)` : 'none'),

      GameCards: {
        flow: 'x',
        align: 'stretch center',
        gap: 'spacing6',
        flexWrap: 'wrap',
        width: '100%',
        transformStyle: 'preserve-3d',
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
