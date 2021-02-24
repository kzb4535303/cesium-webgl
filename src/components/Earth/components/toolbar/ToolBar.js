import * as React from "react";
import "./ToolBar.scss"
import LayerManageTool from "./components/LayerManageTool";

export default function ToolBar() {
    return (
        <div className="toolbar-container">
            <LayerManageTool />
        </div>
    )
}