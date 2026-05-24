import * as Cesium from "cesium"
import MapInterface from "./MapInterface"

export default class CesiumMap extends MapInterface {
  constructor() {
    super()
    this.mode = 'cesium';
    this.viewer = null;
    this.taipeiRectangle = Cesium.Rectangle.fromDegrees(
      121.45, 24.95,
      121.65, 25.15  
    );
    this.isReady = false; // check initialized or not
  }

  // ========== base ==========
  async init(container, onClickCallback) {
    // ----- 1. initialize viewer -----
    Cesium.RequestScheduler.maximumRequestsPerServer = 4;
    this.viewer = new Cesium.Viewer(container, {
      baseLayerPicker: false,
      geocoder: true,
      homeButton: false,
      infoBox: false,
      selectionIndicator: false,
      sceneModePicker: false,
      timeline: true,
      navigationHelpButton: true,
      animation: true
    });

    this.viewer.imageryLayers.removeAll(); // close all layers provided by Cesium
    this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(121.54, 25.04, 1000)
    });

    
    const baseLayer = new Cesium.OpenStreetMapImageryProvider({
        url: "https://a.tile.openstreetmap.org/",
        maximumLevel: 16 
    });
    // add OSM as base layer
    this.viewer.imageryLayers.addImageryProvider(baseLayer);
        
    this.isReady = true; // mapview ready

    // ----- add click -> move to fuction -----
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((clickEvent) => {

      // convert Cartesian3 to latlon
      const ray = this.viewer.camera.getPickRay(clickEvent.position); // ray: camera to clicked point
      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene); // intersection between ray and surface (ellipsoid or terrain)

      if (Cesium.defined(cartesian)) {
        // Cartesian3 to latlon
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lng = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        //console.log(`click: ${lng}, ${lat}`);

        if (onClickCallback) {
          onClickCallback({ lng, lat });
          this.moveTo(lng, lat);
        }

      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  destroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }
  // ===============================

  // ========== fuctions ==========
  moveTo(lng, lat) {
    if (!this.viewer) return;
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        lng, 
        lat, 
        1000 // height
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),   // north
        pitch: Cesium.Math.toRadians(-90), // vertical to surface
        roll: 0
      },
      duration: 2.0 // move duration
    });
  }

  getBounds() {
    if (!this.viewer) return null;

    // get bounds from camera view
    const rect = this.viewer.camera.computeViewRectangle();
    if (!rect) return null;

    // to degree
    return {
      west: Cesium.Math.toDegrees(rect.west),
      east: Cesium.Math.toDegrees(rect.east),
      south: Cesium.Math.toDegrees(rect.south),
      north: Cesium.Math.toDegrees(rect.north)
    };
  }
 
}