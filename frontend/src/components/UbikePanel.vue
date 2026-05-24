<template>
  <div id="ubike-control" class="panel">
    <h4>Ubike2.0站點顯示模式</h4>
    <div style="margin-bottom: 5px; background: white; padding: 5px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      <button 
        @click="changeDisplayMode('available_rent_bikes')"
        :style="{ background: displayMode === 'available_rent_bikes' ? '#eee' : '#fff' }"
        style="padding: 5px 10px; border: 1px solid #ccc; cursor: pointer; width: 50%;"
      >
        可租借數
      </button>
      <button 
        @click="changeDisplayMode('available_return_bikes')"
        :style="{ background: displayMode === 'available_return_bikes' ? '#eee' : '#fff' }"
        style="padding: 5px 10px; border: 1px solid #ccc; cursor: pointer; width: 50%;"
      >
        可還車數
      </button>
    </div>
    
    <button 
      @click="getDataInBounds" 
      class="refresh-btn"
      style="width: 100%; padding: 8px 12px; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
    >
      顯示目前範圍內站點
    </button>
  </div>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { useUbikeStore } from '@/store/ubikeStore'
import { syncLayers } from '@/map/layers/layerManager'

const props = defineProps({
  mapFactory: { type: Object, default: null }, 
  mapInstance: { type: Object, default: null },
  displayMode: { type: String, required: true },
  isVisible: { type: Boolean, required: true }   
})

const ubikeStore = useUbikeStore()
const emit = defineEmits(['open-info', 'update-mode'])
const updateTimer = ref(null)

// get map bbox
const getMapBounds = () => {
  if (!props.mapInstance) return null;
  return props.mapInstance.getBounds();
};

// render updated data on map
const renderData = async () => {
  if (props.mapFactory && props.mapInstance) {
    await syncLayers(
      props.mapFactory, 
      props.mapInstance,
      { ubike: props.isVisible },
      { 
        ubike: ubikeStore.currentGeoJson, // ensure ubikeStore.currentGeoJson has been updated before this in all funcs
        displayMode: props.displayMode,   
        onUbikeClick: (event) => emit('open-info', event) 
      }
    );
  }
};

// get data in bbox only
const getDataInBounds = async () => {
  const bounds = getMapBounds();
  await ubikeStore.fetchUbikePoints(); 
  const fastData = await ubikeStore.updateLiveStatus(bounds);
  ubikeStore.currentGeoJson = fastData; 
  await renderData();
};

// auto update
const startPolling = () => {
  if (updateTimer.value) return;
  updateTimer.value = setInterval(async () => {
    const bounds = getMapBounds();
    const updatedData = await ubikeStore.updateLiveStatus(bounds);
    if (updatedData) {
      ubikeStore.currentGeoJson = updatedData;
      await renderData();
    }
  }, 60000); // 60 sec
};

// stop auto update
const stopPolling = () => {
  if (updateTimer.value) {
    clearInterval(updateTimer.value);
    updateTimer.value = null;
  }
};

// display mode change
const changeDisplayMode = (mode) => {
  emit('update-mode', mode);
};


// ======== watch ========
// display mode change
watch(() => props.displayMode, () => {
  if (props.isVisible) {
    renderData();
  }
});

// new instance
watch(
  () => props.mapInstance,
  async (map) => {
    if (!map || !props.mapFactory) return
    if (!map.isReady) return;
    if (!props.isVisible) return; 
    await getDataInBounds();
    startPolling();
  },
  { immediate: true }
);

// visibility change
watch(
  () => props.isVisible,
  async (visible) => {
    if (!props.mapInstance?.isReady) return;
    if (visible) {
      await getDataInBounds();
      startPolling();
    } else {
      stopPolling();
      
    }
  }
);


onUnmounted(async() => {
  stopPolling();
  if (props.mapFactory && props.mapInstance) {
    await syncLayers(props.mapFactory, props.mapInstance, { ubike: false }, {});
  }
});
</script>

<style scoped>
#ubike-control {
  top: 340px; 
  left: 30px; 
  width: 200px;
  z-index: 10;
}
.refresh-btn:hover {
  background: #f0f0f0 !important;
}
</style>