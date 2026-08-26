// <option> for the console selects. Child state: { value, label, selected }.
export const WsOption = {
  tag: 'option',
  value: (el, s) => String(s.value ?? ''),
  selected: (el, s) => !!s.selected,
  text: (el, s) => String(s.label ?? s.value ?? '')
}
