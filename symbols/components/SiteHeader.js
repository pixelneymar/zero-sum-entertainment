export const SiteHeader = {
  tag: 'header',
  flow: 'x',
  align: 'center space-between',
  gap: 'B',
  padding: 'A B',
  width: '100%',
  borderBottom: '1px solid neutral.2',

  Brand: {
    extends: 'Link',
    href: '/',
    text: '{{ brandName | polyglot }}',
    fontSize: 'B',
    fontWeight: '700',
    letterSpacing: '-X',
    textDecoration: 'none',
    cursor: 'pointer',
    onClick: (e, el) => {
      e.preventDefault()
      el.router('/', el.getRoot())
    }
  },

  PrimaryNav: {
    tag: 'nav',
    flow: 'x',
    align: 'center flex-end',
    gap: 'Z',
    childExtends: 'NavLink',

    Work: { href: '/', text: '{{ navWork | polyglot }}' },
    About: { href: '/about', text: '{{ navAbout | polyglot }}' }
  }
}
