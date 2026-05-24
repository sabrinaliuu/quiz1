# Quiz 1

## 執行方式
此專案使用docker建立地圖服務與網頁，需安裝docker，並執行以下指令
```
docker compose up --build
```
build完成後開啟 `http://localhost:5173/`，即可看到網頁

## 架構
```
webgis-project/
├── docker-compose.yml
├── frontend/                        # WebGIS (Vue/Vite + Mapbox/Cesium)
│   ├── Dockerfile
│   ├── public                                    ## static data
│   ├── src/
│   │   ├── map/                                  ## abstract factory pattern
│   │   │   ├─ factory/                           ### factory
│   │   │   │  ├─ MapFactory.js                   #### abstract factory
│   │   │   │  ├─ MapboxFactory.js                #### concrete factory
│   │   │   │  └─ CesiumFactory.js                #### concrete factory
│   │   │   ├─ core/                              ### product (mapview)
│   │   │   │  ├─ MapInterface.js                 #### abstract product
│   │   │   │  ├─ MapboxMap.js                    #### concrete product
│   │   │   │  └─ CesiumMap.js                    #### concrete product
│   │   │   └─ layers/                            ### product (layer)
│   │   │      ├─ base/                           #### abstract product
│   │   │      │  ├─ WmtsLayer.js
│   │   │      │  ├─ TerrainLayer.js
│   │   │      │  ├─ BuildingLayer.js
│   │   │      │  ├─ UbikeLayer.js
│   │   │      │  └─ NavigationLayer.js
│   │   │      ├─ mapbox/                         #### concrete product
│   │   │      │  ├─ MapboxWmtsLayer.js
│   │   │      │  ├─ MapboxTerrainLayer.js
│   │   │      │  ├─ MapboxBuildingLayer.js
│   │   │      │  ├─ MapboxUbikeLayer.js
│   │   │      │  └─ MapboxNavigationLayer.js
│   │   │      ├─ cesium/                         #### concrete product
│   │   │      │  ├─ CesiumWMTSLayer.js
│   │   │      │  ├─ CesiumTerrainLayer.js
│   │   │      │  ├─ CesiumBuildingLayer.js
│   │   │      │  ├─ CesiumUbikeLayer.js
│   │   │      │  └─ CesiumNavigationLayer.js
│   │   │      ├─ LayerManager.js                 ### layer manager
│   │   │      └─ LayerRegistry.js
│   │   ├── store/                                ## data storage
│   │   │   ├── buildingStore.js
│   │   │   ├── routeStore.js
│   │   │   └── ubikeStore.js
│   │   └── components/                           ## UI / client
│   │       ├── InfoWindow.vue
│   │       ├── MapContainer.vue
│   │       ├── MapTogglePanel.vue
│   │       ├── NavigationPanel.vue
│   │       └── UbikePanel.vue
│   ├── App.vue
│   ├── index.html
│   └── main.ts
│
├── wmts-server/           # wmts server
│   ├── Dockerfile
│   └── data/
│       └── road.mbtiles
│
└── cesium-server/         # building and terrain provider for cesium only
    ├── Dockerfile
    ├── building/          ## OSM building 3d tile
    │   ├── tileset.json
    │   ├── 3/
    │   └── 4/
    └── terrain/           ## terrain provider
        ├── layer.json
        ├── 0/
        ├── 1/
        └── 2/
```


## Layers

### WMTS
#### 製圖說明
* 至Mapbox修改地圖樣式，以保留道路相關圖層為主
* 使用Mapbox提供的連結至QGIS中連線取得wmts layer
* 以Generate XYZ tiles (MBTiles)工具輸出成mbtiles檔 (考量檔案大小，圖磚範圍僅以台北市為主，z=5-17)

#### 服務說明
* 以docker獨立起一個服務於 `port:8080`，使用 <a href="https://hub.docker.com/r/maptiler/tileserver-gl">maptiler/tileserver-gl</a>
* wmts-server資料夾: mbtiles檔
* 可執行 `localhost:8080` 測試服務，出現以下畫面表示服務啟動成功

![alt text](/readme_data/wmts.png)

### Terrain
#### 製圖說明
* 下載台北市DEM(20m)，用QGIS轉存為tif檔 (translate)、定義proj (assign projection)、轉換坐標軸 (wrap)
* 使用Cesium ion將tif轉為Cesium terrain provider可用格式

#### 服務說明
* 以docker獨立起一個服務於 `port:8081`，使用 <a href="https://hub.docker.com/_/nginx">nginx:alpine</a>
* cesium-server資料夾: terrain資料夾內包含Cesium可讀格式檔案 (0-13資料夾、layer.json)
* 可執行 `http://localhost:8081/terrain/layer.json` 測試服務，出現以下畫面表示服務啟動成功

![alt text](/readme_data/terrain.png)

### OSM building
#### 製圖說明
* 至官網自行框取並下載台北市區範圍的geojson檔
* 使用QGIS處理檔案，計算建物高度，並刪除不需要的fields
```
CASE
WHEN "height" IS NOT NULL THEN "height"
WHEN "building:levels" IS NOT NULL THEN "building:levels" * 3
ELSE 10
END
```
#### 使用說明
##### Mapbox
* 讀geojson、使用 `type: fill-extrusion` add layer

##### Cesium
* 將geojson轉為CityGML (使用請claude完成之geojson轉CityGML[程式碼](/readme_data/geojson_to_citygml_claude.py))
* 使用Cesium ion 將CityGML轉為3D tile
* 與terrain相同port，於 `port:8081`使用 <a href="https://hub.docker.com/_/nginx">nginx:alpine</a>提供服務
* cesium-server資料夾: building資料夾內包含Cesium可讀格式檔案 (3-4資料夾、tileset.json)
* 可執行 `http://localhost:8081/building/tileset.json` 測試服務，出現以下畫面表示服務啟動成功

![alt text](/readme_data/3dtile.png)

### ubike
#### 介面說明
![alt text](/readme_data/ubike.png)

#### 點位顯示/更新方式
* 初次載入: 自動顯示畫面範圍點位
* 可點選左方「顯示目前範圍內站點」即時顯示與更新畫面範圍內資料
* 設定每60秒會自動更新站點資料
* 選擇「可租借數」或「可還車數」以切換站點顏色表示的類別

### 路徑規劃

* 為符合題目要求「下班後騎ubike至餐廳」並包含「借還車ubike站點」之路徑規劃，此圖層介面提供以下四個點供使用者自行輸入
    * A: 起點 (公司)
    * B: 借車站
    * C: 還車站
    * D: 終點 (餐廳)
* 自行輸入點位方式: 請先點選要輸入input框 -> 點地圖上的位置 -> 自動將經緯度顯示於input框內 -> 點開始路徑規劃 -> 呼叫Mapbox direciton API並回傳結果顯示**路徑與移動所需時間**於地圖 
* 建議流程: 選擇已知A點位置 -> 以A點為中心，使用ubike圖層「顯示目前範圍內站點」功能找到適合的B點 (自行考量距離、可借車數等) -> 選擇已知D點位置 -> 以D點為中心，使用ubike圖層「顯示目前範圍內站點」功能找到適合的C點
* 自行輸入點位進行路徑規劃需Mapbox API token，可直接將自己的token寫於[.env](frontend/.env)內，啟動網頁服務後便直接可使用路徑規劃服務

* 另外可以Run Demo，會直接顯示範例路徑規劃結果，不須API token

![alt text](/readme_data/route.gif)

#### 2D動態移動動畫
* 完成上述路徑規劃 -> 點下面「開始2D移動模擬」，即可看到動態移動動畫

![alt text](/readme_data/2d.gif)

#### 3D導航 (Cesium only)
* 完成上述路徑規劃 -> 點下面「開始3D導航」，即可進入導航視角與gltf模型導航點前進
* 點擊旁邊「取消」可回到2D路徑規劃結果視角

![alt text](/readme_data/3d.gif)