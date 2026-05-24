import json
import xml.etree.ElementTree as ET
from xml.dom import minidom

# --- 設定區 ---
INPUT_GEOJSON = "building_h_output_dem.geojson"  # 👈 請務必確認這個檔名正確，且檔案跟此 py 檔在同一個資料夾
OUTPUT_CITYGML = "cesium_perfect_model.gml"
HEIGHT_PROPERTY = "height"

# ✅ 修正1：改用 OGC:2:84，軸序為「經度, 緯度」，與 GeoJSON 座標順序一致
# （原本的 EPSG::4326 軸序是「緯度, 經度」，會讓 Cesium 判定座標系錯誤）
SRS_NAME = "urn:ogc:def:crs:OGC:2:84"
# --------------

with open(INPUT_GEOJSON, "r", encoding="utf-8") as f:
    gj = json.load(f)

ns = {
    "core": "http://www.opengis.net/citygml/2.0",
    "bldg": "http://www.opengis.net/citygml/building/2.0",
    "gml": "http://www.opengis.net/gml",
    "xsi": "http://www.w3.org/2001/XMLSchema-instance"
}

for prefix, uri in ns.items():
    ET.register_namespace(prefix, uri)

root = ET.Element(f"{{{ns['core']}}}CityModel")
root.set(f"{{{ns['xsi']}}}schemaLocation",
         "http://www.opengis.net/citygml/building/2.0 "
         "http://schemas.opengis.net/citygml/building/2.0/building.xsd")
# ✅ 修正2：在根元素 CityModel 上加 srsName（Cesium Ion 要求）
root.set("srsName", SRS_NAME)


def add_surface_member(shell_node, coords_3d):
    surface_member = ET.SubElement(shell_node, f"{{{ns['gml']}}}surfaceMember")
    poly = ET.SubElement(surface_member, f"{{{ns['gml']}}}Polygon")
    ext = ET.SubElement(poly, f"{{{ns['gml']}}}exterior")
    lr = ET.SubElement(ext, f"{{{ns['gml']}}}LinearRing")
    lr.set("srsName", SRS_NAME)
    lr.set("srsDimension", "3")
    pos_list = ET.SubElement(lr, f"{{{ns['gml']}}}posList")
    pos_list.text = " ".join(f"{pt[0]} {pt[1]} {pt[2]}" for pt in coords_3d)


# 收集所有座標以便計算 boundedBy（統計 min/max）
all_lons, all_lats, all_zs = [], [], []

# 計算成功轉換了幾棟建築
building_count = 0

# 先收集所有 feature 資料（同時統計座標範圍）
features_data = []

for i, feature in enumerate(gj.get("features", [])):
    props = feature.get("properties", {})
    geom = feature.get("geometry", {})
    geom_type = geom.get("type")

    polygons = []
    if geom_type == "Polygon":
        polygons.append(geom["coordinates"])
    elif geom_type == "MultiPolygon":
        polygons.extend(geom["coordinates"])
    else:
        continue  # 跳過 Point 或 LineString

    height = float(props.get(HEIGHT_PROPERTY, 15.0))

    for poly_coords in polygons:
        for pt in poly_coords[0]:
            all_lons.append(pt[0])
            all_lats.append(pt[1])
            all_zs.append(0.0)
            all_zs.append(height)

    features_data.append((i, props, polygons, height))
    building_count += 1

# ✅ 修正3：加入 gml:boundedBy（Cesium Ion 需要此資訊定位資料範圍）
if all_lons:
    bounded_by = ET.SubElement(root, f"{{{ns['gml']}}}boundedBy")
    envelope = ET.SubElement(bounded_by, f"{{{ns['gml']}}}Envelope")
    envelope.set("srsName", SRS_NAME)
    envelope.set("srsDimension", "3")
    lower = ET.SubElement(envelope, f"{{{ns['gml']}}}lowerCorner")
    lower.text = f"{min(all_lons)} {min(all_lats)} {min(all_zs)}"
    upper = ET.SubElement(envelope, f"{{{ns['gml']}}}upperCorner")
    upper.text = f"{max(all_lons)} {max(all_lats)} {max(all_zs)}"

# 產生建築幾何
for i, props, polygons, height in features_data:
    obj_id = f"bldg_{i}"

    member = ET.SubElement(root, f"{{{ns['core']}}}cityObjectMember")
    bldg = ET.SubElement(member, f"{{{ns['bldg']}}}Building")
    bldg.set(f"{{{ns['gml']}}}id", obj_id)

    # 寫入屬性
    for key, val in props.items():
        if isinstance(val, (dict, list)):
            continue
        gen_prop = ET.SubElement(bldg, f"{{{ns['core']}}}stringAttribute")
        gen_prop.set("name", str(key))
        v = ET.SubElement(gen_prop, f"{{{ns['core']}}}value")
        v.text = str(val)

    # 建立幾何
    lod1_solid = ET.SubElement(bldg, f"{{{ns['bldg']}}}lod1Solid")
    solid = ET.SubElement(lod1_solid, f"{{{ns['gml']}}}Solid")
    exterior_gml = ET.SubElement(solid, f"{{{ns['gml']}}}exterior")
    shell = ET.SubElement(exterior_gml, f"{{{ns['gml']}}}Shell")

    for poly_coords in polygons:
        exterior_coords = poly_coords[0]  # 取外環

        # 1. 地面
        add_surface_member(shell, [[pt[0], pt[1], 0.0] for pt in exterior_coords])
        # 2. 屋頂
        add_surface_member(shell, [[pt[0], pt[1], height] for pt in exterior_coords])
        # 3. 牆面
        for j in range(len(exterior_coords) - 1):
            pt1 = exterior_coords[j]
            pt2 = exterior_coords[j + 1]
            wall = [
                [pt1[0], pt1[1], 0.0],
                [pt2[0], pt2[1], 0.0],
                [pt2[0], pt2[1], height],
                [pt1[0], pt1[1], height],
                [pt1[0], pt1[1], 0.0]
            ]
            add_surface_member(shell, wall)

# 導出
xml_str = ET.tostring(root, encoding="utf-8")
parsed_xml = minidom.parseString(xml_str)
pretty_xml = parsed_xml.toprettyxml(indent="  ", encoding="utf-8")

with open(OUTPUT_CITYGML, "wb") as f:
    f.write(pretty_xml)

print(f"\n========================================")
print(f" 偵測到並成功轉換的建築物總數: {building_count} 棟")
if building_count == 0:
    print("⚠️ 警告：沒有轉換任何建築！請檢查 GeoJSON 的幾何型態是否為 Polygon。")
else:
    print(f"👉 真正有內容的檔案已生成：{OUTPUT_CITYGML}")
print(f"========================================")
