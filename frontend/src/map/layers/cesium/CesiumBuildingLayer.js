import * as Cesium from 'cesium'
import BuildingLayer from '../base/BuildingLayer.js'

export default class CesiumBuildingLayer extends BuildingLayer {
  constructor(map) {
    super(map)
    this.viewer = map.viewer
    this.tileset = null
  }

  async add(id) {

    if (!this.viewer) return

    // if exist -> visible
    if (this.tileset) {
      this.tileset.show = true
      return this.tileset
    }

    const tilesetUrl = "http://localhost:8081/building/tileset.json"

    try {

      // get 3d tile service
      const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl)

      // set layer: primitives
      tileset.style = new Cesium.Cesium3DTileStyle({
        color: "color('#aaa', 0.4)"
      })
      this.viewer.scene.primitives.add(tileset)

      // cache
      this.tileset = tileset
      this.tileset._layerId = id

      return tileset

    } catch (error) {
      console.error("[Cesium Building] load error:", error)
    }
  }

  setVisible(visible) {
    if (!this.tileset) return
    this.tileset.show = visible // control by show in cesium
  }
}