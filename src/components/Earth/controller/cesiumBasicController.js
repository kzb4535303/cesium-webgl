/**
 *获取相机的位置信息
 * @param viewer
 * @returns {*
 * longitude	Number	0.0	optionalThe longitude, in radians.
 * latitude	Number	0.0	optionalThe latitude, in radians.
 * height	Number	0.0	optionalThe height, in meters, above the ellipsoid.
 * }
 */

export const getCameraPositionInfos = function(viewer) {
	return viewer.scene.camera.positionCartographic
}

/**
 * 分屏函数
 * @param viewer
 */
export const changeMultiViewport = function(viewer, value) {
	viewer.scene.multiViewportMode = window.Cesium.MultiViewportMode[value];
}
/**
 * 回到地球初始位置
 * @param viewer
 */
export const flyInitalHome = function(viewer) {
	viewer.scene.camera.flyHome(2)
}

export const setSceneMode = function(viewer, type) {
	type.indexOf('2D') > -1 ? viewer.scene.morphTo2D(1) : type.indexOf('3D') > -1 ? viewer.scene.morphTo3D(1) : viewer.scene.morphToColumbusView(1)
}

/**
 * 相机视角到指定点
 * @param viewer   cesiumViewerInstance
 * @param lonlat   array
 * @param duration? second
 */
export const flyToLocationByLonLat = function(viewer, lonlat, duration) {
	viewer.scene.camera.flyHome({
		destination: window.Cesium.Cartesian3.fromDegrees(lonlat.toString()),
		duration: duration || 1,
	})
};

/**
 * 视角指定到当前layer
 * @param viewer
 * @param layer
 * @param duration?
 */
export const flyToCurrentImageryLayer = function(viewer, layer, duration) {
	if(!layer.rectangle) {
		console.err('当前图层没有范围！');
		return
	}
	viewer.scene.camera.flyTo({
		destination: layer.rectangle,
		duration: duration || 1,
	})
}
/**
 * 关闭测量功能
 * @param viewer
 */
export const deactivateMeasure = function(viewer) {
	let measureInstance = getAttributeInViewerInstance(viewer, '_measureInstance');
	if(!measureInstance) {
		console.error('当前 viewer 无测量实例');
		return
	}
	measureInstance.deactivate();
	measureInstance.clear();
	setAttributeInViewerInstance(viewer, '_measureInstance', null);
}
/**
 * 开启测量功能
 * @param viewer
 * @param type
 */
export const activeMeasure = function(viewer, type) {
	let measureInstance;
	if(type === 'Polygon') {
		measureInstance = new window.Cesium.MeasureHandler(viewer, window.Cesium.MeasureMode.Area);
	} else {
		measureInstance = new window.Cesium.MeasureHandler(viewer, window.Cesium.MeasureMode.DVH);
	}
	measureInstance.measureEvt.addEventListener(function(result) {
		if(type === 'Polygon') {
			var mj = Number(result.area);
			var area = mj > 1000000 ? (mj / 1000000).toFixed(2) + 'km²' : mj.toFixed(2) + '㎡'
			measureInstance.areaLabel.text = '面积:' + area;
		} else {
			var distance = result.distance > 1000 ? (result.distance / 1000).toFixed(2) + 'km' : result.distance + 'm';
			var vHeight = result.verticalHeight > 1000 ? (result.verticalHeight / 1000).toFixed(2) + 'km' : result.verticalHeight + 'm';
			var hDistance = result.horizontalDistance > 1000 ? (result.horizontalDistance / 1000).toFixed(2) + 'km' : result.horizontalDistance + 'm';
			measureInstance.disLabel.text = '空间距离:' + distance;
			measureInstance.vLabel.text = '垂直高度:' + vHeight;
			measureInstance.hLabel.text = '水平距离:' + hDistance;
		}
	})
	measureInstance.activate();
	setAttributeInViewerInstance(viewer, '_measureInstance', measureInstance);
};
/**
 * 设置当前视图工具实例
 * @param viewer
 * @param key
 * @param value
 */
export const setAttributeInViewerInstance = (viewer, key, value) => {
	viewer._toolInfos = viewer._toolInfos ? viewer._toolInfos : {};
	viewer._toolInfos[key] = value;
	if(!value) {
		delete viewer._toolInfos[key];
	}
	console.info('viewer实例工具对象 设置' + key + '为' + value)
};
/**
 * 获取当前视图工具实例
 * @param viewer
 * @param key
 * @returns {null|*}
 */
export const getAttributeInViewerInstance = (viewer, key) => {
	if(!viewer._toolInfos) {
		console.error('当前 viewer 没有工具实例');
		return null
	}
	return viewer._toolInfos[key]
}
/**
 * 清除当前视图所有工具
 * @param viewer
 */
export const clearToolsInfos = (viewer) => {
	if(viewer._toolInfos) {
		for(let instance in viewer._toolInfos) {
			viewer._toolInfos[instance].deactivate && viewer._toolInfos[instance].deactivate();
			viewer._toolInfos[instance].clear && viewer._toolInfos[instance].clear();
			setAttributeInViewerInstance(viewer, instance, null);
		}
	}
};

// export const InitSpliceBuildingFunctional = (viewer, $clipMode) => {
//     var handlerBox = new window.Cesium.DrawHandler(viewer, window.Cesium.DrawMode.Box);
//     var editorBox,boxEntity;
//     handlerBox.drawEvt.addEventListener(function(e){
//         boxEntity = e.object;
//         var newDim = boxEntity.box.dimensions.getValue();
//         var position = boxEntity.position.getValue(0);
//         var boxOption = {
//             dimensions: newDim,
//             position: position,
//             clipMode: $clipMode.val(),
//             heading: 0
//         };
//
//         //box编辑
//         editorBox = new window.Cesium.BoxEditor(viewer,boxEntity);
//         editorBox.editEvt.addEventListener(function(e){
//             boxEntity.box.dimensions =  e.dimensions
//             boxEntity.position =e.position;
//             boxEntity.orientation= e.orientation;
//             setClipBox();
//         });
//         editorBox.distanceDisplayCondition =new window.Cesium.DistanceDisplayCondition(0,950);
//         editorBox.activate();
//         setAllLayersClipOptions(boxOption);
//         handlerBox.clear();
//         handlerBox.deactivate();
//     });
//     handlerBox.activate();
//     function setClipBox() {
//         var clipMode = $clipMode.val();
//         if(typeof(boxEntity)=="undefined")
//         {
//             return ;
//         }
//         var newDim = boxEntity.box.dimensions.getValue();
//         var position = boxEntity.position.getValue(0);
//
//         var heading = 0;
//         if(typeof(boxEntity.orientation)!="undefined")
//         {
//             let rotationM3 =window.Cesium.Matrix3.fromQuaternion(boxEntity.orientation._value,new window.Cesium.Matrix3());
//             let localFrame =window.Cesium.Matrix4.fromRotationTranslation(rotationM3,window.Cesium.Cartesian3.ZERO,new window.Cesium.Matrix4());
//             let inverse =window.Cesium.Matrix4.inverse(window.Cesium.Transforms.eastNorthUpToFixedFrame(position),new window.Cesium.Matrix4());
//             let hprm =window.Cesium.Matrix4.multiply(inverse,localFrame,new window.Cesium.Matrix4());
//             var rotation = window.Cesium.Matrix4.getMatrix3(hprm,new window.Cesium.Matrix3());
//             let hpr =  window.Cesium.HeadingPitchRoll.fromQuaternion(window.Cesium.Quaternion.fromRotationMatrix(rotation));
//             heading = hpr.heading;
//         }
//
//
//         var boxOptions = {
//             dimensions: newDim,
//             position: position,
//             clipMode: clipMode,
//             heading: heading
//         };
//         setAllLayersClipOptions(boxOptions);
//     }
// }

export const getScreenCenterPoint = (viewer) => {
	var rectangle = viewer.camera.computeViewRectangle();
	var west = rectangle.west / Math.PI * 180;
	var north = rectangle.north / Math.PI * 180;
	var east = rectangle.east / Math.PI * 180;
	var south = rectangle.south / Math.PI * 180;
	var centerX = (west + east) / 2;
	var centerY = (north + south) / 2;
	return {
		x: centerX,
		y: centerY
	}
}

// 清除所有与实例无关的图层
export const removeAllEntitiesLayer = (viewer) => {
	if(viewer.entities) viewer.entities.removeAll();
}

// 点击事件开启
export const allowMapClick = (viewer, fun) => {
	clearToolsInfos(viewer)
	const handler = new window.Cesium.ScreenSpaceEventHandler(viewer.canvas);
	handler.setInputAction(fun, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);
	handler.clear = handler.destroy;
	setAttributeInViewerInstance(viewer, '_handler', handler);
}
// 设置地形显隐
export const setTerrianVisible = (viewer, visible) => {
	if(!viewer.scene.terrainProviderNormal) {
		viewer.scene.terrainProviderNormal = viewer.scene.terrainProvider;
	}

	if(visible) {
		viewer.scene.terrainProvider = viewer.scene.terrainProviderNormal;
	} else {
		viewer.scene.terrainProvider = new window.Cesium.EllipsoidTerrainProvider({});
	}
}