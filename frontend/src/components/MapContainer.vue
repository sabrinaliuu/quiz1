<template>
  <div id="map"></div>
  
  <MapTogglePanel 
    :currentEngine="engineType"
    :layerStatus="layers"
    @change-engine="handleEngineChange"
    @toggle-layer="handleLayerToggle"
  />

  <UbikePanel 
    v-if="layers.ubike" 
    :mapFactory="factoryInstance"
    :mapInstance="mapInstance"
    :isVisible="layers.ubike"
    :displayMode="displayMode"
    @update-mode="handleModeUpdate"
    @open-info="handleOpenInfo" 
  />

  <InfoWindow 
    v-if="info.visible" 
    :station="info.data" 
    :position="info.pixel"
    @close="info.visible = false"
  />

  <NavigationPanel 
    v-if="layers.navigation"
    v-model:activeField="activeField"
    v-model:points="points" 
    :mapFactory="factoryInstance"
    :mapInstance="mapInstance"
    :engineType="engineType"
    :isVisible="layers.navigation"
    @update:isVisible="layers.navigation = $event"
  />
</template>

<script setup>
import { onMounted,  onUnmounted, ref, shallowRef, reactive, nextTick, watch } from "vue"
import { useUbikeStore } from "@/store/ubikeStore"
import { useRouteStore } from "@/store/routeStore"

import { createMapFactory } from "@/map/factory/MapFactory"
import { syncLayers, clearLayerCache } from '@/map/layers/layerManager'

import MapTogglePanel from "./MapTogglePanel.vue"
import InfoWindow from "./InfoWindow.vue"
import NavigationPanel from "./NavigationPanel.vue"
import UbikePanel from "./UbikePanel.vue" 

const engineType = ref("mapbox")
const mapInstance = shallowRef(null)      // instance
const factoryInstance = shallowRef(null)  // factory for producing instance

const ubikeStore = useUbikeStore()
const routeStore = useRouteStore()

const info = ref({ visible: false, data: null, pixel: null })
const displayMode = ref('available_return_bikes')
const activeField = ref(null)
const points = ref({ A: '', B: '', C: '', D: '' })

// control visibility for all layers
const layers = reactive({
  wmts: true,
  building: false,
  ubike: false,
  navigation: false, 
  terrain: false
})

// ========== watch visibility change ==========
// for ubike and navigation, please go to their own *.vue

// watch wmts layer visibility
watch(
  () => layers.wmts,
  (visible) => {
    if (!mapInstance.value) return;
    syncLayers(factoryInstance.value, mapInstance.value, { wmts: visible }, {});
  }
);

// watch terrain layer visibility
watch(
  () => layers.terrain,
  (visible) => {
    if (!mapInstance.value) return;
    syncLayers(factoryInstance.value, mapInstance.value, { terrain: visible }, {});
  }
);

// watch building layer visibility
watch(
  () => layers.building,
  (visible) => {
    if (!mapInstance.value) return;
    syncLayers(factoryInstance.value, mapInstance.value, { building: visible }, visible ? { building: {} } : {});
  }
);

// ========== initialize and finalize ==========
// init: for all layers
const triggerSync = async () => {
  if (!mapInstance.value || !factoryInstance.value) return

  const currentData = {
    wmts: null,
    terrain: null,
    building: {}, 
    ubike: ubikeStore.currentGeoJson || null,
    navigation: routeStore.simulationSegments || null,
    displayMode: displayMode.value, 
    onUbikeClick: handleOpenInfo   
  }

  // sync all layers
  await syncLayers(
    factoryInstance.value,
    mapInstance.value,
    layers,
    currentData
  )
}

// init: destroy and clean -> new another instance
// when changing mapview (mapbox <-> cesium)
const initMap = async (type) => {
  
  // destroy instance (mapview)
  clearLayerCache()
  if (mapInstance.value?.destroy) {
    mapInstance.value.destroy()
  }
  mapInstance.value = null
  factoryInstance.value = null

  // clean container
  const container = document.getElementById("map")
  if (container) container.innerHTML = ""

  // wait
  await nextTick()

  // creat new instance
  const factory = createMapFactory(type) // mapbox or cesium -> call concrete factory
  const instance = factory.createMap()
  await instance.init("map", handleMapClick)

  factoryInstance.value = factory
  mapInstance.value = instance

  // sync all layers
  triggerSync()
}

// ========== functions ==========
// for handling the change of mapview
const handleEngineChange = (type) => {
  if (engineType.value === type) return
  // if change -> new one
  engineType.value = type
  initMap(type)
}

// for layer toggle: change visibility by key
const handleLayerToggle = (key) => {
  layers[key] = !layers[key]
}

// for the change of ubike data disply mode 
// (available_rent_bikes/available_return_bikes) 
const handleModeUpdate = (mode) => {
  displayMode.value = mode
}

// for ubike info window
const handleOpenInfo = (infoData) => {
  info.value = { ...infoData, visible: true }
}

// for navigation: enter your own points
const handleMapClick = ({ lng, lat }) => {
  if (activeField.value) {
    const coordStr = `${lng.toFixed(5)}, ${lat.toFixed(5)}`;
    points.value = {
      ...points.value,
      [activeField.value]: coordStr
    };
  }
  activeField.value = null 
};

onMounted(() => {
  initMap(engineType.value)
})

onUnmounted(() => {
  clearLayerCache()
  if (mapInstance.value?.destroy) {
    mapInstance.value.destroy()
  }
  mapInstance.value = null
  factoryInstance.value = null
})

/*if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearLayerCache()
    if (mapInstance.value?.destroy) {
      mapInstance.value.destroy()
    }
  })
}*/
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
  position: absolute;
}
</style>