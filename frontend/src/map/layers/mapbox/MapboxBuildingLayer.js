import BuildingLayer from '../base/BuildingLayer.js'
import { useBuildingStore } from '@/store/buildingStore'

export default class MapboxBuildingLayer extends BuildingLayer {
  constructor(mapInstance) {
    super(mapInstance)
    this.mapInstance = mapInstance
    this.map = mapInstance.map
    this.id = null
  }
  
  async add(id) {
    const buildingStore = useBuildingStore();

    if (!this.map) return
    await this.mapInstance.waitForStyle()
    this.id = id

    // if exist -> visible
    if (this.map.getLayer(id)) {
      this.setVisible(true)
      return
    }

    try {

      // check buildingStore fetch data or not
      if (!buildingStore.buildingData){
        // no -> fetch and store
        buildingStore.buildingData = await buildingStore.fetchBuildingData();
      }

      // set layer
      if (!this.map.getSource(id)) {
        this.map.addSource(id, {
          type: 'geojson',
          data: buildingStore.buildingData
        })
      }
      this.map.addLayer({
        id,
        type: 'fill-extrusion',
        source: id,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.8
        }
      })
    } catch (error) {
      console.error("[Mapbox Building] load error:", error)
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