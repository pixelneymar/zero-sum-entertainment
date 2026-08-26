// Console panel: solid slate surface with a hairline border.
export const WsPanel = {
  tag: 'section',
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'A',
  padding: 'A',
  round: 'A',
  theme: 'wsPanel',
  border: '1px solid white.10',
  minWidth: '0',

  PanelHead: {
    flow: 'x',
    align: 'center space-between',
    gap: 'A',
    flexWrap: 'wrap',

    PanelTitle: {
      tag: 'h2',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      margin: '0'
    }
  }
}
