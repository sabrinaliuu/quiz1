import WmtsLayer from '../base/WmtsLayer.js'

export default class MapboxWmtsLayer extends WmtsLayer {
  constructor(mapInstance) {
    super(mapInstance);
    this.mapInstance = mapInstance;
    this.map = mapInstance.map;
    this.id = null;
  }

  async add(id) {

    if (!this.map) return;

    await this.mapInstance.waitForStyle();

    this.id = id;

    // if exist -> show
    if (this.map.getLayer(id)) {
      this.setVisible(true);
      return;
    }

    try{
  
    // get source
    if (!this.map.getSource(id)) {
      this.map.addSource(id, {
        type: 'raster',
        tiles: [
          'http://localhost:8080/data/road/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        bounds: [121.45, 24.95, 121.65, 25.21],
        maxzoom: 16
      });
    }

    // add layer
    this.map.addLayer({
      id,
      type: 'raster',
      source: id,
      layout: { visibility: 'visible' }
    });

    // order
    /*const layers = this.map.getStyle().layers;
    if (layers?.[1]) {
      this.map.moveLayer(id, layers[1].id);
    }*/
   } catch (error) {
      console.error("[Mapbox WMTS] load error:", error)
   }
  }

  setVisible(visible) {
    if (!this.map || !this.id|| !this.map.getLayer(this.id)) return;
    this.map.setLayoutProperty(
      this.id,
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
}