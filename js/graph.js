function snapToGrid(value) {
    return Math.round(value / (gridSize * scale)) * (gridSize * scale);
}

function drawGrid(canvas) {
    //在背景层绘制网格
    ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.strokeStyle = '#ddd';

    for (let x = 0; x <= canvas.width; x += gridSize * scale) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }

    for (let y = 0; y <= canvas.height; y += gridSize * scale) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }

    ctx.stroke();
}

function previewLine(e){
    if (previewLine.isDrawing === undefined) {
        previewLine.isDrawing = false;
        previewLine.start = [0, 0];
        previewLine.end = [0, 0];
    }
    
    //标记起始点
    if (!previewLine.isDrawing && e.type === 'mousedown'){
        previewLine.start = [snapToGrid(e.offsetX), snapToGrid(e.offsetY)];
        previewLine.isDrawing = true;
        return;
    }else if(!previewLine.isDrawing && e.type === 'mousemove') return;

    canvas = canvases.operate;
    ctx = canvas.getContext('2d');

    if (previewLine.isDrawing && e.type === 'mousemove') {
        if ( Math.abs(e.offsetX - previewLine.start[0]) > Math.abs(e.offsetY - previewLine.start[1]) ) {
            previewLine.end = [snapToGrid(e.offsetX), previewLine.start[1]];
        } else {
            previewLine.end = [previewLine.start[0], snapToGrid(e.offsetY)];
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(previewLine.start[0], previewLine.start[1]);
        ctx.lineTo(previewLine.end[0], previewLine.end[1]);
        ctx.stroke();
    }

    if (e.type === 'mousedown') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        previewLine.isDrawing = false; // 结束绘制
        console.log(previewLine.start, previewLine.end);
        Manager.addLine([{x: previewLine.start[0] / scale, y: previewLine.start[1] / scale}, 
                         {x: previewLine.end[0] / scale, y: previewLine.end[1] / scale}]);
    }
}

function previewRect(e){
    // 初始化函数属性
    if (previewRect.isDrawing === undefined) {
        previewRect.isDrawing = false;
        previewRect.startX = 0;
        previewRect.startY = 0;
    }
    
    //标记起始点
    if (!previewRect.isDrawing && e.type === 'mousedown'){
        previewRect.startX = snapToGrid(e.offsetX);
        previewRect.startY = snapToGrid(e.offsetY);
        previewRect.isDrawing = true;
        return;
    }else if(!previewRect.isDrawing && e.type === 'mousemove') return;

    canvas = canvases.operate;
    ctx = canvas.getContext('2d');
    //绘制矩形
    if (previewRect.isDrawing && e.type === 'mousemove') {
        const currentX = snapToGrid(e.offsetX);
        const currentY = snapToGrid(e.offsetY);
        ctx.strokeStyle = '#000';
    
        left_x = Math.min(previewRect.startX, currentX);
        left_y = Math.min(previewRect.startY, currentY);
        width = Math.abs(previewRect.startX - currentX);
        height = Math.abs(previewRect.startY - currentY);
    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokeRoundRect(ctx, left_x, left_y, width, height, 20 * scale, 5);
    }

    if (e.type === 'mousedown') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        previewRect.isDrawing = false; // 结束绘制
        // NodeList.push(
        //     new Node("NodeList", left_x / scale, left_y / scale, width / scale, height / scale, 
        //     20, 2, "#333", "#f0f0f0", getdataid()))
        Manager.addNode(left_x / scale, left_y / scale, width / scale, height / scale, 
            20, 2, "#333", "#f0f0f0");
        strokeRoundRect(ctxs.storage, left_x, left_y, width, height, 20 * scale, 0);
    }
}

function strokeRoundRect(ctx, x, y, width, height, radius, linedash) {
    if (linedash) {
        ctx.setLineDash([linedash, linedash]);
    }else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    // 左上角
    ctx.moveTo(x + radius, y);
    // 上边
    ctx.lineTo(x + width - radius, y);
    // 右上角
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    // 右边
    ctx.lineTo(x + width, y + height - radius);
    // 右下角
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    // 下边
    ctx.lineTo(x + radius, y + height);
    // 左下角
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    // 左边
    ctx.lineTo(x, y + radius);
    // 左上角
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.stroke();
}

function drawRectangles(canvas) {
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rectangles.forEach(rectangle => {
        strokeRoundRect(ctx, rectangle.x * scale, rectangle.y * scale, rectangle.width * scale, rectangle.height * scale, 20 * scale);
    });
}