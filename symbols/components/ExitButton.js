// Leave the stage. The engine tears the round down (backToPicker).
// Small secondary button (buttons.md dashboard rule) with an outline icon.
export const ExitButton = {
  extends: 'CkButtonSecondary',
  padding: 'spacing2 spacing3',
  attr: { type: 'button' },
  onClick: (e, el) => el.call('backToPicker'),

  ExitGlyph: { extends: 'Icon', name: 'arrowLeft', boxSize: 'icon16', attr: { 'aria-hidden': 'true' } },
  ExitLabel: { tag: 'span', text: '{{ exitStage | polyglot }}' }
}
