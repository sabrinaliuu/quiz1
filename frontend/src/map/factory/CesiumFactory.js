import CesiumMap from "../core/CesiumMap"
import CesiumWmtsLayer from "../layers/cesium/CesiumWmtsLayer"
import CesiumTerrainLayer from "../layers/cesium/CesiumTerrainLayer"
import CesiumUbikeLayer from "../layers/cesium/CesiumUbikeLayer"
import CesiumBuildingLayer from "../layers/cesium/CesiumBuildingLayer"
import CesiumNavigationLayer from  "../layers/cesium/CesiumNavigationLayer"

export default class CesiumFactory {

  createMap(container){
    return new CesiumMap(container)
  }

  createWmtsLayer(map){
    return new CesiumWmtsLayer(map)
  }

  createTerrainLayer(map) {
    return new CesiumTerrainLayer(map)
  }

  createUbikeLayer(map){
    return new CesiumUbikeLayer(map)
  }

  createBuildingLayer(map){
    return new CesiumBuildingLayer(map)
  }

  createNavigationLayer(map){
    return new CesiumNavigationLayer(map)
  }
}