import state from "./script.js";
import Manager from "./manager.js";

function snapToGrid(value) {
    return Math.round(value / (state.gridSize * state.scale)) * (state.gridSize * state.scale);
}

export function drawGrid(canvas) {
    
    //在背景层绘制网格
    let ctx = canvas.getContext('2d');
    console.log(ctx, canvas, state);

    ctx.beginPath();
    ctx.strokeStyle = '#ddd';

    for (let x = 0; x <= canvas.width; x += state.gridSize * state.scale) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }

    for (let y = 0; y <= canvas.height; y += state.gridSize * state.scale) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }

    ctx.stroke();
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

// function drawRectangles(canvas) {
//     ctx = canvas.getContext('2d');
//     ctx.strokeStyle = '#000';
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     rectangles.forEach(rectangle => {
//         strokeRoundRect(ctx, rectangle.x * state.scale, rectangle.y * state.scale, rectangle.width * state.scale, rectangle.height * state.scale, 20 * state.scale);
//     });
// }

export class PreviewEdit {
    constructor(parameters) {
        
        this.Line = {
            listen: false,
            isDrawing: false,
            start: [0, 0],
            end: [0, 0]
        }
        this.Rect = {
            listen: false,
            isDrawing: false,
            startX: 0,
            startY: 0
        }
        this.boundPreviewLine = this.previewLine.bind(this);
        this.boundPreviewRect = this.previewRect.bind(this);
    }

    startDrawLine() {
        if (this.Line.listen) return;
        this.stopDrawRect();
        state.canvases.operate.addEventListener('mousemove', this.boundPreviewLine);
        state.canvases.operate.addEventListener('mousedown', this.boundPreviewLine);
        this.Line.listen = true;
    }

    startDrawRect() {
        if (this.Rect.listen) return;
        this.stopDrawLine();
        state.canvases.operate.addEventListener('mousedown', this.boundPreviewRect);
        state.canvases.operate.addEventListener('mousemove', this.boundPreviewRect);
        this.Rect.listen = true;
    }

    stopDrawLine() {
        if (!this.Line.listen) return;
        state.canvases.operate.removeEventListener('mousemove', this.boundPreviewLine);
        state.canvases.operate.removeEventListener('mousedown', this.boundPreviewLine);
        this.Line.listen = false;
        this.Line.isDrawing = false;
        console.log('移除DrawLine');
    }

    stopDrawRect() {
        if (!this.Rect.listen) return;
        state.canvases.operate.removeEventListener('mousedown', this.boundPreviewRect);
        state.canvases.operate.removeEventListener('mousemove', this.boundPreviewRect);
        this.Rect.listen = false;
        this.Rect.isDrawing = false;
        console.log('移除DrawRect');
    }

    previewLine(e){
        let canvas = state.canvases.operate;
        let ctx = canvas.getContext('2d');

        if (e.button === 2){ // 右键, 取消绘制
            this.Line.isDrawing = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        if (!this.Line.isDrawing && e.type === 'mousedown'){
            this.Line.start = [snapToGrid(e.offsetX), snapToGrid(e.offsetY)];
            this.Line.isDrawing = true;
            return;
        }else if(!this.Line.isDrawing && e.type === 'mousemove') return;
    
        if (this.Line.isDrawing && e.type === 'mousemove') {
            if ( Math.abs(e.offsetX - this.Line.start[0]) > Math.abs(e.offsetY - this.Line.start[1]) ) {
                this.Line.end = [snapToGrid(e.offsetX), this.Line.start[1]];
            } else {
                this.Line.end = [this.Line.start[0], snapToGrid(e.offsetY)];
            }
    
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(this.Line.start[0], this.Line.start[1]);
            ctx.lineTo(this.Line.end[0], this.Line.end[1]);
            ctx.stroke();
        }
    
        if (e.type === 'mousedown') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 循环绘制
            console.log(this.Line.start, this.Line.end);
            Manager.addLine([{x: this.Line.start[0] / state.scale, y: this.Line.start[1] / state.scale}, 
                {x: this.Line.end[0] / state.scale, y: this.Line.end[1] / state.scale}]);
                this.Line.start = this.Line.end;
        }
    }

    previewRect(e){
        let canvas = state.canvases.operate;
        let ctx = canvas.getContext('2d');

        if (e.button === 2){ // 右键, 取消绘制
            this.Rect.isDrawing = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        // 初始化函数属性
        if (this.Rect.isDrawing === undefined) {
            this.Rect.isDrawing = false;
            this.Rect.startX = 0;
            this.Rect.startY = 0;
        }
        
        //标记起始点
        if (!this.Rect.isDrawing && e.type === 'mousedown'){
            this.Rect.startX = snapToGrid(e.offsetX);
            this.Rect.startY = snapToGrid(e.offsetY);
            this.Rect.isDrawing = true;
            return;
        }else if(!this.Rect.isDrawing && e.type === 'mousemove') return;
    
        const currentX = snapToGrid(e.offsetX);
        const currentY = snapToGrid(e.offsetY);
        let left_x = Math.min(this.Rect.startX, currentX);
        let left_y = Math.min(this.Rect.startY, currentY);
        let width = Math.abs(this.Rect.startX - currentX);
        let height = Math.abs(this.Rect.startY - currentY);

        //绘制矩形
        if (this.Rect.isDrawing && e.type === 'mousemove') {
            ctx.strokeStyle = '#000';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            strokeRoundRect(ctx, left_x, left_y, width, height, 20 * state.scale, 5);
        }
    
        if (e.type === 'mousedown') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.Rect.isDrawing = false; // 结束绘制
            Manager.addNode(left_x / state.scale, left_y / state.scale, width / state.scale, height / state.scale, 
                20, 2, "#000000", "#f1f3f4");
        }
    }
}

const previewEdit = new PreviewEdit();

export {previewEdit}