<template>
  <div v-show="isVisible" id="nav-panel" class="map-overlay panel">
    <h4>路徑規劃</h4>

    <div v-for="(label, key) in fields" :key="key" class="input-group">
      <label>{{ label }}</label>
      <input 
        type="text" 
        :value="points[key]" 
        @focus="$emit('update:activeField', key)" 
        @input="$emit('update:points', { ...points, [key]: $event.target.value })"
        :class="{ 'active-input': activeField === key }"
        placeholder="先點選輸入框再點選地圖"
    >
    </div>

    <button @click="startPlanning" id="btn-start-plan">開始規劃路徑</button>
    <p style="text-align: center; margin: 4px 0;">或</p>
    <button @click="getExample" id="btn-get-example">Run Demo</button>
  </div>

  <div v-show="isVisible && routeStore.simulationSegments " id="route-info" style="top: 480px;" class="panel">
    <h4>路徑資訊</h4>
    <p>總預估時間: {{ routeStore.totalTime }}</p>
    
    <div class="info-item"><i class="color-indicator" style="background: #e67a67;"></i><p> 步行 A --> B : {{ routeStore.resABTime }}</p></div>
    <div class="info-item"><i class="color-indicator" style="background: #10b981;"></i><p> 騎行 B --> C : {{ routeStore.resBCTime }}</p></div>
    <div class="info-item"><i class="color-indicator" style="background: #e67a67;"></i><p> 步行 C --> D : {{ routeStore.resCDTime }}</p></div>
    
    <div v-if="routeStore.segments && mapFactory">
        <div style="margin-top: 10px;" class="simulation-btns">
            <button @click="get2DNavigation">開始2D移動模擬</button>
        </div>
        <div v-if="engineType === 'cesium'" style="margin-top: 10px;" class="simulation-btns">
            <button class="start-btn" @click="get3DNavigation">開始3D導航模擬</button>
            <button class="close-btn" @click="exitTo2D">取消</button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { watch, onUnmounted, nextTick } from 'vue';
import { useRouteStore } from '@/store/routeStore';
import { syncLayers, layerInstanceCache } from '@/map/layers/layerManager';

const routeStore = useRouteStore();

const props = defineProps({
  mapFactory: { type: Object, default: null  },  
  mapInstance: { type: Object, default: null  }, 
  activeField: { type: String, default: null },
  points: { type: Object, required: true },
  engineType: { type: String, required: true },
  isVisible: { type: Boolean, required: true } ,
  isClickingMap: { type: Boolean, default: false }
});

const emit = defineEmits(['update:activeField', 'update:points', 'update:isVisible', 'exit-3d']);
const fields = { A: 'A | 起點', B: 'B | 借車站', C: 'C | 還車站', D: 'D | 終點' };


// update navigation
const updateMapLayers = async () => {
  if (!props.mapInstance || !props.mapInstance.isReady) {
    return;
  }
  await syncLayers(
    props.mapFactory,
    props.mapInstance,
    { navigation: true },  
    { navigation: routeStore.simulationSegments  } 
  );
};

// ========== watch ==========
watch(
  () => [props.isVisible],
  async ([visible]) => {


    if (!visible) return;
    if (!routeStore.simulationSegments) return;
    if (!props.mapInstance?.isReady) return;

    await syncLayers(
      props.mapFactory,
      props.mapInstance,
      { navigation: true },
      { navigation: routeStore.simulationSegments }
    );
  },
  { immediate: true }
)


// ========== function for retrieving route data for navigation =========
// after entering points
const startPlanning = async() => {
  if (Object.values(props.points).some(val => !val)) {
    alert("請確保 A, B, C, D 四個點位皆已輸入或選取");
    return;
  }

  // format coordinates: split by ,
  const formatCoord = (str) => str.split(',').map(coord => parseFloat(coord.trim()));
  const coords = {
    A: formatCoord(props.points.A),
    B: formatCoord(props.points.B),
    C: formatCoord(props.points.C),
    D: formatCoord(props.points.D)
  };
  
  // go to routeStore: apply mapbox direction API -> get results -> store
  routeStore.simulationSegments  = await routeStore.fetchAllRoutes(coords, 'new');

  if (routeStore.simulationSegments) {
    updateMapLayers();
  }
};

// for demo
const getExample = async() => {
  const coords = {A: [121.535, 25.041], B: [121.533, 25.042], C: [121.530, 25.033], D: [121.532, 25.033]};
  routeStore.simulationSegments  = await routeStore.fetchAllRoutes(coords, 'example');
  if (routeStore.simulationSegments ) {
    updateMapLayers();
  }
};

// ========== for navigation (animaiton) ==========
// 2d navigation
const get2DNavigation = async() => {
  const layer = layerInstanceCache.get('navigation')
  if (!layer) return;

  if (routeStore.simulationSegments ) {
      try {
        if (!props.isVisible) emit('update:isVisible', true); 
        await layer.startSimulation(routeStore.simulationSegments ); 
      } catch (error) {
        console.error("2D animation error:", error);
      }
  } else {
      alert("請先進行路徑規劃");
  }
}

// 3d navigation
const get3DNavigation = async () => {
  const layer = layerInstanceCache.get('navigation')
  if (!layer) return;

  if (routeStore.segments) {
    try {
      if (!props.isVisible) emit('update:isVisible', true); 
      if (typeof layer._navigation === 'function') {
        await layer._navigation(
          routeStore.segments.AtoB,
          routeStore.segments.BtoC,
          routeStore.segments.CtoD
        );
      } else {
        alert("No 3D Navigation provided");
      }
    } catch (error) {
      console.error("3D error:", error);
    }
  } else {
    alert("請先進行路徑規劃");
  }
};

// from 3d back to 2d
const exitTo2D = async () => {
  await nextTick();
  const layer = layerInstanceCache.get('navigation')
  if (layer && typeof layer._resetCameraTo2D === 'function') {
    layer._resetCameraTo2D(); 
  }
  emit('exit-3d'); 
};

onUnmounted(async() => {
  if (props.mapFactory && props.mapInstance) {
    syncLayers(props.mapFactory, props.mapInstance, { navigation: false }, {});
  }
});
</script>

<style scoped>
.active-input {
  border: 2px solid #10b981;
  outline: none;
}
.info-item {
  display: flex;
  align-items: center;
  margin: 4px 0;
}
.color-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  flex-shrink: 0;
}
#nav-panel, #route-info {  
    top: 30px;
    right: 30px;
    z-index: 2000;
    width: 250px;
}
.input-group {
    margin-bottom: 10px;
    width: 100%;
} 
.input-group input {
    width: 100%;
    height: 30px;
}
.input-group label {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 500;
}
button {
    width: 100%; 
    padding: 6px; 
    background: #fff; 
    border: 1px solid #ccc; 
    border-radius: 4px; 
    cursor: pointer; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
button:hover {
    background: #f0f0f0;
}
button:active {
    background: #e0e0e0;
}
.simulation-btns {
    width: 100%;
}
.simulation-btns .start-btn {
    width: 60%;
}
.simulation-btns .close-btn {
    width: 35%;
    margin-left: 5%;
}
</style>