import NavigationLayer from '../base/NavigationLayer.js'

export default class MapboxNavigationLayer extends NavigationLayer {
  constructor(mapInstance) {
    super(mapInstance)

    this.mapInstance = mapInstance
    this.map = mapInstance.map

    this.id = 'navigation-layer'

    this.sourceId = 'route-data'
    this.movingSourceId = 'route-moving-point'
    this.isInitialized = false
  }

  async add(allSegments) {

    if (!this.map) return

    await this.mapInstance.waitForStyle()

    try {

      // cleanup old routes
      this._cleanup()

      // find routes bbox
      const coords = allSegments.flatMap(seg => seg.coords)
      if (coords.length > 0) {
        const bbox = [
          [
            Math.min(...coords.map(c => c[0])),
            Math.min(...coords.map(c => c[1]))
          ],
          [
            Math.max(...coords.map(c => c[0])),
            Math.max(...coords.map(c => c[1]))
          ]
        ]
        this.map.fitBounds(bbox, { padding: 150 })
      }

      // route features
      // -- line-- 
      const routeFeatures = allSegments.map(seg => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: seg.coords
        },
        properties: { mode: seg.mode }
      }))
      // --------
      // -- points --
      const pointFeatures = allSegments.map((seg, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: seg.coords[0]
        },
        properties: {
          label: String.fromCharCode(65 + index),
          title: `Station ${String.fromCharCode(65 + index)}`
        }
      }))

      const lastSeg = allSegments[allSegments.length - 1]

      pointFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: lastSeg.coords[lastSeg.coords.length - 1]
        },
        properties: {
          label: String.fromCharCode(65 + allSegments.length),
          title: `Station ${String.fromCharCode(65 + allSegments.length)}`
        }
      })
      // --------

      // add source
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [...routeFeatures, ...pointFeatures]
        }
      })

      // add layers
      this.map.addLayer({
        id: 'route-line',
        type: 'line',
        source: this.sourceId,
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': [
            'match',
            ['get', 'mode'],
            'cycling', '#10b981',
            'walking', '#e67a67',
            '#888888'
          ],
          'line-width': 6
        }
      })

      this.map.addLayer({
        id: 'route-points',
        type: 'circle',
        source: this.sourceId,
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 10,
          'circle-color': '#363636',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      })

      this.map.addLayer({
        id: 'route-labels',
        type: 'symbol',
        source: this.sourceId,
        filter: ['==', ['geometry-type'], 'Point'],
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      })

      this.isInitialized = true

    } catch (error) {
      console.error("[Mapbox Navigation] load error:", error)
    }
  }

  // simulation: 2d animation
  async startSimulation(allSegments) {

    this._addMovingPointSource(allSegments[0].coords[0])

    // make point for each step -> for loop for creating animation
    for (const segment of allSegments) {
      this.map.setPaintProperty(
        'route-moving-point-layer',
        'circle-color',
        segment.mode === 'cycling' ? '#10b981' : '#e67a67'
      )
      await this._animateLine(segment.coords, segment.mode)
    }
  }

  // moving point for 2d animation
  _addMovingPointSource(initialCoord) {
    if (this.map.getSource(this.movingSourceId)) return
    this.map.addSource(this.movingSourceId, {
      type: 'geojson',
      data: {
        type: 'Point',
        coordinates: initialCoord
      }
    })

    this.map.addLayer({
      id: 'route-moving-point-layer',
      type: 'circle',
      source: this.movingSourceId,
      paint: {
        'circle-radius': 6,
        'circle-color': '#e67a67',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#fff'
      }
    })
  }

  // make animation
  _animateLine(coords, mode) {

    return new Promise((resolve) => {

      let i = 0
      let lastTime = 0

      const fps = mode === 'cycling' ? 15 : 5
      const interval = 1000 / fps

      const animate = (timestamp) => {
        if (i < coords.length) {
          if (timestamp - lastTime >= interval) {
            this.map.getSource(this.movingSourceId)
              .setData({
                type: 'Point',
                coordinates: coords[i]
              })
            i++
            lastTime = timestamp
          }
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }

      this.map.moveLayer('route-points')
      this.map.moveLayer('route-labels')

      requestAnimationFrame(animate)
    })
  }

  setVisible(visible) {

    if (!this.map) return

    const state = visible ? 'visible' : 'none'
    const layers = this.map.getStyle().layers || []

    // control visibility for all layers start with "route-"
    layers.forEach(layer => {
      if (layer.id.startsWith("route-")) {
        if (this.map.getLayer(layer.id)) {
          this.map.setLayoutProperty(
            layer.id,
            "visibility",
            state
          )
        }
      }
    })
  }

  _cleanup() {

    const ids = [
      'route-line',
      'route-points',
      'route-labels',
      'route-moving-point-layer'
    ]

    ids.forEach(id => {
      if (this.map.getLayer(id)) this.map.removeLayer(id)
    })

    if (this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId)
    }

    if (this.map.getSource(this.movingSourceId)) {
      this.map.removeSource(this.movingSourceId)
    }
  }
}