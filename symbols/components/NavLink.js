export const NavLink = {
  extends: 'Link',
  fontSize: 'Z',
  fontWeight: '500',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  textDecoration: 'none',
  padding: 'X Y',
  round: 'Y',
  cursor: 'pointer',
  transition: 'A defaultBezier',
  transitionProperty: 'color, background',

  ':hover': { theme: 'primary' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },

  onClick: (e, el) => {
    e.preventDefault()
    el.router(el.href, el.getRoot())
  }
}
