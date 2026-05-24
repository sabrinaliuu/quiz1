export default class UBikeLayer {
  constructor(map) {
    this.map = map
  }

  /**
   * @param {string} id
   * @param {object|string} data  ubikeStore (geojson format)
   * @param {Function} onClickCallback
   * @param {string} dataKey  for rent or for return
   */
  add(id, data, onClickCallback, dataKey) {
    throw new Error('UBikeLayer.add() not implemented')
  }

  setVisible(visible) { 
    throw new Error("setVisible() must be implemented by concrete subclass"); 
  }
}
