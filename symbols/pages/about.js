export const about = {
  extends: 'Page',
  flow: 'y',
  align: 'flex-start center',
  gap: 'C',
  width: '100%',
  minHeight: '100vh',

  metadata: {
    title: '{{ aboutMetaTitle | polyglot }}',
    description: '{{ aboutMetaDescription | polyglot }}'
  },

  SiteHeader: {},

  Intro: {
    tag: 'section',
    flow: 'y',
    align: 'flex-start flex-start',
    gap: 'A',
    padding: 'C B',
    width: '100%',
    maxWidth: '44em',

    IntroTitle: {
      tag: 'h1',
      text: '{{ aboutTitle | polyglot }}',
      fontSize: 'D',
      lineHeight: 'D',
      fontWeight: '700',
      letterSpacing: '-Y',
      margin: '0'
    },

    IntroBody: {
      tag: 'p',
      text: '{{ aboutBody | polyglot }}',
      fontSize: 'A2',
      lineHeight: 'C',
      theme: 'muted',
      margin: '0'
    },

    BackLink: {
      extends: 'Link',
      href: '/',
      text: '{{ backHome | polyglot }}',
      fontSize: 'A',
      fontWeight: '600',
      onClick: (e, el) => {
        e.preventDefault()
        el.router('/', el.getRoot())
      }
    }
  }
}
