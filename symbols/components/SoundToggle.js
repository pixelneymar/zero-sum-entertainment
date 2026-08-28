// Mute control for the result and lock cues (Web Audio, see globalScope.js
// audioCue). 44px icon button with aria-pressed; the preference persists.
export const SoundToggle = {
  extends: 'CkButtonSecondary',
  round: 'radiusFull',
  padding: '0',
  width: 'touchMin',
  height: 'touchMin',
  minHeight: 'touchMin',
  attr: {
    type: 'button',
    'aria-pressed': (el, s) => (s.sound === false ? 'false' : 'true'),
    'aria-label': (el, s) => (s.sound === false ? s.soundOff || 'Sound off' : s.soundOn || 'Sound on')
  },
  onClick: (e, el) => el.call('toggleSound'),

  OnIcon: { extends: 'Icon', name: 'volume', boxSize: 'icon20', attr: { 'aria-hidden': 'true' }, display: (el, s) => (s.sound === false ? 'none' : 'block') },
  OffIcon: { extends: 'Icon', name: 'volumeX', boxSize: 'icon20', attr: { 'aria-hidden': 'true' }, display: (el, s) => (s.sound === false ? 'block' : 'none') }
}
