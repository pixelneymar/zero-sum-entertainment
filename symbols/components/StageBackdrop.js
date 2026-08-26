// Blurred, darkened still of the current game behind the letterboxed frame,
// so the bars around a 16:9 video read as atmosphere instead of dead black.
export const StageBackdrop = {
  position: 'absolute',
  inset: '0 0 0 0',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundImage: (el, s) =>
    s.game && s.game.slug
      ? `url(/assets/posters/${s.game.slug.split('_')[0]}.jpg)`
      : 'none',
  filter: 'blur(2.6rem) brightness(.32) saturate(1.25)',
  transform: 'scale(1.12)',
  pointerEvents: 'none'
}
