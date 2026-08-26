export const main = {
  extends: 'Page',
  flow: 'y',
  align: 'flex-start center',
  gap: 'C',
  width: '100%',
  minHeight: '100vh',

  metadata: {
    title: '{{ homeMetaTitle | polyglot }}',
    description: '{{ homeMetaDescription | polyglot }}'
  },

  SiteHeader: {},

  Hero: {
    tag: 'section',
    flow: 'y',
    align: 'flex-start flex-start',
    gap: 'A',
    padding: 'C B',
    width: '100%',
    maxWidth: '48em',

    HeroTitle: {
      tag: 'h1',
      text: '{{ heroTagline | polyglot }}',
      fontSize: 'E',
      lineHeight: 'E',
      fontWeight: '700',
      letterSpacing: '-Y',
      margin: '0'
    },

    HeroLead: {
      tag: 'p',
      text: '{{ heroLead | polyglot }}',
      fontSize: 'B',
      lineHeight: 'C',
      theme: 'muted',
      margin: '0'
    },

    HeroAction: {
      extends: 'Button',
      text: '{{ heroAction | polyglot }}',
      theme: 'primary',
      padding: 'Z A',
      round: 'Y',
      onClick: (e, el) => el.router('/about', el.getRoot())
    }
  },

  Work: {
    tag: 'section',
    flow: 'y',
    align: 'flex-start flex-start',
    gap: 'B',
    padding: '0 B',
    width: '100%',

    WorkTitle: {
      tag: 'h2',
      text: '{{ workTitle | polyglot }}',
      fontSize: 'C',
      fontWeight: '600',
      letterSpacing: '-X',
      margin: '0'
    },

    ShowGrid: {}
  },

  Contact: {
    tag: 'section',
    flow: 'y',
    align: 'flex-start flex-start',
    gap: 'A',
    padding: 'C B',
    width: '100%',
    maxWidth: '40em',

    ContactTitle: {
      tag: 'h2',
      text: '{{ contactTitle | polyglot }}',
      fontSize: 'C',
      fontWeight: '600',
      letterSpacing: '-X',
      margin: '0'
    },

    ContactLead: {
      tag: 'p',
      text: '{{ contactLead | polyglot }}',
      fontSize: 'A',
      lineHeight: 'B',
      theme: 'muted',
      margin: '0'
    }
  }
}
