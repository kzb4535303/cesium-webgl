export const queryEventArgsIsnull = function (queryEventArgs) {
    return (queryEventArgs &&
        queryEventArgs.originResult &&
        queryEventArgs.originResult.features &&
        queryEventArgs.originResult.features.length)
}
export const getPosotion = function (viewer, e) {
    const scene = viewer.scene;
    const Cesium = window.Cesium
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    var position = scene.pickPosition(e.position);
    if (!position) {
        position = Cesium.Cartesian3.fromDegrees(0, 0, 0);
    }
    let scenePosition = position;
    var windowPosition = new Cesium.Cartesian2();
    handler.setInputAction(function () {
        console.log( Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, scenePosition, windowPosition))
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

}
//添加建筑名字和小气泡
/**
 * 
 * @param {*} viewer viewer实例
 * @param {*} image 小气泡图片
 * @param {*} text 显示的建筑名字
 * @param {*} LEVELTOP 建筑高度
 * @param {*} x 显示的经纬度
 * @param {*} y 显示的经纬度
 */
export const addBubbleEntites = function (viewer, image, text, LEVELTOP, x, y) {
    viewer.entities.add({
        //添加小气泡和文字
        position: window.Cesium.Cartesian3.fromDegrees(
            parseFloat(x),
            parseFloat(y),
            parseFloat(LEVELTOP + 20)
        ),
        billboard: {
            image: image,
            width: 30,
            height: 40,
        },
        name: "名字",//entity的名字
        label: {
            text: text,
            fillColor: window.Cesium.Color.YELLOW,
            outlineColor: window.Cesium.Color.BLACK,
            outlineWidth: 2,
            font: '20px sans-serif',
            style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
            heightReference: window.Cesium.HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        classificationType: window.Cesium.ClassificationType.TERRAIN,
    });
}
//显示三维楼盘（添加白模）
/**
 * 可以用于将整栋楼白模画出来  也可以画一层 一户 关键是points3D
 * @param {*} viewer viewer实例
 * @param {*} id //当前添加的entities的id号 唯一  用于之后查找
 * @param {*} name ////当前添加的entities的name  不必唯一 用于之后查找
 * @param {*} points3D 根据数据服务返回的一系列坐标[lat,lng,lat,lng....]
 * @param {*} color //拉伸的白模的颜色
 * @param {*} bottonNum //白模的基底标高  也就是当前白模的底部
 * @param {*} extrudedHeight //白模的最高的位置  也就是当前白模的顶部
 */
export const addWhiteModelEntites = function (viewer, id, name, points3D, color, bottonNum, extrudedHeight) {
    viewer.entities.add({
        id: id,
        polygon: {
            hierarchy: window.Cesium.Cartesian3.fromDegreesArray(points3D),
            material: color,
            height: bottonNum,
            extrudedHeight: extrudedHeight,
            outline: true,
            outlineColor: window.Cesium.Color.WHITE,
        },
        _myColor:color,
        name: name,
        classificationType: window.Cesium.ClassificationType.S3M_TILE, // 贴在S3M模型表面
    });

}
// 恢复已经上升或者下降的白模的高度  
/**
 * 
 * @param {*} viewer 
 * @param {*} allHeight //白模原本高度
 */
export const resetWhiteModelHeight = function (viewer, allHeight) {
    console.log(viewer)
    let entitiesarray = viewer.entities._entities._array;
    entitiesarray = entitiesarray.filter((entity) => {
        // return entity._name != "名字";
        return entity._name.indexOf('_floor') !== -1
    });
    if (entitiesarray.length && allHeight.length) {
        //将所有白模归位
        for (var j = 0; j < entitiesarray.length - 1; j++) {
            const height = parseFloat(allHeight[j]);
            entitiesarray[j].polygon.height = height;
            entitiesarray[j].polygon.extrudedHeight = height + 3.2;
        }
    }
}
//白模偏移
/**
 * 
 * @param {*} viewer 
 * @param {*} filterObj  要偏移的对象的筛选条件
 * @param {*} height 要偏移的对象的底部高度
 * @param {*} extrudedHeight 要偏移的对象的顶部高度
 */
export const offsetWhiteModelHeight = function (viewer, filterObj, height, extrudedHeight) {
    let entitiesarray = viewer.entities._entities._array;
    const { key, value } = filterObj
    const entitiesFilterArray = entitiesarray.filter((entitie) => {
        //所选楼层
        return entitie[key] == value;
    });
    if (entitiesFilterArray.length) {
        //将选中楼层的白模升高
        for (var i = 0; i < entitiesFilterArray.length; i++) {
            entitiesFilterArray[i].polygon.height = height;
            entitiesFilterArray[i].polygon.extrudedHeight = extrudedHeight;
        }
    }
}

/** ------------------------------------------ 通视分析 ----------------------------------------------- **/
/**
 * 初始化通视
 * @param viewer
 * @returns {{handler: *, destroyFun: (function(): *), sightLineInstance: *}}
 */
export const initSightLine = (viewer) => {
    let sightLineInstance = new window.Cesium.Sightline(viewer.scene);
    sightLineInstance.couldRemove = false;
    let handler = new window.Cesium.DrawHandler(viewer, window.Cesium.DrawMode.Point);
    let hanlderFun = (result) => {
        let point = result.object;
        point.show = false;
        let position = result.object.position;
        //将获取的点的位置转化成经纬度
        let cartographic = window.Cesium.Cartographic.fromCartesian(position);
        let longitude = window.Cesium.Math.toDegrees(cartographic.longitude);
        let latitude = window.Cesium.Math.toDegrees(cartographic.latitude);
        let height = cartographic.height;
        if(viewer.scene.viewFlag) {
            //设置观察点
            sightLineInstance.viewPosition = [longitude, latitude, height];
            viewer.scene.viewFlag = false;
        }else {
            //添加目标点
            sightLineInstance.addTargetPoint({
                position : [longitude, latitude, height],
                name : "point" + new Date()
            });
            sightLineInstance.couldRemove = true;
        }
    }
    handler.drawEvt.addEventListener(hanlderFun);
    sightLineInstance.build();
    return {
        sightLineInstance,
        handler,
        destroyFun: () => handler.drawEvt.removeEventListener(hanlderFun)
    }
}

/**
 * 添加 观测点
 * @param sightLineInstance
 * @param handler
 * @param viewer
 */
export const addSightLineViewPoint = (sightLineInstance, handler, viewer) => {
    if(handler && handler.active) {
        return;
    }
    viewer.scene.viewFlag = true;
    if(sightLineInstance.couldRemove) {
        sightLineInstance.removeAllTargetPoint();
    }
    handler.activate();
}

/**
 * 添加目标点
 * @param sightLineInstance
 * @param handler
 * @param viewer
 */
export const addSightLineTargetPoint = (sightLineInstance, handler, viewer) => {
    viewer.scene.viewFlag = false;
    handler.activate();
}

/**
 * 清除通视
 * @param sightLineInstance
 * @param handler
 * @param viewer
 */
export const clearSightLine = (sightLineInstance, handler) => {
    handler.clear();
    if(sightLineInstance.couldRemove){
        sightLineInstance.removeAllTargetPoint();
        sightLineInstance.couldRemove = false;
    }
}
/** ------------------------------------------ 通视分析 ----------------------------------------------- **/
/** ------------------------------------------ 可视域分析 ----------------------------------------------- **/

export const initViewshed =  (viewer) => {
    let pointHandler, viewPosition;
    const { scene } = viewer;
    if (!scene.pickPositionSupported) {
        console.error('不支持深度纹理,可视域分析功能无法使用（无法添加观测）！');
        return
    }
    // 先将此标记置为true，不激活鼠标移动事件中对可视域分析对象的操作
    scene.viewFlag = true;
    pointHandler = new window.Cesium.DrawHandler(viewer, window.Cesium.DrawMode.Point);
    // 创建可视域分析对象
    let viewshedInstance = new window.Cesium.ViewShed3D(scene);
    let handler = new window.Cesium.ScreenSpaceEventHandler(scene.canvas);
    // 鼠标移动时间回调
    handler.setInputAction(function (e) {
        // 若此标记为false，则激活对可视域分析对象的操作
        if (!scene.viewFlag) {
            //获取鼠标屏幕坐标,并将其转化成笛卡尔坐标
            var position = e.endPosition;
            var last = scene.pickPosition(position);
            //计算该点与视口位置点坐标的距离
            var distance = window.Cesium.Cartesian3.distance(viewPosition, last);

            if (distance > 0) {
                // 将鼠标当前点坐标转化成经纬度
                var cartographic = window.Cesium.Cartographic.fromCartesian(last);
                var longitude = window.Cesium.Math.toDegrees(cartographic.longitude);
                var latitude = window.Cesium.Math.toDegrees(cartographic.latitude);
                var height = cartographic.height;
                // 通过该点设置可视域分析对象的距离及方向
                viewshedInstance.setDistDirByPoint([longitude, latitude, height]);
            }
        }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(function () {
        //鼠标右键事件回调，不再执行鼠标移动事件中对可视域的操作
        scene.viewFlag = true;
    }, window.Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    pointHandler.drawEvt.addEventListener(function (result) {
        let point = result.object;
        let position = point.position;
        viewPosition = position;
        // 将获取的点的位置转化成经纬度
        let cartographic = window.Cesium.Cartographic.fromCartesian(position);
        let longitude = window.Cesium.Math.toDegrees(cartographic.longitude);
        let latitude = window.Cesium.Math.toDegrees(cartographic.latitude);
        let height = cartographic.height + 1.8;
        point.position = window.Cesium.Cartesian3.fromDegrees(longitude, latitude, height);

        if (scene.viewFlag) {
            // 设置视口位置
            viewshedInstance.viewPosition = [longitude, latitude, height];
            viewshedInstance.build();
            // 将标记置为false以激活鼠标移动回调里面的设置可视域操作
            scene.viewFlag = false;
        }
    });
    return {
        viewshedInstance: viewshedInstance,
        handler: handler,
        pointHandler: pointHandler,
        destroyFun: () => {
            handler.destroy();
            pointHandler.clear();
            pointHandler.deactivate();
        }
    }
}
export const addViewshedPoint= (viewshedInstance, pointHandler, viewer) => {
    const { scene } = viewer;
    //先清除之前的可视域分析
    viewshedInstance.distance = 0.1;
    scene.viewFlag = true;
    //激活绘制点类
    pointHandler.activate();
}
export const clearViewshed = function(viewshedInstance,pointHandler, viewer) {
    viewshedInstance.distance = 0.1;
    pointHandler.clear();
}
/** ------------------------------------------ 可视域分析 ----------------------------------------------- **/
/** ------------------------------------------ 天际线分析 ----------------------------------------------- **/
//提取天际线
export const initSkyLine = function(viewer){
    const Cesium = window.Cesium;
    const {scene} = viewer;
    const skyLineInstance = new Cesium.Skyline(scene);//创建天际线分析对象
    return {
        skyLineInstance: skyLineInstance,
        destroyFun:() => {

        }
    }
}
export const getSkyLine = (skyLineInstance, viewer) => {
    const {scene} = viewer;
    const Cesium = window.Cesium;
    var cartographic = scene.camera.positionCartographic;
    var longitude = Cesium.Math.toDegrees(cartographic.longitude);
    var latitude = Cesium.Math.toDegrees(cartographic.latitude);
    var height = cartographic.height;
    //天际线分析的视口位置设置成当前相机位置
    skyLineInstance.lineWidth=3
    skyLineInstance.viewPosition = [longitude, latitude, height];
    console.log(skyLineInstance)
    //设置俯仰和方向
    skyLineInstance.pitch = Cesium.Math.toDegrees(scene.camera.pitch);
    skyLineInstance.direction = Cesium.Math.toDegrees(scene.camera.heading);
    skyLineInstance.radius = 10000; // 天际线分析半径设置为10000米
    skyLineInstance.build();
}
export const clearSkyLine = (skyLineInstance, viewer) => {
    skyLineInstance.clear();
}
export const get2DSkyLine = (skyLineInstance) => {
    //获取二维天际线对象
    var object = skyLineInstance.getSkyline2D();
    return object

}
/** ------------------------------------------ 天际线分析 ----------------------------------------------- **/
/** ------------------------------------------ 剖面分析 ----------------------------------------------- **/
/**
 * 初始化剖面分析
 * @param viewer
 * @param canvasElement
 */
export const initProfile = (viewer, canvasElement) => {
    const {scene} = viewer;
    const {Cesium} = window;
    var profileInstance = new Cesium.Profile(scene);
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    var lineHandler = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Line);
    lineHandler.drawEvt.addEventListener(function(result) {
        var line = result.object;
        var startPoint = line._positions[0];
        var endPoint = line._positions[line._positions.length - 1];
        var scartographic = Cesium.Cartographic.fromCartesian(startPoint);
        var slongitude = Cesium.Math.toDegrees(scartographic.longitude);
        var slatitude = Cesium.Math.toDegrees(scartographic.latitude);
        var sheight = scartographic.height;

        var ecartographic = Cesium.Cartographic.fromCartesian(endPoint);
        var elongitude = Cesium.Math.toDegrees(ecartographic.longitude);
        var elatitude = Cesium.Math.toDegrees(ecartographic.latitude);
        var eheight = ecartographic.height;

        //设置坡面分析的开始和结束位置
        profileInstance.startPoint = [slongitude, slatitude, sheight];
        profileInstance.endPoint = [elongitude, elatitude, eheight];

        profileInstance.extendHeight = 40;
        // 获取剖面分析结果
        profileInstance.getBuffer((buffer) => {
            canvasElement.height = profileInstance._textureHeight;
            canvasElement.width = profileInstance._textureWidth;
            var ctx = canvasElement.getContext("2d");
            var imgData = ctx.createImageData(profileInstance._textureWidth, profileInstance._textureHeight);
            imgData.data.set(buffer);
            //在canvas上绘制图片
            ctx.putImageData(imgData, 0, 0);
            canvasElement.style.width='600px';
            canvasElement.style.height='450px';
        });
        profileInstance.build();
    });
    return {
        profileInstance,
        lineHandler,
        handler,
        destroyFun: () => {
            handler.destroy();
            lineHandler.clear();
            lineHandler.deactivate();
        }
    }
};
export const getProfile = (profileInstance, handler, lineHandler, canvasElement) => {
    const Cesium = window.Cesium;
    //先清除之前绘制的线
    clearProfile(lineHandler, canvasElement)
    if(lineHandler.active) {
        return;
    } else {
        lineHandler.activate();
        //由于剖面分析只能绘制直线，此处绘制时单击两次就触发结束事件
        handler.setInputAction(function(e) {
            if(lineHandler.polyline._actualPositions.length == 2) {
                var result = {};
                result.object = lineHandler.polyline;
                lineHandler.drawEvt.raiseEvent(result);
                lineHandler.deactivate();
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
};
export const clearProfile = (lineHandler, canvasElement) => {
    lineHandler.polyline = null;
    lineHandler.clear();
    canvasElement.style.width = 0;
    canvasElement.style.height = 0;
}
/** ------------------------------------------ 剖面分析 ----------------------------------------------- **/
/** ------------------------------------------ 坡度坡向分析 ----------------------------------------------- **/
export const initTerrainSlope = (viewer) => {
    const {Cesium} = window;
    let terrainSlopeInstance = new Cesium.SlopeSetting();
    // 默认显示颜色和箭头
    terrainSlopeInstance.DisplayMode = Cesium.SlopeSettingEnum.DisplayMode.FACE_AND_ARROW;
    // 默认坡度区间
    terrainSlopeInstance.MaxVisibleValue ="78";
    terrainSlopeInstance.MinVisibleValue = "0";
    // 颜色集
    let colorTable = new Cesium.ColorTable();
    colorTable.insert(80, new Cesium.Color(255 / 255, 0 / 255, 0 / 255));
    colorTable.insert(50, new Cesium.Color(221 / 255, 224 / 255, 7 / 255));
    colorTable.insert(30, new Cesium.Color(20 / 255, 187 / 255, 18 / 255));
    colorTable.insert(20, new Cesium.Color(0, 161 / 255, 1));
    colorTable.insert(0, new Cesium.Color(9 / 255, 9 / 255, 255 / 255));
    //计算模式
    var wide;
    wide = Cesium.HypsometricSettingEnum.AnalysisRegionMode.ARM_REGION;
    terrainSlopeInstance.ColorTable = colorTable;
    terrainSlopeInstance.Opacity = 0.5;
    //绘制多边形
    var polygonHandler = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Polygon, 0);
    polygonHandler.activeEvt.addEventListener(function (isActive) {
        if (isActive == true) {
            viewer.enableCursorStyle = false;
            viewer._element.style.cursor = '';
            document.querySelector('body').className = 'draw-cur';
        } else {
            viewer.enableCursorStyle = true;
            document.querySelector('body').className = '';
        }
    })
    polygonHandler.drawEvt.addEventListener(function (result) {
        if (!result.object.positions) {
            polygonHandler.polygon.show = false;
            polygonHandler.polyline.show = false;
            polygonHandler.deactivate();
            polygonHandler.activate();
            return;
        }
        var array = [].concat(result.object.positions);
        var positions = [];
        for (var i = 0, len = array.length; i < len; i++) {
            var cartographic = Cesium.Cartographic.fromCartesian(array[i]);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            var h = cartographic.height;
            if (positions.indexOf(longitude) == -1 && positions.indexOf(latitude) == -1) {
                positions.push(longitude);
                positions.push(latitude);
                positions.push(h);
            }
        }
        terrainSlopeInstance.CoverageArea = positions;
        viewer.scene.globe.SlopeSetting = {
            slopeSetting: terrainSlopeInstance,
            analysisMode: wide
        };
        console.log(viewer.scene.globe.SlopeSetting)
        polygonHandler.polygon.show = false;
        polygonHandler.polyline.show = true;
    });
    return {
        terrainSlopeInstance,
        polygonHandler,
        destroyFun: () => {
            polygonHandler.clear();
            polygonHandler.deactivate()
        }
    }
}
export const getTerrainSlope = (polygonHandler) => {
    if(polygonHandler) {
        polygonHandler.deactivate()
    }
    polygonHandler.activate()
}
export const clearTerrainSlope = (polygonHandler, terrainSlopeInstance, viewer) => {
    polygonHandler.deactivate()
    const {Cesium} = window;
    viewer.scene.globe.SlopeSetting = {
        slopeSetting: terrainSlopeInstance,
        analysisMode: Cesium.HypsometricSettingEnum.AnalysisRegionMode.ARM_NONE
    };
    polygonHandler.polygon.show = false;
    polygonHandler.polyline.show = false;

}
/** ------------------------------------------ 坡度坡向分析 ----------------------------------------------- **/
/** ------------------------------------------ 裁剪Box分析 ----------------------------------------------- **/
export const initClipBox = (viewer) => {
    const {Cesium} = window;
    let boxEntity;
    let boxHandler = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Box);
    boxHandler.drawEvt.addEventListener(function(e){
        boxEntity = e.object;
        let newDim = boxEntity.box.dimensions.getValue();
        let position = boxEntity.position.getValue(0);
        let boxOption = {
            dimensions: newDim,
            position: position,
            clipMode: 'clip_behind_all_plane', //裁剪掉盒子内
            heading: 0
        };
        setAllLayersClipOptions(boxOption);
    });
    function setAllLayersClipOptions(boxOptions) {
        console.log(viewer.scene.layers, boxOptions)
        for(var i = 0, j = viewer.scene.layers.layerQueue.length; i < j; i++) {
            viewer.scene.layers.layerQueue[i].setCustomClipBox(boxOptions);
        }
    }
    return {
        clipBoxInstance: null,
        boxHandler,
        destroyFun:() => {
            boxHandler.clear();
            boxHandler.deactivate();
        }
    }

}
export const getClipBox = (boxHandler) => {
    boxHandler.activate();
}
export const clearClipBox = (boxHandler, viewer) => {
    for(var i = 0, j = viewer.scene.layers.layerQueue.length; i < j; i++) {
        viewer.scene.layers.layerQueue[i].clearCustomClipBox();
    }
    boxHandler.clear();
    boxHandler.deactivate();
};
/** ------------------------------------------ 裁剪Box分析 ----------------------------------------------- **/
/** ------------------------------------------ 地形开挖分析 ----------------------------------------------- **/
export const initDigTerrain = (viewer, height) => {
    const {Cesium} = window;
    //绘制多边形
    let polygonHandler = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Polygon, 0);
    polygonHandler.drawEvt.addEventListener(function(result){
        var array = [].concat(result.object.positions);
        var positions = [];
        for(var i = 0, len = array.length; i < len; i ++){
            var cartographic = Cesium.Cartographic.fromCartesian(array[i]);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            var h=cartographic.height;
            if(positions.indexOf(longitude)==-1&&positions.indexOf(latitude)==-1){
                positions.push(longitude);
                positions.push(latitude);
                positions.push(h);
            }
        }
        viewer.scene.globe.removeAllExcavationRegion();
        viewer.scene.globe.addExcavationRegion({
            name : 'ggg' ,
            position : positions,
            height : height,
            transparent : false
        });
        polygonHandler.polygon.show = false;
        polygonHandler.polyline.show = false;
        polygonHandler.deactivate();
    })
    return {
        digTerrainInstance: null,
        polygonHandler,
        destroyFun: () => {
            polygonHandler.clear();
            polygonHandler.deactivate();
        }
    }
};
export const getDigTerrain = (polygonHandler) => {
    polygonHandler.activate()
}
export const clearDigTerrain = (polygonHandler, viewer) => {
    viewer.scene.globe.removeAllExcavationRegion();
    polygonHandler.deactivate();
    if(polygonHandler.polygon) {
        polygonHandler.polygon.show=false;
        polygonHandler.polyline.show=false;
    }

}
/** ------------------------------------------ 地形开挖分析 ----------------------------------------------- **/
/** ------------------------------------------ 阴影分析 ----------------------------------------------- **/

export const initShadowQuery = (viewer, shadowParamInfo) => {
    const {Cesium} = window;
    const {scene} = viewer;
    //创建阴影查询对象
    let shadowQueryInstance = new Cesium.ShadowQueryPoints(scene);
    //设置图层的阴影模式
    for(var i = 0, j = viewer.scene.layers.layerQueue.length; i < j; i++) {
        viewer.scene.layers.layerQueue[i].shadowType = 2;
    }
    shadowQueryInstance.build();
    setCurrentTime(viewer, shadowParamInfo);
    let points = [];
    let polygonHandler = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Polygon,0);
    polygonHandler.drawEvt.addEventListener(function(result){
        let polygon = result.object;
        polygon.show = false;
        polygonHandler.polyline.show = false;
        let positions = [].concat(polygon.positions);
        positions = Cesium.arrayRemoveDuplicates(positions,Cesium.Cartesian3.equalsEpsilon);
        //遍历多边形，取出所有点
        for(var i = 0, len = positions.length; i < len; i++) {
            //转化为经纬度，并加入至临时数组
            var cartographic = Cesium.Cartographic.fromCartesian(polygon.positions[i]);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            points.push(longitude);
            points.push(latitude);
        }
        //设置分析对象的开始结束时间
        var dateValue = shadowParamInfo.date;
        var startTime = new Date(dateValue);
        startTime.setHours(shadowParamInfo.startTime);
        shadowQueryInstance.startTime = Cesium.JulianDate.fromDate(startTime);

        var endTime = new Date(dateValue);
        endTime.setHours(shadowParamInfo.endTime);
        shadowQueryInstance.endTime = Cesium.JulianDate.fromDate(endTime);

        //设置当前时间
        setCurrentTime(viewer, shadowParamInfo);
        shadowQueryInstance.spacing = 10;
        shadowQueryInstance.timeInterval = 60;
        //设置分析区域、底部高程和拉伸高度
        var bh = Number(shadowParamInfo.bottomHeight);
        var eh = Number(shadowParamInfo.extrudeHeight);
        shadowQueryInstance.qureyRegion({
            position : points,
            bottom : bh,
            extend : eh
        });
    })
    return {
        points,
        shadowQueryInstance,
        polygonHandler,
        destroyFun: () => {
            polygonHandler.clear();
            polygonHandler.deactivate();
        }
    }
}
function setCurrentTime(viewer, shadowParamInfo) {
    const {Cesium} = window;
    var endTime = new Date(shadowParamInfo.date);
    endTime.setHours(Number(shadowParamInfo.endTime));
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(endTime);
    viewer.clock.multiplier = 1;
    viewer.clock.shouldAnimate = true;
}
// 阴影分析
export const getShadowQuery = (polygonHandler) => {
    polygonHandler.deactivate();
    polygonHandler.activate();
}
// 获取阴影率
export const getShadowRadioDetail = (shadowQueryInstance, viewer, dataCallBack) => {
    const {Cesium} = window;
    const {scene} = viewer;
    var handler=new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function(e){
        var position1=scene.pickPosition(e.position);
        var cartographic=Cesium.Cartographic.fromCartesian(position1);
        var shadowRadio=shadowQueryInstance.getShadowRadio(cartographic);
        var longitude = Cesium.Math.toDegrees(cartographic.longitude);
        var latitude = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height;
        viewer.entities.removeAll();
        if(shadowRadio!=-1) {
            dataCallBack({shadowRadio,longitude,latitude,height})
            viewer.entities.add(new Cesium.Entity({
                point: new Cesium.PointGraphics({
                    color: new Cesium.Color(1, 0, 0, 0.5),
                    pixelSize: 15

                }),
                position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 0.5)
            }));
        }
        else
        {
            dataCallBack({shadowRadio: '',longitude: '',latitude:'',height: ''})
        }
    },Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
// 日照特效
export const showShadowQuery = (shadowQueryInstance, shadowParamInfo,viewer, points) =>{
    const {Cesium} = window;
    var dateVal = shadowParamInfo.date;
    var startTime =  new Date(dateVal);
    var endTime =  new Date(dateVal);
    var shour = Number(shadowParamInfo.startTime);
    var ehour = Number(shadowParamInfo.endTime);
    if(shour > ehour) {
        return;
    }
    shadowQueryInstance.qureyRegion({
        position : [0,0],
        bottom : 0,
        extend : 0
    });
    var nTimer = 0.0;
    var nIntervId = setInterval(function() {
        if(shour < ehour) {
            startTime.setHours(shour);
            startTime.setMinutes(nTimer);
            viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime);
            nTimer += 10.0;
            if(nTimer > 60.0){
                shour += 1.0;
                nTimer = 0.0;
            }
        }else {
            clearInterval(nIntervId);
            shadowQueryInstance.qureyRegion({
                position : points,
                bottom : Number(shadowParamInfo.bottomHeight),
                extend : Number(shadowParamInfo.extrudedHeight)
            });
        }
    }, 20);
};
// 清除阴影分析
export const clearShadowQuery = (polygonHandler,shadowQueryInstance,viewer) => {
    polygonHandler.deactivate();
    polygonHandler.polygon.show = false;
    polygonHandler.polyline.show = false;
    viewer.entities.removeAll();
    shadowQueryInstance.qureyRegion({
        position : [0,0],
        bottom : 0,
        extend : 0
    });
}

/** ------------------------------------------ 阴影分析 ----------------------------------------------- **/
/** ------------------------------------------ 地质体拉伸与剖切 ----------------------------------------------- **/
const addModels = (viewer)=>{
    const Cesium = window.Cesium
    var solidModelsProfile = new Cesium.SolidModelsProfile(viewer.scene);

    var modelUrls = [
        "http://23.36.74.156:8090/iserver/services/data-DiZhiTi/rest/data/datasources/%E5%9C%B0%E8%B4%A8/datasets/Zone_T3xj15_1_1/features/1.json",
        "http://23.36.74.156:8090/iserver/services/data-DiZhiTi/rest/data/datasources/%E5%9C%B0%E8%B4%A8/datasets/Zone_T3xj6_1_1/features/1.json",
        // "http://23.36.74.156:8090/iserver/services/data-DiZhiTi/rest/data/datasources/%E5%9C%B0%E8%B4%A8/datasets/Zone_J1zq_1_1/features/1.json",
        // "http://23.36.74.156:8090/iserver/services/data-DiZhiTi/rest/data/datasources/%E5%9C%B0%E8%B4%A8/datasets/Zone_J1z_1_1/features/1.json",
        // "http://23.36.74.156:8090/iserver/services/data-DiZhiTi/rest/data/datasources/%E5%9C%B0%E8%B4%A8/datasets/Zone_J1zl_1_1/features/1.json"
        // "http://23.36.74.156:8090/iserver/services/data-DiZhiTi/rest/data/datasources/%E5%9C%B0%E8%B4%A8/datasets/Zone_J2x_1_1/features/1.json",
        // "http://23.36.74.156:8090/iserver/services/data-DiZhiTi/rest/data/datasources/%E5%9C%B0%E8%B4%A8/datasets/Zone_J2s1_1_1/features/1.json",
        // "http://23.36.74.156:8090/iserver/services/data-DiZhiTi/rest/data/datasources/%E5%9C%B0%E8%B4%A8/datasets/Zone_J2s23_1_1/features/1.json",
        // "http://23.36.74.156:8090/iserver/services/data-DiZhiTi/rest/data/datasources/%E5%9C%B0%E8%B4%A8/datasets/Zone_Q_1_1/features/1.json"

    ];

        var models = [];
        // 也可以不设置纹理，设置颜色
        models.push({
            model: modelUrls[0],
            color: new Cesium.Color(255,0 ,0, 1)
        });
        models.push({
            model: modelUrls[1],
            color: new Cesium.Color(255, 255, 0, 1)
        });
        // models.push({
        //     model: modelUrls[2],
        //     color: new Cesium.Color(255, 0, 255, 1)
        // });
        // models.push({
        //     model: modelUrls[3],
        //     color: new Cesium.Color(0, 255, 255, 1)
        // });
        // models.push({
        //     model: modelUrls[4],
        //     color: new Cesium.Color(0, 255, 0, 1)
        // });
        // models.push({
        //     model: modelUrls[5],
        //     color: new Cesium.Color(25, 34, 245, 1)
        // });
        // models.push({
        //     model: modelUrls[6],
        //     color: new Cesium.Color(12, 12, 0, 1)
        // });
        // models.push({
        //     model: modelUrls[7],
        //     color: new Cesium.Color(78, 78, 0, 1)
        // });
        // models.push({
        //     model: modelUrls[8],
        //     color: new Cesium.Color(45, 45, 45, 0.5)
        // });
        // models.push({
        //     model: modelUrls[9],
        //     color: new Cesium.Color(115 / 255, 115 / 255, 115 / 255, 1)
        // });
        // models.push({
        //     model: modelUrls[10],
        //     color: new Cesium.Color(171 / 255, 85 / 255, 66 / 255, 1)
        // });
        solidModelsProfile.addModels(models);
        console.log(solidModelsProfile)

        
        return solidModelsProfile
}
//画线，用于剖切地质体
export const initGeological = (viewer) => {
    const {Cesium} = window;
    const solidModelsProfile = addModels(viewer)
    // viewer.scene.camera.setView({
    //     destination: new Cesium.Cartesian3(-1582808.9831425624, 5317106.446328033, 3148119.3469397346),
    //     orientation: {
    //         heading: 4.029329438295484,
    //         pitch: -0.23796647219353817,
    //         roll: 8.994289757424667e-10
    //     }
    // });
    console.log(solidModelsProfile)
    //绘制多边形
    var handlerLine = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Line);
    handlerLine.activeEvt.addEventListener(function (isActive) {
        if (isActive == true) {
            viewer.enableCursorStyle = false;
            viewer._element.style.cursor = '';
        } else {
            viewer.enableCursorStyle = true;
        }
    });
    handlerLine.movingEvt.addEventListener(function (windowPosition) {
        if (handlerLine.isDrawing) {
            console.log('<p>右键结束当前线段，可绘制多条线段</p>')
        } else {
            console.log( '<p>点击绘制第一个点</p>')
        }
    });
    
    
    handlerLine.drawEvt.addEventListener(function (result) {
    
        for (var i = 0; i < result.object.positions.length - 1; i++) {
            var point1 = result.object.positions[i];
            var point2 = result.object.positions[i + 1];
    
            var pointArray = [];
            pointArray.push(point1);
            pointArray.push(point2);
            console.log(pointArray)
            solidModelsProfile.addProfileGeometry(pointArray);
        }
        handlerLine.activate();
    
        viewer.entities.add({
            polyline: {
                positions: result.object.positions,
                width: 2,
                material: Cesium.Color.fromCssColorString('#51ff00')
            }
        });
    
    });
    return {
        GeologicalInstance: null,
        handlerLine,
        solidModelsProfile,
        destroyFun: () => {
            handlerLine.clear();
            handlerLine.deactivate();
        }
    }
};




/** ------------------------------------------ 地质体拉伸与剖切 ----------------------------------------------- **/

/** ------------------------------------------ 地质体剪裁与开挖 ----------------------------------------------- **/
export const  initGeologicalClip = (viewer,dep)=>{
    const {Cesium} =window
    viewer.scene.camera.setView({
        destination: new Cesium.Cartesian3(-1582808.9831425624, 5317106.446328033, 3148119.3469397346),
        orientation: {
            heading: 4.029329438295484,
            pitch: -0.23796647219353817,
            roll: 8.994289757424667e-10
        }
    });
     //绘制裁剪面
     var handlerPolygon = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Polygon);
     handlerPolygon.activeEvt.addEventListener(function (isActive) {
         if (isActive == true) {
             viewer.enableCursorStyle = false;
             viewer._element.style.cursor = '';
         } else {
             viewer.enableCursorStyle = true;
         }
     });
     handlerPolygon.movingEvt.addEventListener(function (windowPosition) {
         if (handlerPolygon.isDrawing) {
             console.log('<p>绘制多边形，</p><p>右键结束绘制.</p>')
         } else {
             console.log('<p>点击绘制第一个点</p>')
         }
     });
     const solidModelsProfile = addModels(viewer)

     handlerPolygon.drawEvt.addEventListener(function (res) {
         var point3dsArray = [];
         var polygon = res.object;
         var positions = [].concat(polygon.positions);
         var point3ds = new Cesium.Point3Ds();

         for (var i = 0; i < positions.length; i++) {
             var cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
             var pntx = Cesium.Math.toDegrees(cartographic.longitude);
             var pnty = Cesium.Math.toDegrees(cartographic.latitude);
             var pntz = cartographic.height + 1000;
             var pnt = new Cesium.Point3D(pntx, pnty, pntz);

             point3ds.add(pnt);
         }
         point3dsArray.push(point3ds);
         var geometry = new Cesium.GeoRegion3D(point3dsArray);
         if (solidModelsProfile.clippingType == Cesium.ClippingType.KeepOutside) {
             geometry.extrudedHeight = -dep;
         } else {
             geometry.extrudedHeight = -7000;
         }

         geometry.isLatLon = false;
         solidModelsProfile.setClipGeometry(geometry);
         //封底
         var geometry2 = new Cesium.GeoRegion3D(point3dsArray);
         geometry2.isLatLon = false;
         if (solidModelsProfile.clippingType == Cesium.ClippingType.KeepOutside) {
             geometry2.bottomAltitude = geometry.extrudedHeight;
             solidModelsProfile.addProfileGeometry(geometry2);
         }

         for (var j = 0; j < positions.length; j++) {
             var singleA = [];
             singleA.push(positions[j]);

             if (j == positions.length - 1) {
                 singleA.push(positions[0]);
             } else {
                 singleA.push(positions[j + 1]);
             }
             solidModelsProfile.addProfileGeometry(singleA);
             console.log(solidModelsProfile)
             solidModelsProfile.build();
         }

         handlerPolygon.clear();
         handlerPolygon.deactivate();
     })
     return {
        GeologicalClipInstance: null,
        handlerPolygon,
        solidModelsProfile,
        destroyFun: () => {
            handlerPolygon.clear();
            handlerPolygon.deactivate();
        }
    }
    

}
/** ------------------------------------------ 地质体剪裁与开挖 ----------------------------------------------- **/
