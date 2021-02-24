import { Tree, Card } from 'antd';
import {useEffect, useState} from "react";
import CesiumTools from "../Earth/controller";
import util from '../../util/index'
export default function SourceTree() {
    const layerList = [
        {
            sourceName: "精模",
            url: 'http://localhost:8090/iserver/services/3D-jingmoWorkSpace/rest/realspace',
            type: 'map-scene'
        },
        {
            sourceName: "影像",
            url: 'http://localhost:8090/iserver/services/map-yingxiangWorkSpace/rest/maps/%E8%B0%B7%E6%AD%8C%E5%8D%AB%E6%98%9F_%E6%97%A0%E5%81%8F%E7%A7%BB_18090900524116@cq',
            type: 'map-rest'
        },
        {
            sourceName: "地形",
            url: 'http://localhost:8090/iserver/services/3D-dixingWorkSpace/rest/realspace/datas/dem',
            type: 'map-terrain'
        },
        {
            sourceName: "倾斜摄影",
            url: 'http://localhost:8090/iserver/services/3D-qingxieWorkSpace/rest/realspace',
            type: 'map-scene'
        },
        {
            sourceName: "管线",
            url: 'http://localhost:8090/iserver/services/3D-guanxianWorkSpace/rest/realspace',
            type: 'map-scene'
        },


    ]
    util.generateAntdTreeModel(layerList);
    const isLayerLoad = async (checkedKeys, info) => {
        let layerInfo  = info.node.props.data;
        if(info.checked) {
            let loadedLayer;
            switch (layerInfo.type) {
                case 'map-scene':
                    loadedLayer = await CesiumTools.addSceneLayer(window.viewerInstance,layerInfo);
                    layerInfo.layer = loadedLayer.layer;
                    break;
                case 'map-rest':
                    loadedLayer = await CesiumTools.addSuperMapRestLayers(window.viewerInstance,layerInfo);
                    layerInfo.layer = loadedLayer.layer;
                    break;
                case 'map-terrain':
                    var terrainProvider = new window.Cesium.CesiumTerrainProvider({
                        url: layerInfo.url,
                        requestWaterMask: true,
                        requestVertexNormals: true,
                        isSct: true,
                    })
                    terrainProvider.readyPromise.then(res => {
                        if (res) {
                            window.viewerInstance.terrainProvider = terrainProvider
                        }
                    })
                    break;
            }
        } else {
            if(layerInfo.type === 'map-terrain') {
                CesiumTools.setTerrianVisible(window.viewerInstance, false)
                return
            }
            CesiumTools.removeViewLayer(window.viewerInstance, layerInfo.layer)
        }

    }
    return (
        <Card title="服务列表"  style={{ width: 300 }}>
            <Tree
                checkable
                onCheck={isLayerLoad}
                treeData={layerList}
            />
        </Card>

    )
}