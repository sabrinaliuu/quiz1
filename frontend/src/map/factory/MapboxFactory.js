import MapboxMap from "../core/MapboxMap"
import MapboxWmtsLayer from "../layers/mapbox/MapboxWmtsLayer"
import MapboxTerrainLayer from "../layers/mapbox/MapboxTerrainLayer"
import MapboxUbikeLayer from "../layers/mapbox/MapboxUbikeLayer"
import MapboxBuildingLayer from "../layers/mapbox/MapboxBuildingLayer"
import MapboxNavigationLayer from  "../layers/mapbox/MapboxNavigationLayer"

export default class MapboxFactory {

  createMap(container){
    return new MapboxMap(container)
  }

  createWmtsLayer(map){
    return new MapboxWmtsLayer(map)
  }

  createTerrainLayer(map) {
    return new MapboxTerrainLayer(map)
  }

  createUbikeLayer(map){
    return new MapboxUbikeLayer(map)
  }

  createBuildingLayer(map){
    return new MapboxBuildingLayer(map)
  }

  createNavigationLayer(map){
    return new MapboxNavigationLayer(map)
  }
}