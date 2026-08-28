// Leave the stage. The engine tears the round down (backToPicker).
// Small secondary button (buttons.md) with an outline icon.
export const ExitButton = {
  extends: 'CkButtonSecondary',
  attr: { type: 'button' },
  onClick: (e, el) => el.call('backToPicker'),

  ExitGlyph: { extends: 'Icon', name: 'arrowLeft', boxSize: 'icon16', attr: { 'aria-hidden': 'true' } },
  ExitLabel: { tag: 'span', text: '{{ exitStage | polyglot }}' }
}
