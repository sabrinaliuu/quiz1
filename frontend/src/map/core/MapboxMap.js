import maplibregl from "maplibre-gl"
import MapInterface from "./MapInterface"

export default class MapboxMap extends MapInterface {
  constructor() {
    super()
    this.map = null
    this.mode = "mapbox"
    this.isReady = false; // check initialized or not
  }
  
  // ========== base ==========
  async init(container, onClickCallback) {

    return new Promise((resolve) => {
      // ----- 1. set map ------
      this.map = new maplibregl.Map({
          container: container, 
          style: {
              "version": 8,
              "sources": {
                  "osm-source": {
                      "type": "raster",
                      "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                      "tileSize": 256
                  }
              },
              "layers": [
                  {
                      "id": "osm-layer",
                      "type": "raster",
                      "source": "osm-source"
                  }
              ]
          },
          center: [121.54, 25.04],
          zoom: 16
      });

      // ----- 2. load map -----
      this.map.on("load", () => {
        this.isReady = true;
        resolve(this); 
      });

      // ----- add click -> move to function -----
      this.map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        if (onClickCallback) {
          onClickCallback({ lng, lat });
        }
        this.moveTo(lng, lat);
      });

    });
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
  // ===============================

  // ========== fuctions ==========
  moveTo(lng, lat) {
    if (!this.map) return;
    this.map.flyTo({
      center: [lng, lat],      
      zoom: 16,                
      pitch: 0,                // vertical to surface
      bearing: 0,              // north
      duration: 2000         // move duration (ms)
    });
  }

  getBounds() {
    if (!this.map) return null;
    // get bounds
    const b = this.map.getBounds();
    return {
      west: b.getWest(),
      east: b.getEast(),
      south: b.getSouth(),
      north: b.getNorth()
    };
  }

  waitForStyle() {
    return new Promise((resolve) => {
      if (this.map.isStyleLoaded()) return resolve()

      let isResolved = false
      const safeResolve = () => {
        if (!isResolved) {
          isResolved = true
          clearTimeout(timeoutId)
          this.map.off('style.load', safeResolve)
          this.map.off('idle', safeResolve)
          resolve()
        }
      }

      const timeoutId = setTimeout(safeResolve, 1500)
      this.map.once('style.load', safeResolve)
      this.map.on('idle', safeResolve)
    })
  }
  
  // ==============================
}