import MapboxFactory from "./MapboxFactory"
import CesiumFactory from "./CesiumFactory"


export default class MapFactory {

  createMap(container) {
    throw new Error("Abstract method 'createMap' must be implemented.");
  }

  createWmtsLayer(map) {
    throw new Error("Abstract method 'createWmtsLayer' must be implemented.");
  }

  createTerrainLayer(map) {
    throw new Error("Abstract method 'createTerrainLayer' must be implemented.");
  }

  createUbikeLayer(map) {
    throw new Error("Abstract method 'createUbikeLayer' must be implemented.");
  }

  createBuildingLayer(map) {
    throw new Error("Abstract method 'createBuildingLayer' must be implemented.");
  }

  createNavigationLayer(map) {
    throw new Error("Abstract method 'createNavigationLayer' must be implemented.");
  }
}

export function createMapFactory(type){
  if(type === "mapbox"){
    return new MapboxFactory()
  }
  if(type === "cesium"){
    return new CesiumFactory()
  }
}