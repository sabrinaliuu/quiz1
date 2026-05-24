import * as Cesium from 'cesium'
import TerrainLayer from '../base/TerrainLayer.js'

export default class CesiumTerrainLayer extends TerrainLayer {
  constructor(map) {
    super(map)
    this.viewer = map.viewer
    this.id = null

    // terrain providers
    this.customTerrainProvider = null
    this.defaultTerrainProvider = new Cesium.EllipsoidTerrainProvider()

    // status
    this.isCustomActive = false
  }

  async add(id) {

    if (!this.viewer) return

    this.id = id

    // if loaded -> only switch
    if (this.customTerrainProvider) {
      this._applyTerrain(true)
      return this.customTerrainProvider
    }

    try {
      // get custom terrain provider
      this.customTerrainProvider =
        await Cesium.CesiumTerrainProvider.fromUrl(
          'http://localhost:8081/terrain'
        )
      return this.customTerrainProvider

    } catch (error) {
      console.error("[Cesium Terrain] loading error:", error)
    }
  }

  setVisible(visible) {
    this._applyTerrain(visible)
  }

  _applyTerrain(useCustom) {

    if (!this.viewer) return

    // visibility: true -> add terrain
    if (useCustom && this.customTerrainProvider) {
      this.viewer.terrainProvider = this.customTerrainProvider
      this.viewer.scene.globe.depthTestAgainstTerrain = true
      this.isCustomActive = true
      return
    }

    // visibility: false -> back to flat earth
    this.viewer.terrainProvider = this.defaultTerrainProvider
    this.viewer.scene.globe.depthTestAgainstTerrain = false
    this.isCustomActive = false
  }
}