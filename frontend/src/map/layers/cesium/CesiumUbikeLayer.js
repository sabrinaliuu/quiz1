import * as Cesium from 'cesium'
import UBikeLayer from '../base/UBikeLayer.js'

export default class CesiumUBikeLayer extends UBikeLayer {
  constructor(map) {
    super(map)

    this.viewer = map.viewer
    this.id = null

    this.dataSource = null
    this.handler = null

    this.onClickCallback = null
  }

  async add(id, data, onClickCallback, dataKey = 'available_return_bikes') {
    if (!this.viewer) return

    this.id = id
    this.onClickCallback = onClickCallback

    try {

      // remove exist datasource
      if (this.dataSource) {
        this.viewer.dataSources.remove(this.dataSource, true)
        this.dataSource = null
      }

      // load new / update data
      this.dataSource = await Cesium.GeoJsonDataSource.load(data)
      this.dataSource.name = id
      await this.viewer.dataSources.add(this.dataSource)

      // add layer
      const entities = this.dataSource.entities.values
      for (const entity of entities) {

        const val = entity.properties?.[dataKey]?.getValue?.() || 0
        let color = Cesium.Color.fromCssColorString('#10b981')
        if (val < 1) {
          color = Cesium.Color.fromCssColorString('#ef4444')
        } else if (val < 5) {
          color = Cesium.Color.fromCssColorString('#f59e0b')
        }

        entity.point = new Cesium.PointGraphics({
          pixelSize: 10,
          color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        })
      }

      // click handler
      if (!this.handler) {
        this.handler = new Cesium.ScreenSpaceEventHandler(
          this.viewer.scene.canvas
        )
        this.handler.setInputAction((movement) => {
          const picked = this.viewer.scene.pick(movement.position)
          if (!Cesium.defined(picked)) return
          const entity = picked.id

          if (!entity || !entity.properties) return
          const properties = {}
          entity.properties.propertyNames.forEach(name => {
            properties[name] =
              entity.properties[name]?.getValue?.()
          })

          if (this.onClickCallback) {
            this.onClickCallback({
              data: properties,
              pixel: movement.position
            })
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
      }

    } catch (error) {
      console.error("[Cesium UBike] load error:", error)
    }
  }

  setVisible(visible) {
    if (!this.dataSource) return
    this.dataSource.show = visible
  }
}