// Project icons. Each entry is an <svg> string; the runtime converts it to a
// sprite <symbol id="<name>"> and `Icon: { name }` renders a <use> of it.
// Paths only, with presentation attributes on the shapes: the converter
// strips width/height attributes and the root <svg> attributes.
export default {
  lock:
    '<svg viewBox="0 0 24 24"><path d="M6.5 10.5h11a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18v-5a2.5 2.5 0 0 1 2.5-2.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  refresh:
    '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  download:
    '<svg viewBox="0 0 24 24"><path d="M12 4v11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M7.5 10.5 12 15l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 19h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
}
