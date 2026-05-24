export default class RouteLayer {
  constructor(map) {
    this.map = map
  }

  /**
   * @param {Array<{coords: number[][], mode: string}>} allSegments
   */
  add(allSegments) {
    throw new Error('RouteLayer.add() not implemented')
  }

  setVisible(visible) { 
    throw new Error("setVisible() must be implemented by concrete subclass"); 
  }

  async startSimulation(allSegments) { throw new Error("..."); }
}
