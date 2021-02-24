import {Button, Checkbox, Popover, Collapse,Slider, Switch} from 'antd';
import {useEffect, useState} from "react";
import CesiumTools from '../../../controller/index'
const { Panel } = Collapse;
export default function LayerManageTool() {
    let [loadedLayer, setLoadedLayer] = useState([]);
    useEffect(() => {
        CesiumTools.eventEmitter.on('layerChange',() => {
            setLoadedLayer(window.viewerInstance._loadedLayer)
            console.log(window.viewerInstance._loadedLayer)
        })
    },[])
    const [layerPanelVisible, setLayerPanelVisible] = useState(false)
    const [analyzePanelVisible, setAnalyzePanelVisible] = useState(false)
    const layerContent = (
        <Collapse ghost>
            {loadedLayer.map((layerInfo, index) => {
                return  (
                    <Panel header={layerInfo.sourceName} key={index}>
                        <span>透明度:<Slider min={0} step={0.1} max={1} defaultValue={1} onChange={(value) => CesiumTools.changeLayerAttr(layerInfo.layer,'opacity', value)}  /></span>
                        <span>显示隐藏: <Switch defaultChecked  onChange={(value) => CesiumTools.changeLayerAttr(layerInfo.layer,'visible', value)} /></span>
                    </Panel>

                )
            })}
        </Collapse>
    )
    return (
        <div>
            <Popover
                content={layerContent}
                title="图层列表"
                trigger="click"
                visible={layerPanelVisible}
                onVisibleChange={setLayerPanelVisible}
            >
                <Button type="link">图层</Button>
            </Popover>
            <Popover
                content={layerContent}
                title="三维分析"
                trigger="click"
                visible={analyzePanelVisible}
                onVisibleChange={setAnalyzePanelVisible}
            >
                <Button type="link">分析</Button>
            </Popover>
        </div>

    )
}