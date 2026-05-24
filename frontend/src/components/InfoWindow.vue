<template>
  <div 
    class="info-window" 
    :style="{ left: position.x  + 'px', top: position.y  + 'px' }"
  >
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h3 style="margin: 0; font-size: 1.25rem; font-weight: bold;">{{ station.sna }}</h3>
      <button @click="$emit('close')" style="font-size: 1.5rem; background: none; border: none; cursor: pointer;">×</button>
    </div>
    <div class="content">
      <p>可借車輛：{{ station.available_rent_bikes }}</p>
      <p>可還車位：{{ station.available_return_bikes }}</p>
      <p>位置：{{ station.ar }}</p>
      <p>更新時間：{{ station.updateTime }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps(['station', 'position']); // from MapContainer.vue
defineEmits(['close']); // event to MapContainer.vue
</script>

<style>
.info-window{
  background:white;
  padding:10px;
  border-radius:6px;
  box-shadow:0 2px 8px rgba(0,0,0,0.3);
  z-index: 1000;
  position:absolute;
  color:#333;
  margin: 4px;
}
</style>