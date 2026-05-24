// Configuration Metadata
// Only list the id and faactory method as index
// never touch MapInstance
export const layerRegistry = {
  wmts: {
    id: 'wmts-layer',
    factoryMethod: 'createWmtsLayer'
  },

  terrain: {
    id: 'terrain-layer',
    factoryMethod: 'createTerrainLayer'
  },

  building: {
    id: 'building-layer',
    factoryMethod: 'createBuildingLayer'
  },

  ubike: {
    id: 'ubike-layer',
    factoryMethod: 'createUbikeLayer'
  },

  navigation: {
    id: 'navigation-layer',
    factoryMethod: 'createNavigationLayer'
  }
}