export default class TerrainLayer {
  constructor(map) {
    this.map = map
  }

  add(id) {
    throw new Error('TerrainLayer.add() not implemented')
  }

  setVisible(visible) { 
    throw new Error("setVisible() must be implemented by concrete subclass"); 
  }
}
