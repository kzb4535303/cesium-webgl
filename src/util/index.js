function getRadomId(idLength) {
    return Number(Math.random().toString().substr(3,idLength) + Date.now()).toString(36);
}
function judgeDataType(target) {
    // 单独处理NaN
    if(String(target) === 'NaN') {
        return 'NaN'
    }
    let value = Object.prototype.toString.call(target);
    value = value.replace('[object ', '');
    value = value.replace(']', '');
    return value;
}
function  generateAntdTreeModel(initalData) {
    if(initalData instanceof  Array) {
        initalData.forEach(data => {
            data.title = data.sourceName;
            data.key = data.url;
            data.checkable = !data.children;
            if(data.children) {
                generateAntdTreeModel(data.children)
            }
        })
    }

}
export default {
    getRadomId,
    judgeDataType,
    generateAntdTreeModel
}