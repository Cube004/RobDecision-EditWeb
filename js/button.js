function renderTaskNode(button){
    canvases.operate.addEventListener('mousemove', previewRect);
    canvases.operate.addEventListener('mousedown', previewRect);
    console.log("添加监听成功");
    canvases.operate.style.display = "block";
}

function cursor(button){
    canvases.operate.removeEventListener('mousemove', previewLine);
    canvases.operate.removeEventListener('mousedown', previewLine);
    canvases.operate.removeEventListener('mousemove', previewRect);
    canvases.operate.removeEventListener('mousedown', previewRect);
    console.log("移除监听成功");
    canvases.operate.style.display = "none";
}

function renderNodeEdge(button){
    canvases.operate.addEventListener('mousemove', previewLine);
    canvases.operate.addEventListener('mousedown', previewLine);
    console.log("添加监听成功");
    canvases.operate.style.display = "block";
}

function Zoom(event){
    lastscale = scale;

    origin_pos = {
        x: event.offsetX / scale,
        y: event.offsetY / scale,
    }

    event.deltaY < 0 ? scale += 0.1 : scale -= 0.1;

    scale = Math.max(Math.min(scale, 2),0.5);

    Object.values(canvases).forEach(canvas => {
        canvas.width = gridSize * gridNumberX * scale;
        canvas.height = gridSize * gridNumberY * scale;
    });
    
    target ={
        x: Math.max(origin_pos.x * scale - window.innerWidth / 2,0),
        y: Math.max(origin_pos.y * scale - window.innerHeight / 2,0),
    }
    
    window.scrollTo({
        top: target.y,
        left: target.x,
    });
    
    //重新绘制网格线和图形
    drawGrid(canvases.background);

    // drawNodes(); //重新绘制节点
}


window.addEventListener('wheel', Zoom);

