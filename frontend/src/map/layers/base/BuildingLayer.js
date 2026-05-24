export default class BuildingLayer {
  constructor(map) {
    this.map = map
  }

  add(id) {
    throw new Error('BuildingLayer.add() not implemented')
  }

  setVisible(visible) { 
    throw new Error("setVisible() must be implemented by concrete subclass"); 
  }
}
