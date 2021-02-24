import './Earth.scss';
import * as React from "react";
import ToolBar from "./components/toolbar/ToolBar";

export default class Earth extends React.Component {
    state = {
        loadedLayer: [],
    }
    componentDidMount() {
        window.viewerInstance = new window.Cesium.Viewer('earth')
    }
    render() {
        return (
            <div id="earth" className="home">
                <div className="toolbar-box">
                    <ToolBar />
                </div>
            </div>
        )
    }
}
