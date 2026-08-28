// The bet dock (TypeUI section 4, widget). Two challenger cards: tap one, then
// PLACE BET. The stake is standard (20 chips) and the bet is a side, nothing
// more. Picks go through setSide, the bet through submitBet; the server is
// the only judge. A raised widget card (cards.md, 20px widget padding).
export const BetPanel = {
  extends: 'CkCard',
  tag: 'section',
  attr: { 'aria-label': 'Place your bet' },
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'spacing4',
  padding: 'spacing5',
  width: 'dock',
  maxWidth: '94vw',
  display: (el, s) =>
    s.screen === 'playing' &&
    (s.phase === 'preview' || s.phase === 'betting' || s.phase === 'locked')
      ? 'flex'
      : 'none',

  HeadRow: {
    flow: 'x',
    align: 'flex-start space-between',
    gap: 'spacing4',
    flexWrap: 'wrap',

    PromptBlock: {
      flow: 'y',
      align: 'flex-start flex-start',
      gap: 'spacing1',
      minWidth: '0',

      BetPrompt: { extends: 'CkEyebrow', text: '{{ betPrompt | polyglot }}' },

      // Widget title (typography.md widget-title: 20px medium).
      ObjectiveText: {
        tag: 'h2',
        fontFamily: 'sans',
        fontSize: 'fontXl',
        lineHeight: '1.3',
        fontWeight: '500',
        color: 'heading',
        margin: '0',
        text: (el, s) => (s.game ? s.game.objectiveLine : '')
      }
    },

    TargetChip: {
      extends: 'CkBadgeBordered',
      theme: 'badgeNeutral',
      padding: 'spacing1 spacing2',
      fontSize: 'fontSm',
      TargetText: { tag: 'span', text: (el, s) => (s.game ? s.game.targetLine : '') }
    }
  },

  Sides: {
    flow: 'x',
    align: 'stretch center',
    gap: 'spacing3',
    attr: { role: 'group', 'aria-label': 'Who lands closer?' },
    childrenAs: 'state',
    children: (el, s) => (s.game && s.game.challengers ? s.game.challengers : []),
    childExtends: 'ChallengerCard'
  },

  ActionRow: {
    flow: 'x',
    align: 'center space-between',
    gap: 'spacing4',
    flexWrap: 'wrap',

    NoteBlock: {
      flow: 'y',
      align: 'flex-start flex-start',
      gap: 'spacing1',
      minWidth: '0',

      StakeNote: {
        tag: 'span',
        fontSize: 'fontSm',
        lineHeight: '1.3',
        color: 'bodySubtle',
        text: '{{ rakeNote | polyglot }}'
      },

      // Inline reason for a disabled PLACE BET (fundamentals: disabled state
      // answers "what would unblock this?").
      DisabledReason: {
        tag: 'span',
        fontSize: 'fontSm',
        lineHeight: '1.3',
        fontWeight: '500',
        color: 'heading',
        attr: { 'aria-live': 'polite' },
        display: (el, s) => (!s.myBet && (s.phase === 'preview' || (s.phase === 'betting' && !s.mySide)) ? 'inline' : 'none'),
        PreviewReason: { tag: 'span', text: '{{ betsOpenSoon | polyglot }}', display: (el, s) => (s.phase === 'preview' ? 'inline' : 'none') },
        PickReason: { tag: 'span', text: '{{ pickFirst | polyglot }}', display: (el, s) => (s.phase === 'betting' && !s.mySide ? 'inline' : 'none') }
      }
    },

    // Success state: icon + label + the backed side (badges.md success).
    PlacedRow: {
      extends: 'CkBadgeBordered',
      theme: 'badgeSuccess',
      padding: 'spacing2 spacing3',
      fontSize: 'fontMd',
      gap: 'spacing1_5',
      attr: { role: 'status', 'aria-live': 'polite' },
      display: (el, s) => (s.myBet ? 'inline-flex' : 'none'),

      Icon: { name: 'check', boxSize: 'icon16', attr: { 'aria-hidden': 'true' } },
      PlacedLabel: { tag: 'span', fontWeight: '700', text: '{{ betPlaced | polyglot }}' },
      PlacedOn: {
        tag: 'span',
        text: (el, s) => {
          if (!s.myBet || !s.game || !s.game.challengers) return ''
          const c = s.game.challengers[s.myBet.side - 1]
          return c ? `· ${c.name}` : ''
        }
      },
      PlacedStake: {
        tag: 'span',
        text: (el, s) => (s.myBet ? `· ${s.myBet.stake} ${s.chipsUnit || 'chips'}` : '')
      }
    },

    PlaceButton: {
      extends: 'CkButtonPrimary',
      attr: {
        type: 'button',
        disabled: (el, s) => (s.phase === 'betting' && s.mySide && !s.myBet ? undefined : 'true'),
        'aria-disabled': (el, s) => (s.phase === 'betting' && s.mySide && !s.myBet ? 'false' : 'true')
      },
      display: (el, s) => (s.myBet ? 'none' : 'inline-flex'),
      opacity: (el, s) => (s.phase === 'betting' && s.mySide ? '1' : '.5'),
      ':disabled': { cursor: 'not-allowed' },
      onClick: (e, el, s) => {
        if (s.myBet || s.phase !== 'betting') return
        // The server's place_bet is the only judge: a rejection surfaces via
        // state.error while myBet stays null. No side picked, same path.
        el.call('submitBet', s.mySide)
      },

      PlaceLabel: { tag: 'span', text: '{{ placeBet | polyglot }}' },
      PlaceSide: {
        tag: 'span',
        text: (el, s) => {
          if (!s.mySide || !s.game || !s.game.challengers) return ''
          const c = s.game.challengers[s.mySide - 1]
          return c ? `· ${c.name}` : ''
        }
      }
    },

    LockedNote: {
      extends: 'CkBadgeBordered',
      theme: 'badgeAlt',
      padding: 'spacing2 spacing3',
      fontSize: 'fontMd',
      gap: 'spacing1_5',
      attr: { role: 'status' },
      display: (el, s) => (s.phase === 'locked' ? 'inline-flex' : 'none'),

      Icon: { name: 'lock', boxSize: 'icon16', attr: { 'aria-hidden': 'true' } },
      LockedText: { tag: 'span', fontWeight: '700', text: '{{ betsLocked | polyglot }}' }
    }
  }
}
