import { defineStore } from 'pinia';

// only for mapbox
export const useBuildingStore = defineStore('map', {
  state: () => ({
    buildingData: null,
    isLoading: false
  }),
  actions: {
    async fetchBuildingData() {
      if (this.buildingData|| this.isLoading) return this.buildingData;
      this.isLoading = true;
      try {
        const response = await fetch('/data/building_h_output.geojson');
        const data = await response.json();
        this.buildingData = data; 
        return this.buildingData;
      } catch (error) {
        console.error("building data download error:", error);
      } finally {
        this.isLoading = false;
      }
    }
  }
});