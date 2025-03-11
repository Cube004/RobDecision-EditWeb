import {previewEdit} from './graph.js';
import {drawGrid} from './graph.js';
import state from './script.js';
import Manager from './manager.js';

export function renderTaskNode(button){
    previewEdit.startDrawRect();
    state.canvases.operate.style.display = "block";
}

export function cursor(button){
    previewEdit.stopDrawLine();
    previewEdit.stopDrawRect();
    state.canvases.operate.style.display = "none";
}

export function renderNodeEdge(button){
    previewEdit.startDrawLine();
    state.canvases.operate.style.display = "block";
}

export function exportData(button){
    Manager.output();
}

export function loadData(button){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const jsonData = e.target.result;
                Manager.load(jsonData);
            };
            reader.readAsText(file);
        }
    });
    input.click();
}

function Zoom(event){
    state.lastScale = state.scale;
    
    var origin_pos = {
        x: event.offsetX / state.scale,
        y: event.offsetY / state.scale,
    }

    event.deltaY < 0 ? state.scale += 0.1 : state.scale -= 0.1;

    state.scale = Math.max(Math.min(state.scale, 2),0.5);

    Object.values(state.canvases).forEach(canvas => {
        canvas.width = state.gridSize * state.gridNumberX * state.scale;
        canvas.height = state.gridSize * state.gridNumberY * state.scale;
    });
    
    var target ={
        x: Math.max(origin_pos.x * state.scale - window.innerWidth / 2,0),
        y: Math.max(origin_pos.y * state.scale - window.innerHeight / 2,0),
    }
    
    window.scrollTo({
        top: target.y,
        left: target.x,
    });
    drawGrid(state.canvases.background);
    Manager.updateScale();
}

document.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // 阻止默认行为,鼠标右键被屏蔽
    // 用于取消绘制返回选择功能
    // const cursorButton = document.getElementById("cursor")
    // if (cursorButton) {
    //     cursorButton.click();
    // }
});

export function showMap(button) {
    console.log('showMap');
    
    Manager.MapManager.showMap();
}

window.addEventListener('wheel', Zoom);
window.showMap = showMap;
window.renderTaskNode = renderTaskNode;
window.cursor = cursor;
window.renderNodeEdge = renderNodeEdge;
window.exportData = exportData;
window.loadData = loadData;