<template>
  <div id="map-toggle" class="panel">
    <section class="control-group">
      <h4>地圖引擎</h4>
      <div class="btn-group">
        <button 
          :class="{ active: currentEngine === 'mapbox' }" 
          @click="$emit('change-engine', 'mapbox')"
        >Mapbox</button>
        <button 
          :class="{ active: currentEngine === 'cesium' }" 
          @click="$emit('change-engine', 'cesium')"
        >Cesium</button>
      </div>
    </section>

    <section class="control-group">
      <h4>圖層顯示</h4>
      <label v-for="(val, key) in currentLayerStatus" :key="key" class="checkbox-item">
        <input 
          type="checkbox" 
          :checked="val" 
          @change="$emit('toggle-layer', key)"
        >
        {{ layerLabels[key] }}
      </label>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentEngine: String,
  layerStatus: Object
})

defineEmits(['change-engine', 'toggle-layer']) 
// to MapContainer.vue // @click="$emit('change-engine', 'cesium')"
// example: handleEngineChange <-> change-engine , (type) <-> cesium 

const layerLabels = {
  wmts: 'Local Tile(Mapbox)',
  building: '建物(OSM)',
  ubike: 'Ubike2.0站點',
  navigation: '路徑規劃',
  terrain: '地形Cesium(DEM20m)'
}

// show layers checkbox by map view (mapbox: no terrain)
const currentLayerStatus = computed(() => {
  if (!props.layerStatus) return {}
  const layerEntries = Object.entries(props.layerStatus); // dict
  
  // mapbox: remove terrain
  if (props.currentEngine === 'mapbox') {
    const filtered = layerEntries.filter(([key]) => key !== 'terrain');
    return Object.fromEntries(filtered);
  }
  
  // cesium
  return Object.fromEntries(layerEntries);
})
</script>

<style scoped>
#map-toggle {
  top: 30px;
  left: 30px;
  z-index: 1000;
  width: 200px;
  height: auto;
}
.control-group { margin-bottom: 15px; }
.btn-group { display: flex; gap: 5px; }
.btn-group button { flex: 1; padding: 5px; cursor: pointer; border: 1px solid #ccc; background: #fff; }
.btn-group button.active { background: #42b983; color: white; border-color: #42b983; }
.checkbox-item { display: block; margin: 5px 0; cursor: pointer; font-size: 13px; }
</style>