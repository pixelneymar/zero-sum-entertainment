// The footage itself. The engine owns playback (play/pause/seek) through the
// <video> node it receives from registerVideo — this element never calls
// play() or pause() on its own.
export const VideoSurface = {
  tag: 'video',
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  background: 'videoBlack',

  src: (el, s) => (s.game && s.game.videoSrc) || null,

  attr: {
    playsinline: 'true',
    muted: 'true',
    preload: 'auto',
    poster: (el, s) =>
      s.game && s.game.slug ? `/assets/posters/${s.game.slug.split('_')[0]}.jpg` : null
  },

  onRender: (el) => el.call('registerVideo')
}
