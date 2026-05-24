import { defineStore } from 'pinia';

export const useUbikeStore = defineStore('ubike', {
  state: () => ({
    allGeojson: null,
    isLoaded: false,
    currentGeoJson: null
  }),

  actions: {
    async fetchUbikePoints() {
      if (this.allGeojson) return this.allGeojson;
      try {
        const response = await fetch('/data/ubike_point.geojson');
        this.allGeojson = await response.json();
        this.isLoaded = true;
        return this.allGeojson;
      } catch (error) {
        console.error("ubike points loading error:", error);
      }
    },

    // update ubike properties in the bounds
    async updateLiveStatus(bounds) {
      if (!this.allGeojson || !bounds) return;

      try {
        // fetch newest data
        const response = await fetch('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json');
        const liveData = await response.json();
        
        // to map
        const liveMap = new Map(liveData.map(item => [item.sno, item]));

        // filter points in the bounds
        const filteredFeatures = this.allGeojson.features.filter(f => {
          const [lng, lat] = f.geometry.coordinates;
          return (
            lng >= bounds.west &&
            lng <= bounds.east &&
            lat >= bounds.south &&
            lat <= bounds.north
          );
        });

        // update info for points in the bounds only
        filteredFeatures.forEach(feature => {
          const updatedInfo = liveMap.get(feature.properties.sno);
          if (updatedInfo) {
            feature.properties.available_rent_bikes = Number(updatedInfo.available_rent_bikes);
            feature.properties.available_return_bikes = Number(updatedInfo.available_return_bikes);
            feature.properties.updateTime = updatedInfo.updateTime;
          }
        });

        this.currentGeoJson = {
          type: "FeatureCollection",
          features: filteredFeatures
        };

        return {
          type: "FeatureCollection",
          features: filteredFeatures
        };
      } catch (error) {
        console.error("fail to update:", error);
      }
    }
  }
});