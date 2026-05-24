import * as Cesium from 'cesium'
import NavigationLayer from '../base/NavigationLayer.js'

export default class CesiumNavigationLayer extends NavigationLayer {

  constructor(map) {
    super(map)

    this.viewer = map.viewer
    this.entities = map.viewer?.entities

    this.id = 'navigation-layer'
    this.paddedRectangle =  map.viewer.camera.computeViewRectangle()

    // 3D navigation state
    this.navEntity = null
    this.movingEntity = null
    this.removeCameraListener = null

  }

  async add(allSegments) {


    if (!this.viewer || !this.entities) return

    try {

      // cleanup old routes
      const toRemove = []

      this.entities.values.forEach(e => {
        if (e.id &&
          (e.id.startsWith('route-line-') ||
           e.id.startsWith('route-points-') ||
           e.id.startsWith('route-label-'))) {
          toRemove.push(e)
        }
      })
      toRemove.forEach(e => this.entities.remove(e))

      // find routes bbox
      const allCoords = allSegments.flatMap(seg => seg.coords)
      const lons = allCoords.map(c => c[0])
      const lats = allCoords.map(c => c[1])
      const rectangle = Cesium.Rectangle.fromDegrees(
        Math.min(...lons),
        Math.min(...lats),
        Math.max(...lons),
        Math.max(...lats)
      )
      const wm = (rectangle.east - rectangle.west) * 0.15
      const hm = (rectangle.north - rectangle.south) * 0.15
      this.paddedRectangle = new Cesium.Rectangle(
        rectangle.west - wm,
        rectangle.south - hm,
        rectangle.east + wm,
        rectangle.north + hm
      )

      this.viewer.camera.flyTo({
        destination: this.paddedRectangle,
        duration: 1.0
      })

      // route lines
      allSegments.forEach((seg, index) => {
        const color =
          seg.mode === 'cycling'
            ? Cesium.Color.fromCssColorString('#10b981')
            : Cesium.Color.fromCssColorString('#e67a67')
        this.entities.add({
          id: `route-line-${index}`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(seg.coords.flat()),
            width: 6,
            material: color,
            clampToGround: true,
            classificationType: Cesium.ClassificationType.TERRAIN
          }
        })
      })

      // route points
      const routePoints = allSegments.map(seg => seg.coords[0])
      const lastSeg = allSegments[allSegments.length - 1]
      routePoints.push(lastSeg.coords[lastSeg.coords.length - 1])
      routePoints.forEach((coord, index) => {
        const labelText = String.fromCharCode(65 + index)

        const h = this._getGroundHeight(coord[0], coord[1]);
        // points
        this.entities.add({
          id: `route-points-${index}`,
          position: Cesium.Cartesian3.fromDegrees(coord[0], coord[1], h),
          point: {
            pixelSize: 14,
            color: Cesium.Color.fromCssColorString('#363636'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          }
        });

        // labels
        this.entities.add({
          id: `route-label-${index}`,
          position: Cesium.Cartesian3.fromDegrees(coord[0], coord[1], h),
          label: {
            text: labelText,
            font: '12pt Open Sans Bold',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            pixelOffset: new Cesium.Cartesian2(0, -16) //above point
          }
        });
      })

    } catch (error) {
      console.error("[Cesium Navigation] load error:", error)
    }
  }

  // simulation: 2d animation
  async startSimulation(allSegments) {

    if (!this.entities) return

    if (this.movingEntity) {
      this.entities.remove(this.movingEntity)
      this.movingEntity = null
    }

    // moving point for 2d animation
    this.movingEntity = this.entities.add({
      id: 'route-animation',
      point: {
        pixelSize: 12,
        color: Cesium.Color.ORANGE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    })

    // make point for each step -> for loop for creating animation
    for (const segment of allSegments) {
      this.movingEntity.point.color =
        segment.mode === 'cycling'
          ? Cesium.Color.fromCssColorString('#10b981')
          : Cesium.Color.fromCssColorString('#e67a67')
      await this._animateLine(segment.coords)
    }

  }

  // make animation
  _animateLine(coords) {

    return new Promise((resolve) => {

      let i = 0
      let lastTime = 0
      const fps = 10
      const interval = 1000 / fps

      const animate = (timestamp) => {
        if (i < coords.length) {
          if (timestamp - lastTime >= interval) {
            this.movingEntity.position =
              Cesium.Cartesian3.fromDegrees(
                coords[i][0],
                coords[i][1]
              )
            i++
            lastTime = timestamp
          }
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      requestAnimationFrame(animate)
    })
  }

  // 3d navigation
  async _navigation(atoB, btoC, ctoD) {

    const viewer = this.viewer
    if (!viewer) return

    const scene = viewer.scene
    const positionProperty = new Cesium.SampledPositionProperty() // for simulating dynamic motion
    const start = viewer.clock.currentTime // start time
    let currentTimeOffset = 0

    if (this.navEntity) {
      viewer.entities.remove(this.navEntity)
      this.navEntity = null
    }

    if (this.removeCameraListener) {
      this.removeCameraListener()
      this.removeCameraListener = null
    }

    // generate all with height and time progress -> add into posotionProperty
    [atoB, btoC, ctoD].forEach((data) => {
      if (!data?.routes?.[0]) return
      const coords = data.routes[0].geometry.coordinates
      const duration = data.routes[0].duration

      coords.forEach((coord, index) => {

        const timeProgress = (index / (coords.length - 1)) * duration

        const time = Cesium.JulianDate.addSeconds(
          start,
          currentTimeOffset + timeProgress,
          new Cesium.JulianDate()
        )

        const h = this._getGroundHeight(coord[0], coord[1])
        positionProperty.addSample(
          time,
          Cesium.Cartesian3.fromDegrees(coord[0], coord[1], h + 2)
        )
      })

      currentTimeOffset += duration
    })

    const stop = Cesium.JulianDate.addSeconds(
      start,
      currentTimeOffset,
      new Cesium.JulianDate()
    )

    viewer.clock.stopTime = stop.clone() //end time 

    positionProperty.setInterpolationOptions({ //interpolation for route
      interpolationDegree: 1,
      interpolationAlgorithm: Cesium.LinearApproximation
    })

    // add entity .gltf for navigation
    this.navEntity = viewer.entities.add({
      position: positionProperty,
      orientation: new Cesium.VelocityOrientationProperty(positionProperty),
      model: {
        uri: 'data/shiba/scene.gltf',
        minimumPixelSize: 128,
        scale: 1.0
      }
    });

    const offset = new Cesium.Cartesian3(-30.0, 0.0, 5.0); // camera position related to entity
    this.removeCameraListener = scene.preUpdate.addEventListener(() => {
      const time = viewer.clock.currentTime
      const pos = positionProperty.getValue(time) // entity position (xyz Cartesian3)
      const ori = this.navEntity?.orientation?.getValue(time) // entity quaternion

      if (Cesium.defined(pos) && Cesium.defined(ori)) {
        const m3 = Cesium.Matrix3.fromQuaternion(ori, new Cesium.Matrix3()) // quaternion to 3*3 matrix
        const m4 = Cesium.Matrix4.fromRotationTranslation(m3, pos) // 3*3 matrix with xyz -> 4*4 matrix -> entity-centerd coordinate
        viewer.camera.lookAtTransform(m4, offset) // lock camera posotion/view on entity
      }
    })

    viewer.clock.multiplier = 8
    viewer.clock.shouldAnimate = true
    
  }

  // stop 3d and back to 2d
  _resetCameraTo2D() {

    const viewer = this.viewer
    if (!viewer) return
    viewer.clock.shouldAnimate = false // remove animation

    if (this.removeCameraListener) {
      this.removeCameraListener()
      this.removeCameraListener = null
    }

    if (this.navEntity) {
      viewer.entities.remove(this.navEntity)
      this.navEntity = null
    }

    // unlock carema and back to the same 2d bbox
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
    viewer.camera.flyTo({
      destination: this.paddedRectangle,
      duration: 1.2
    })
    
  }

  setVisible(visible) {

    if (!this.entities) return

    this.entities.values.forEach(e => {
      if (e.id?.startsWith('route-line-') ||
          e.id?.startsWith('route-points-') ||
        e.id.startsWith('route-label-')) {
        e.show = visible
      }
    })
    if (this.movingEntity) {
      this.movingEntity.show = visible
    }
    if (this.navEntity) {
      this.navEntity.show = visible
    }
  }

  // get terrain height with coords
  _getGroundHeight(lon, lat) {

    const carto = Cesium.Cartographic.fromDegrees(lon, lat)
    if (!this.viewer.terrainProvider ||
        this.viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
      return 0
    }

    const h = this.viewer.scene.globe.getHeight(carto)
    return h || 0
  }
}