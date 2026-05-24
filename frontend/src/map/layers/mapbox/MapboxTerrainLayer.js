import TerrainLayer from '../base/TerrainLayer.js'

export default class MapboxTerrainLayer extends TerrainLayer {
  constructor(mapInstance) {
    super(mapInstance)
  }

  async add(id) {
    console.warn(`Terrain layer is not supported for Mapbox yet.`)
  }

  setVisible(visible){
    console.warn(`Terrain layer is not supported for Mapbox yet.`)
  }

}
