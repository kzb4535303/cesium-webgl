import './Home.scss';
import * as React from "react";
import Earth from "../../components/Earth/Earth";
import SourceTree from "../../components/SourceTree/SourceTree";

export default class Home extends React.Component {
    render() {
        return (
            <div className="home">
                <div className="sourceTree-panel">
                    <SourceTree />
                </div>
                <Earth />
            </div>
        )
    }
}
