// manage all layers

import { layerRegistry } from './layerRegistry.js';

export const layerInstanceCache = new Map(); // object for cache

export function clearLayerCache() {
  layerInstanceCache.forEach(layer => {
    layer?.destroy?.();
  });
  layerInstanceCache.clear();
}

export async function syncLayers(factory, map, layers, data) {
  if (!map || !map.isReady) return;

  // ==================== helper ====================
  const getLayer = (key, createFn) => {

    if (layerInstanceCache.has(key)) {
      return layerInstanceCache.get(key);
    }

    const layer = createFn();
    layerInstanceCache.set(key, layer);
    return layer;
  };

  // ==================== wmts ====================
  if (Object.prototype.hasOwnProperty.call(layers, 'wmts')) {

    const { factoryMethod } = layerRegistry.wmts;

    // get layer from cache or build a new one
    const layer = await getLayer('wmts', () =>
      factory[factoryMethod](map)
    );

    if (layers.wmts) {
      await layer.add('wmts');
      layer.setVisible(true);
    } else {
      layer.setVisible(false);
    }
  }

  // ==================== terrain ====================
  if (Object.prototype.hasOwnProperty.call(layers, 'terrain')) {

    const { factoryMethod } = layerRegistry.terrain;

    const layer = await getLayer('terrain', () =>
      factory[factoryMethod](map)
    );

    if (layers.terrain) {
      await layer.add('terrain');
      layer.setVisible(true);
    } else {
      layer.setVisible(false);
    }
  }

  // ==================== building ====================
  if (Object.prototype.hasOwnProperty.call(layers, 'building')) {

    const { factoryMethod } = layerRegistry.building;

    const layer = await getLayer('building', () =>
      factory[factoryMethod](map)
    );

    if (layers.building) {

      if (data?.building) {
        await layer.add('building');
      }

      layer.setVisible(true);

    } else {
      layer.setVisible(false);
    }
  }

  // ==================== ubike ====================
  if (Object.prototype.hasOwnProperty.call(layers, 'ubike')) {

    const { factoryMethod } = layerRegistry.ubike;

    const layer = await getLayer('ubike', () =>
      factory[factoryMethod](map)
    );

    if (layers.ubike) {

      if (data?.ubike) {
        await layer.add(
          'ubike',
          data.ubike,
          data.onUbikeClick,
          data.displayMode
        );
      }

      layer.setVisible(true);
    } else {
      layer.setVisible(false);
    }
  }

  // ==================== navigation ====================
  if (Object.prototype.hasOwnProperty.call(layers, 'navigation')) {

    const { factoryMethod } = layerRegistry.navigation;

    const layer = await getLayer('navigation', () =>
      factory[factoryMethod](map)
    );

    if (layers.navigation) {

      if (data?.navigation) {
        await layer.add(
          data.navigation
        );
      }

      layer.setVisible(true);
    } else {
      layer.setVisible(false);
    }
  }
}