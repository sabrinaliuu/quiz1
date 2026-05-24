export default class WMTSLayer {
  /** @param {import('../../core/MapInterface').default} map */
  constructor(map) {
    this.map = map
  }

  add(id) {
    throw new Error('WMTSLayer.add() not implemented')
  }

  setVisible(visible) { 
    throw new Error("setVisible() must be implemented by concrete subclass"); 
  }
}
