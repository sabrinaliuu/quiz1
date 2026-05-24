import * as Cesium from 'cesium'
import WMTSLayer from '../base/WMTSLayer.js'

export default class CesiumWMTSLayer extends WMTSLayer {
  constructor(map) {
    super(map)
    this.viewer = map.viewer
    this.id = null
  }

  async add(id) {

    if (!this.viewer) return
    this.id = id

    // if exist -> show
    const existing = this._getLayer()
    if (existing) {
      existing.show = true
      return existing
    }

    try {
      // get wmts service
      const imgProvider = new Cesium.UrlTemplateImageryProvider({
        name: this.id,
        url: 'http://localhost:8080/data/road/{z}/{x}/{y}.png',
        minimumLevel: 5,
        maximumLevel: 16,
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        rectangle: this.map.taipeiRectangle
      })

      const layer = this.viewer.imageryLayers.addImageryProvider(imgProvider)
      layer.name = id

      return layer

    } catch (error) {
      console.error("[Cesium WMTS] load error:", error)
    }
  }

  setVisible(visible) {
    const layer = this._getLayer()
    layer.show = visible
  }

  _getLayer() {
    if (!this.viewer || !this.id) return null
    const layers = this.viewer.imageryLayers._layers
    return layers.find(l => l?.name === this.id)
  }
}