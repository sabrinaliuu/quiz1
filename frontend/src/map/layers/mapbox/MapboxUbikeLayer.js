import UBikeLayer from '../base/UBikeLayer.js'

export default class MapboxUBikeLayer extends UBikeLayer {
  constructor(mapInstance) {
    super(mapInstance)

    this.mapInstance = mapInstance
    this.map = mapInstance.map
    this.id = null

    this.clickListener = null // click handler cache

    this.isInitialized = false
  }

  async add(id, data, onClickCallback, dataKey = 'available_return_bikes') {

    if (!this.map) return

    await this.mapInstance.waitForStyle()

    this.id = id

    const circleColorExpression = [
      'step', ['get', dataKey],
      '#ef4444', 1,
      '#f59e0b', 5,
      '#10b981'
    ]

    try {

      // update existing source
      const source = this.map.getSource(this.id)
      if (source) {
        source.setData(data)
        this.map.setPaintProperty(
          this.id,
          'circle-color',
          circleColorExpression
        )
        return
      }

      // add layer
      this.map.addSource(this.id, {
        type: 'geojson',
        data
      })

      this.map.addLayer({
        id: this.id,
        source: this.id,
        type: 'circle',
        paint: {
          'circle-radius': 8,
          'circle-color': circleColorExpression,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })

      this.isInitialized = true

      // click listener
      if (this.clickListener) {
        this.map.off('click', this.id, this.clickListener)
      }

      this.clickListener = (e) => {
        if (!e.features?.length) return
        const feature = e.features[0]
        const coordinates = feature.geometry.coordinates.slice()
        const pixel = this.map.project(coordinates)
        onClickCallback({
          data: feature.properties,
          pixel: { x: pixel.x, y: pixel.y }
        })
      }
      this.map.on('click', this.id, this.clickListener)

    } catch (error) {
      console.error("[Mapbox UBike] load error:", error)
    }
  }

  setVisible(visible) {
    if (!this.map || !this.map.getLayer(this.id)) return
    this.map.setLayoutProperty(
      this.id,
      "visibility",
      visible ? "visible" : "none"
    )
  }
}