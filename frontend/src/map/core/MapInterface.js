export default class MapInterface {
  constructor() {
    this.mode = "";    
    this.isReady = false;
  }

  async init(container, onClickCallback) { throw new Error("init() must be implemented"); }
  destroy() { throw new Error("destroy() must be implemented"); }

  moveTo(lng, lat) { throw new Error("moveTo() must be implemented"); }
  getBounds() { throw new Error("getBounds() must be implemented"); }
  
}