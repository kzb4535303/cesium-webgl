import util from '../../../util'
import eventEmitter from "./eventEmitter";
//将自己添加的图层添加在viewer
export const addMyLayerstoViewer = function (viewer, layer) {
    var loadedLayer = viewer._loadedLayer;
    if (loadedLayer && loadedLayer.length) {
        loadedLayer.push(layer)
    } else {
        viewer['_loadedLayer'] = [layer]
    }
}
/**
 *添加ArcGIS REST MapServer服务
 * @param viewer layerInfo
 * interface layerInfo {
 * name:string,
 * url:string,
 * option:{
 *      show: boolean,
          alpha: number 0-1,
          minimumTerrainLevel	Number		optional最小地形细节层次。level 0是最小细节层次。
        maximumTerrainLevel	Number		optional最大地形细节层次。
 * }
 *
 * }
 *
 */

export const addArcgisRESTLayers = function (viewer, layerInfo, notSave) {
    return new Promise((resolve) => {
        const {
            name,
            option,
            url,
            isFlyto,
            mapConfig,
            options,
            layerParam,
            sourceName
        } = layerInfo
        const imageryLayers = viewer.imageryLayers
        const provider = new window.Cesium.CGCS2000MapServerImageryProvider({
            url: url,
            suggest: true,
            layers: layerParam
        })
        let layer = new window.Cesium.ImageryLayer(provider, option);
        imageryLayers.add(layer);
        const returnObj = {
            sourceName: sourceName,
            layer: layer,
            options
        }
        provider.readyPromise.then(bool => {
            if (bool) {
                if (isFlyto) {
                    try {
                        if (mapConfig.fullExtent.xmin < 0 || mapConfig.fullExtent.xmin < 0) {
                            if (mapConfig.initialExtent.xmin < 0) {
                                viewer.camera.flyTo({
                                    destination: window.Cesium.Rectangle.fromDegrees(mapConfig.fullExtent.xmin, mapConfig.fullExtent.ymax, mapConfig.fullExtent.xmax, mapConfig.fullExtent.ymin)
                                });
                            } else {
                                viewer.camera.flyTo({
                                    destination: window.Cesium.Rectangle.fromDegrees(mapConfig.initialExtent.xmin, mapConfig.initialExtent.ymax, mapConfig.initialExtent.xmax, mapConfig.initialExtent.ymin)
                                });
                            }
                        } else {
                            viewer.camera.flyTo({
                                destination: window.Cesium.Rectangle.fromDegrees(mapConfig.fullExtent.xmin, mapConfig.fullExtent.ymax, mapConfig.fullExtent.xmax, mapConfig.fullExtent.ymin)
                            });
                        }

                    } catch (e) {
                        console.error('fullextent 或者 initalExtent 有误！')
                    }
                }
                console.log('执行了场景')
                if (!notSave) {
                    addMyLayerstoViewer(viewer, returnObj);
                }
                eventEmitter.emit('layerChange', {type: 'add',data:returnObj})
                resolve(returnObj)
            }
        })

    })
}
/**
 * 添加SuperMap iServer REST
 * @param {*} viewer
 * @param {*} layerInfo
 */
export const addSuperMapRestLayers = function (viewer, layerInfo, notSave) {
    return new Promise((resolve) => {
        const imageryLayers = viewer.imageryLayers;
        const {
            url,
            isFlyto,
            sourceName,
            options,
            layer
        } = layerInfo;
        // 获取iserver的基本信息
        let provider = new window.Cesium.SuperMapImageryProvider({
            url: url,
            name: layer || ''
        });
        const layerInstance = imageryLayers.addImageryProvider(provider)
        const returnObj = {
            sourceName: sourceName,
            layer: layerInstance,
            options
        }
        if (isFlyto) {
            viewer.flyTo(layerInstance);
        }
        if (!notSave) {
            addMyLayerstoViewer(viewer, returnObj)
        }
        provider.readyPromise.then(bool => {
            if (bool) {
                console.log('执行了rest');
                let returnObj = {
                    sourceName: sourceName,
                    layer: layerInstance
                }
                eventEmitter.emit('layerChange', {type: 'add',data:returnObj})
                resolve(returnObj)
            }
        })
    })
};
/**
 *添加iserver三维服务
 * @param viewer,layerInfo
 *
 */

export const addScpLayer = function (viewer, url) {
    return new Promise((resolve, reject) => {
        const scene = viewer.scene
        scene.addS3MTilesLayerByScp(url).then((layer) => {
            scene.camera.setView({
                destination: window.Cesium.Cartesian3.fromDegrees(layer.lon, layer.lat, 1200.0)
            })
            const returnObj = {
                layer: layer,
            }
            eventEmitter.emit('layerChange', {type: 'add',data:returnObj})
            resolve(returnObj)
        })
    })

}

export const addSceneLayer = function (viewer, layerInfo, notSave) {
    return new Promise((resolve) => {
        const scene = viewer.scene
        const {
            url,
            sourceName,
            options,
        } = layerInfo;
        let promise;
        promise = scene.open(url);
        window.Cesium.when(
            promise,
            function (layers) {
                if (options) {
                    if (util.judgeDataType(options) === 'Array') {
                        console.log('执行数组options的属性附加开始');
                        options.forEach((option) => {
                            const layer = layers.find(layer => layer.name === option.name);
                            if (layer) {
                                if (option.LoadingPriority) {
                                    layer.LoadingPriority = window.Cesium.LoadingPriorityMode.Child_Priority_NonLinear;
                                    delete option.LoadingPriority
                                }

                                for (let i in option) {
                                    if (i !== 'name') {
                                        layer[i] = option[i]
                                    }

                                }
                            }
                        });
                        console.log('执行了数组options的属性附加')
                        console.log(layers)

                    }
                    if (util.judgeDataType(options) === 'Object') {
                        layers.forEach(layer => {
                            if (options.LoadingPriority) {
                                layer.LoadingPriority = window.Cesium.LoadingPriorityMode.Child_Priority_NonLinear;
                                delete options.LoadingPriority
                            }
                            for (let i in options) {
                                layer[i] = options[i]
                            }
                        })
                        console.log(layers)
                    }
                }
                const returnObj = {
                    sourceName: sourceName,
                    layer: layers,
                    options,
                }
                console.log('执行了场景');
                if (!notSave) {
                    addMyLayerstoViewer(viewer, returnObj);
                }
                eventEmitter.emit('layerChange', {type: 'add',data:returnObj})
                resolve(returnObj)
            },
            function () {
                const title =
                    "加载SCP失败，请检查网络连接状态或者url地址是否正确？";
                console.log(title)
            }
        );
    })

}
/**
 * 移除图层
 * @param viewer
 * @param layer
 */
export const removeViewLayer = function (viewer, layer, name) {
    if (layer) {
        if(layer instanceof  Array) {
            layer.forEach(lay => viewer.scene.layers.remove(lay.name))
        } else {
            if (layer.name) {
                viewer.scene.layers.remove(layer.name);
            } else {
                viewer.imageryLayers.remove(layer);
            }
        }
        eventEmitter.emit('layerChange', {type: 'delete',data: layer})
    }
    // 对自定义图层列表进行操作
    if(viewer._loadedLayer) {
        let layerIndex = viewer._loadedLayer.findIndex(layerInfo => layerInfo.layer === layer);
        if(layerIndex > -1) {
            viewer._loadedLayer.splice(layerIndex, 1)
        }
    }

};


/**
 * 添加可视化对象
 * @param viewer
 * @param type 对象类型
 * @param config  对象配置
 * @returns {window.Cesium.Entity}
 */
export const addEntityLayer = function (viewer, type, config) {
    let entitySource = {};
    entitySource[type] = config;
    let entityInstance = new window.Cesium.Entity(entitySource);
    viewer.entities.add(entityInstance);
    viewer.pickEvent.addEventListener(function (feature) {
        console.log(feature)
    });
    return entityInstance
};

/**
 * 删除可视化实例
 * @param viewer
 * @param entity
 */
export const removeEntityLayer = function (viewer, entity) {
    if (entity) {
        viewer.entities.remove(entity)
    } else {
        viewer.entities.removeAll()
    }
}

export const changeLayerAttr = function(targetLayer, type, value) {
    let operateLayers = targetLayer instanceof Array? targetLayer: [targetLayer];
    switch (type) {
        case 'opacity':
            operateLayers.forEach(layer => {
                if(layer.alpha) {
                    layer.alpha = value;
                } else {
                    var fillColor = layer.style3D.fillForeColor;
                    fillColor.alpha = value;
                    layer.style3D.fillForeColor = fillColor;
                    layer.refresh();
                }
            })
        break;
        case 'visible':
            operateLayers.forEach(layer => {
                // imagery 和  s3m 不一样
                layer.show = value;
                layer.visible = value;
            })
            break;

    }
}

export const addTerrianLayer = () => {

}