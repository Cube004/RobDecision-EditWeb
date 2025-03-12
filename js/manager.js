import state from "./script.js";
import menuManager from "./menu.js";
import {previewEdit} from './graph.js';

class ObjectManager{
    constructor(){
        this.NodeContainerId = "nodeContainer";
        this.EdgeContainerId = "edgeContainer";
        this.MapManager = new MapManager();
        this.NodeList = [];
        this.EdgeList = [];
        this.menu_node = null;
        this.menu_edge = null;
        this.menu = document.getElementById('nodeMenu')
    }

    updateScale(){
        this.NodeList.forEach(Node => {
            Node.UpdateView();
        })
        this.EdgeList.forEach(Edge => {
            Edge.UpdateView();
        })
        if (this.menu.style.display === 'flex') {
            this.menu.style.left = `${(parseInt(this.menu.style.left) + this.menu.offsetWidth / 2) / state.lastScale * state.scale - this.menu.offsetWidth / 2}px`
            this.menu.style.top = `${parseInt(this.menu.style.top) / state.lastScale * state.scale}px`
        }

    }

    addNode(x, y, width, height, borderRadius, borderWidth, borderColor, fillColor, fillOpacity = 100){
        let node_id =  "Node_" + this.NodeList.length;
        this.NodeList.push(new Node(this.NodeContainerId, 
            node_id,
            {x: x, y: y},
            {width: width, height: height, borderRadius: borderRadius, borderWidth: borderWidth},
            {borderColor: borderColor, fillColor: fillColor, fillOpacity: fillOpacity},
        ));
        this.EdgeList.forEach(Edge => {
            this.CheckConnection(Edge);
        })
    }

    addLine(points){
        let canMerge = false;
        let edge = null;
        this.EdgeList.forEach(Edge => {
            canMerge = Edge.CheckCanMerge(points)
            if (canMerge) edge = Edge;
        })
        if (!canMerge) {
            let polyline = new Line(points, `temp_${Math.random()}`, null);
            edge = new Edge(this.EdgeContainerId ,`Edge_${this.EdgeList.length}`)
            edge.AddNewLine(polyline)
            this.EdgeList.push(edge);
        }
        this.CheckConnection(edge)
    }

    deleteNode(id) {
        const button = document.querySelector(`button[data-id="${id}"]`);
        if (button) {
            button.remove();
        }
        this.NodeList = this.NodeList.filter(node => node.id !== id);
        this.NodeList.forEach((node, index) => {
            const oldId = node.id;
            const newId = `Node_${index}`;
            node.id = newId;
            if (node.element) {
                node.element.id = newId;
            }
            const oldButton = document.querySelector(`button[data-id="${oldId}"]`);
            if (oldButton) {
                oldButton.setAttribute('data-id', newId);
            }
        });
    }

    deleteEdge(Edge) {
        const id = Edge.id;
        const Edge_div = document.querySelector(`div[data-id="${id}"]`);
        if (Edge_div) {
            Edge_div.remove();
        }
        this.EdgeList = this.EdgeList.filter(edge => edge.id !== id);
        this.EdgeList.forEach((edge, index) => {
            const oldId = edge.id;
            const newId = `Edge_${index}`;
            edge.updateID(newId);
        })
    }

    deletePoint(point){
        this.MapManager.deletePoint(point);
    }

    output(){
        let NodeData = [];
        this.NodeList.forEach(node => {
            NodeData.push({
                containerId: node.containerId, 
                id: node.id,
                position: node.position,
                shape: node.shape,
                color: node.color,
                text: node.text,
                taskConfig: node.taskConfig
            })
        })
        let EdgeData = [];
        this.EdgeList.forEach(edge => {
            EdgeData.push({
                id: edge.id,
                node: {
                    nodeIn: edge.node.nodeIn ? edge.node.nodeIn.id : null,
                    nodeOut: edge.node.nodeOut ? edge.node.nodeOut.id : null
                },
                lineStyle: edge.LineStyle,
                text: edge.text,
                condition: edge.condition,
                endpoints: edge.Endpoints,
                pointLists: edge.lineList.map(line => line.points)
            })
        })
        let pointData = [];
        this.MapManager.pointList.forEach(point => {
            pointData.push({
                position: point.position,
                id: point.id,
                realPosition: point.realPosition,
                color: point.color,
                text: point.text
            })
        })
        const outputData = {
            Date: new Date().toISOString(),
            Version: 1.0,
            Nodes: NodeData,
            Edges: EdgeData,
            Points: pointData
        }
        const jsonData = JSON.stringify(outputData);
        const blob = new Blob([jsonData], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.json';
        a.click();
    }

    load(jsonData) {
        try {
            // 解析JSON数据
            const data = JSON.parse(jsonData);
            
            // 检查版本兼容性
            if (data.Version > 1.0) {
                throw new Error('不支持的文件版本');
            }
            
            // 清除现有的所有节点和边
            this.NodeList.forEach(node => {
                this.deleteNode(node.id);
            });
            this.EdgeList.forEach(edge => {
                this.deleteEdge(edge);
            });

            // 加载节点
            data.Nodes.forEach(nodeData => {
                let newNode = new Node(this.NodeContainerId, nodeData.id, nodeData.position, nodeData.shape, nodeData.color, nodeData.text, nodeData.taskConfig);
                this.NodeList.push(newNode);
            });
            
            // 加载边
            data.Edges.forEach(edgeData => {
                let newEdge = new Edge(this.EdgeContainerId, edgeData.id);
                newEdge.reconstruct(this.EdgeContainerId, edgeData.id, edgeData.node, edgeData.lineStyle, edgeData.text, edgeData.condition, edgeData.endpoints, edgeData.pointLists);
                this.EdgeList.push(newEdge);
                this.CheckConnection(newEdge);
            });
            
            // 加载航点
            data.Points.forEach(pointData => {
                this.MapManager.reloadPoint(pointData.position, pointData.id, pointData.realPosition, pointData.color, pointData.text);
            });
            return true;
        } catch (error) {
            console.error('加载文件失败:', error);
            return false;
        }
    }

    CheckConnection(Edge){
        const isPointInRect =(node, point) =>{
            let rectX = node.position.x - state.gridSize;
            let rectY = node.position.y - state.gridSize;
            let rectWidth = node.shape.width + 2 * state.gridSize;
            let rectHeight = node.shape.height + 2 * state.gridSize;
            let x = point.x;
            let y = point.y;
            const xRight = rectX + rectWidth;
            const yBottom = rectY + rectHeight;
            return x >= rectX && x <= xRight && y >= rectY && y <= yBottom;
        }
        this.NodeList.forEach(node => {
            if (isPointInRect(node, Edge.Endpoints.In)) Edge.node.nodeIn = node;
            if (isPointInRect(node, Edge.Endpoints.Out)) Edge.node.nodeOut = node;
        })
        if (Edge.node.nodeIn && Edge.node.nodeOut) {
            previewEdit.Line.isDrawing = false; // 重置绘制状态
        }
        Edge.UpdateView();
    }

    BindMenu(Object){
        if (Object instanceof Node){
            this.menu_node = Object;
            menuManager.BindNode(this.menu_node);
        }else if (Object instanceof Edge){
            this.menu_edge = Object;
            menuManager.BindEdge(this.menu_edge)
        }
    }
}

class Node{
    constructor(containerId, id, position, shape, color, text = null, taskConfig = null){
        this.containerId = containerId;
        this.id = id;

        this.position = {
            x: position.x,
            y: position.y
        }

        this.shape = {
            width: shape.width,
            height: shape.height,
            borderWidth: shape.borderWidth,
            borderRadius: shape.borderRadius
        }
        
        this.color = {
            borderColor: color.borderColor,
            fillColor: color.fillColor,
            fillOpacity: color.fillOpacity
        }

        if (text != null){
            this.text = text;
        }else{
            this.text = {
                size: 12,
                color: "#000000",
                content: `Node ${this.id}`,
                fontFamily : 'Arial, sans-serif'
            }
        }
        if (taskConfig != null){
            this.taskConfig = taskConfig;
        }else{
            this.taskConfig = {
                nodeType: 'task',
                mode: 'stay',
                waypoint: null
            }
        }
        this.create();
        this.manager = Manager;
        this.menu = document.getElementById('nodeMenu')
        
    }
    
    create(){
        const container = document.getElementById(this.containerId)
        const button = document.createElement('button')
        button.className = 'node'
        button.setAttribute('data-id', this.id)
        button.textContent = this.text.content
        button.addEventListener("mouseenter", () => {
            button.style.border = `${this.shape.borderWidth * state.scale * 2}px solid ${this.color.borderColor}`
        });
        button.addEventListener("mouseleave", () => {
            button.style.border = `${this.shape.borderWidth * state.scale}px solid ${this.color.borderColor}`
        });
        button.addEventListener("click", () => {
            this.menu.style.display = this.menu.style.display != 'flex' ? 'flex' : 'none'
            if (this.manager.menu_node != this && this.menu.style.display === 'none') this.menu.style.display = 'flex'
            if (this.menu.style.display === 'flex') {
                setTimeout(() => {
                    this.menu.classList.add('active');
                }, 10);
            }else{
                this.menu.classList.remove('active');
                // 等待过渡结束后隐藏菜单
                setTimeout(() => {
                    this.menu.style.display = 'none';
                }, 250); // 与过渡时间相匹配
            }
            this.manager.BindMenu(this);
            this.menu.style.position = 'absolute'
            this.menu.style.left = `${this.position.x * state.scale + this.shape.width * state.scale / 2 - this.menu.offsetWidth / 2}px`
            this.menu.style.top = `${this.position.y * state.scale + this.shape.height * state.scale + state.gridSize * state.scale}px`
        })
        container.appendChild(button)
        this.UpdateView()
    }

    UpdateView(){        
        const button = document.querySelector(`button[data-id="${this.id}"]`)
        button.style.width = `${this.shape.width * state.scale}px`
        button.style.height = `${this.shape.height * state.scale}px`

        button.style.position = 'absolute'
        button.style.left = `${this.position.x * state.scale}px`
        button.style.top = `${this.position.y * state.scale}px`

        button.style.borderRadius = `${this.shape.borderRadius * state.scale}px`
        button.style.border = `${this.shape.borderWidth * state.scale}px solid ${this.color.borderColor}`
        button.style.backgroundColor = this.color.fillColor
        button.style.opacity = `${this.color.fillOpacity / 100}`

        button.textContent = this.text.content
        button.style.fontSize = `${this.text.size * state.scale}px`
        button.style.color = this.text.color
        button.style.fontFamily = this.text.fontFamily
    }

    changeStyle(shape, color, text, taskConfig){
        this.shape = {
            width: shape.width == null ? this.shape.width : shape.width,
            height: shape.height == null ? this.shape.height : shape.height,
            borderWidth: shape.borderWidth == null ? this.shape.borderWidth : shape.borderWidth,
            borderRadius: shape.borderRadius == null ? this.shape.borderRadius : shape.borderRadius
        };
        this.color = {
            borderColor: color.borderColor == null ? this.color.borderColor : color.borderColor,
            fillColor: color.fillColor == null ? this.color.fillColor : color.fillColor,
            fillOpacity: color.fillOpacity == null ? this.color.fillOpacity : color.fillOpacity
        };
        this.text = {
            size: text.size == null ? this.text.size : text.size,
            color: text.color == null ? this.text.color : text.color,
            content: text.content == null ? this.text.content : text.content,
            fontFamily: text.fontFamily == null ? this.text.fontFamily : text.fontFamily
        };
        this.taskConfig = taskConfig;
        this.UpdateView()
    }

}


class Line {
    constructor(points = [], id, round = false, FatherEdge = null) {
        this.id = id;
        this.FatherEdge = FatherEdge;
        this.round = round;
        this.padding = 10;
        this.points = points;  // 路径点数组，格式：[{x,y}, {x,y}, ...]
        this.linewidth = 2.5;
        this.dashWidth = 3;
        this.dasharray = `${this.dashWidth * state.scale * 2},${this.dashWidth * state.scale * 2}`;
        this.color = '#333';
        this.element = round ? this.createRoundedPath() : this.createPolyline();
        this.elementBorder = round ? this.createRoundedPath() : this.createPolyline();
        if (this.FatherEdge) this.Addlistener();
    }

    BindEdge(FatherEdge) {
        this.FatherEdge = FatherEdge;
        this.Addlistener();
    }

    changePoints(newPoints) {
        this.points = newPoints;
        this.Redraw();
    }

    Redraw() {
        if (this.element) {
            this.element.remove();
        }
        this.element = this.round ? this.createRoundedPath() : this.createPolyline();
        this.elementBorder = this.round ? this.createRoundedPath() : this.createPolyline();
        this.elementBorder.setAttribute('stroke-width', "20");
        this.Addlistener();
        this.FatherEdge.svg.appendChild(this.element);
        this.FatherEdge.svg.appendChild(this.elementBorder);

    }

    createRoundedPath() {
        let A = {
            x: this.points[0].x * state.scale,
            y: this.points[0].y * state.scale
        }
        let B = {
            x: this.points[1].x * state.scale,
            y: this.points[1].y * state.scale
        }
        let C = {
            x: this.points[2].x * state.scale,
            y: this.points[2].y * state.scale
        }
        let r = Math.abs(A.x - C.x);
        
        const vecAB = { x: B.x - A.x, y: B.y - A.y };
        const vecBC = { x: C.x - B.x, y: C.y - B.y };
        
        const lenAB = Math.sqrt(vecAB.x ** 2 + vecAB.y ** 2);
        const lenBC = Math.sqrt(vecBC.x ** 2 + vecBC.y ** 2);
        const dirAB = { x: vecAB.x / lenAB, y: vecAB.y / lenAB };
        const dirBC = { x: vecBC.x / lenBC, y: vecBC.y / lenBC };
    
        const startArc = {
            x: B.x - dirAB.x * r,
            y: B.y - dirAB.y * r
        };
        const endArc = {
            x: B.x + dirBC.x * r,
            y: B.y + dirBC.y * r
        };
    
        const crossProduct = dirAB.x * dirBC.y - dirAB.y * dirBC.x;
        const sweepFlag = crossProduct > 0 ? 1 : 0;
    
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `
            M ${A.x} ${A.y}
            L ${startArc.x} ${startArc.y}
            A ${r} ${r} 0 0 ${sweepFlag} ${endArc.x} ${endArc.y}
            L ${C.x} ${C.y}
        `.trim().replace(/\s+/g, ' ');
        
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", this.color);
        path.setAttribute("stroke-width", this.linewidth);
        path.setAttribute("stroke-dasharray", this.dasharray);
        path.setAttribute('data-id', this.id)
        return path;
    }

    createPolyline() {
        let polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        const pointsStr = this.points
            .map(p => `${p.x * state.scale},${p.y * state.scale}`)
            .join(" ");
        polyline.setAttribute("points", pointsStr);
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke-width", this.linewidth);
        polyline.setAttribute("stroke", this.color);
        polyline.setAttribute("stroke-dasharray", this.dasharray);
        polyline.setAttribute('data-id', this.id)
        return polyline;
    }

    Addlistener(){
        this.elementBorder.addEventListener('mouseover', () => {
            this.FatherEdge.lineList.forEach(line => {
                line.element.style.filter = 'drop-shadow(0px 0px 3px rgba(0,0,0,0.5))';
                line.element.setAttribute('stroke-width', this.linewidth + 2);
            })
        });
        this.elementBorder.addEventListener('mouseout', () => {
            this.FatherEdge.lineList.forEach(line => {
                line.element.style.filter = '';
                line.element.setAttribute('stroke-width', this.linewidth);
            })
        })
        this.elementBorder.addEventListener('click', () => {
            this.FatherEdge.OpenMenu();
        })
    }
}

class Edge{
    constructor(containerId, id){
        this.id = id
        this.container = document.getElementById(containerId)
        
        this.node = {
            nodeIn: null,
            nodeOut: null,
        }

        this.LineStyle = {
            width: 2,
            color: '#4285f4',
            dashWidth: 3,
            roundSize: state.gridSize,
            dash: true,
        }

        this.text = {
            color: '#4285f4',
            size: 12,
            fontFamily: 'Arial, sans-serif',
            content: '',
        }

        this.condition = {
            nodeId: {
                nodeIn: null,
                nodeOut: null,
            },
            weight: null,
            condition: [{
                type: null,
                min: null,
                max: null
            }]
        };

        this.lineList = [];
        
        this.Endpoints = {
            In: { x: 0, y: 0 },
            Out: { x: 0, y: 0 }
        }
        this.init()
    }

    reconstruct(containerId, id, node, lineStyle, text, condition, endpoints, pointLists){
        this.id = id
        this.container = document.getElementById(containerId)
        this.node = node
        this.LineStyle = lineStyle
        this.text = text
        this.condition = condition
        pointLists.forEach(points =>{
            let round = points.length == 2 ? false : true;
            this.AddNewLine(new Line(points, `temp_{${Math.random()}}`, round, this))
        })
        this.Endpoints = endpoints
        this.init()
    }

    init(){
        this.div = document.createElement('div');
        this.div.setAttribute('data-id', this.id);

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("data-id", this.id);
        
        this.container.appendChild(this.div);
        this.div.appendChild(this.svg);

        this.menu = document.getElementById('edgeMenu');
    }

    Arrow(x, y, padding){
        let Min = { x: x, y: y };
        
        let EndLine = null;
        let OtherPoint = null;
        this.lineList.forEach(line => {
            line.points.forEach(point => {
                if(point.x == this.Endpoints.Out.x && point.y == this.Endpoints.Out.y){
                    EndLine = line;
                    return;
                }
            })
        })
        if(EndLine === null){
            return;
        }
        if(EndLine.points[0].x == this.Endpoints.Out.x && EndLine.points[0].y == this.Endpoints.Out.y){
            OtherPoint = EndLine.points[1];
        }else{
            OtherPoint = EndLine.points[0];
        }

        if(OtherPoint === null){
            return;
        }
        
        let angle = Math.atan2(OtherPoint.y - this.Endpoints.Out.y, OtherPoint.x - this.Endpoints.Out.x) * 180 / Math.PI;
        if(this.arrow){
            this.arrow.remove();
        }
        this.arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.arrow.setAttribute("d", "m3.414 7.086-.707.707a1 1 0 0 0 0 1.414l7.778 7.778a2 2 0 0 0 2.829 0l7.778-7.778a1 1 0 0 0 0-1.414l-.707-.707a1 1 0 0 0-1.415 0l-7.07 7.07-7.072-7.07a1 1 0 0 0-1.414 0Z");
        this.arrow.setAttribute("fill", this.LineStyle.color);
        this.arrow.setAttribute("data-id", `${this.id}_Arrow`);
        this.arrow.setAttribute("transform", 
                                `translate(${(-Min.x + padding + this.Endpoints.Out.x - 24 / 2) * state.scale},${(-Min.y + padding + this.Endpoints.Out.y - 24 / 2) * state.scale}),
                                rotate(${angle + 90} ${12 * state.scale} ${12 * state.scale}),
                                scale(${state.scale})`);
        this.svg.appendChild(this.arrow);
    }

    EndpointsShow(x, y, padding){
        let Min = { x: x, y: y };
        if(this.nodeInCircle){
            this.nodeInCircle.remove();
        }
        if(this.node.nodeIn === null){
            this.nodeInCircle = this.createCircularPath(this.Endpoints.In.x, this.Endpoints.In.y, 5);
            this.nodeInCircle.setAttribute('data-id', `${this.id}_In`);
            this.nodeInCircle.setAttribute("transform", `translate(${(-Min.x + padding) * state.scale},${(-Min.y + padding) * state.scale})`);
            this.nodeInCircle.setAttribute("fill", "red");
            this.svg.appendChild(this.nodeInCircle);
        }
        if(this.nodeToCircle){
            this.nodeToCircle.remove();
        }
        if(this.node.nodeOut === null){
            this.nodeToCircle = this.createCircularPath(this.Endpoints.Out.x, this.Endpoints.Out.y, 5);
            this.nodeToCircle.setAttribute('data-id', `${this.id}_Out`);
            this.nodeToCircle.setAttribute("transform", `translate(${(-Min.x + padding) * state.scale},${(-Min.y + padding) * state.scale})`);
            this.nodeToCircle.setAttribute("fill", "green");
            this.svg.appendChild(this.nodeToCircle);
        }
    }

    createCircularPath(cx, cy, radius) {
        cx = cx * state.scale;
        cy = cy * state.scale;
        radius = radius * state.scale;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `M ${cx-radius},${cy} a ${radius},${radius} 0 1,0 ${radius*2},0 a ${radius},${radius} 0 1,0 ${-radius*2},0`;
        path.setAttribute("d", d);
        return path;
    }
 
    UpdateView(){
        
        this.lineList.forEach(line => {
            line.Redraw();
            if(line.round){
                this.svg.appendChild(line.element);
            }
            if (this.node.nodeIn != null && this.node.nodeOut != null) {
                line.element.dasharray = "none"
                line.element.setAttribute("stroke-dasharray", "none");
                
            }else{
                line.element.dasharray = `${this.LineStyle.dashWidth * state.scale},${this.LineStyle.dashWidth * state.scale}`;
                line.element.setAttribute("stroke-dasharray", `${this.LineStyle.dashWidth * state.scale},${this.LineStyle.dashWidth * state.scale}`);
            }
            line.linewidth = this.LineStyle.width;
            line.element.setAttribute('stroke', this.LineStyle.color);
            line.element.setAttribute('stroke-width', this.LineStyle.width);
        })
        
        if (this.menu.style.display === 'flex' && this.menu.selectedEdge === this) {
            let target = this.getCenter();
            this.menu.style.left = `${target.x * state.scale - this.menu.offsetWidth / 2}px`;
            this.menu.style.top = `${target.y * state.scale + state.gridSize * state.scale}px`;
        }

        let Min = { x: Infinity, y: Infinity };
        let Max = { x: -Infinity, y: -Infinity };

        this.lineList.forEach(line => {
            const points = line.points;
            points.forEach(point => {
                if (point.x < Min.x) Min.x = point.x;
                if (point.y < Min.y) Min.y = point.y;
                if (point.x > Max.x) Max.x = point.x;
                if (point.y > Max.y) Max.y = point.y;
            });
        });
    
        const padding = this.LineStyle.width + 8 * state.scale;
    
        const adjustedMin = {
            x: Min.x - padding,
            y: Min.y - padding
        };
        const adjustedMax = {
            x: Max.x + padding,
            y: Max.y + padding
        };
    
        this.svg.style.position = 'absolute';
        this.svg.style.left = `${adjustedMin.x * state.scale}px`;
        this.svg.style.top = `${adjustedMin.y * state.scale}px`;
        this.svg.style.width = `${(adjustedMax.x - adjustedMin.x) * state.scale}px`;
        this.svg.style.height = `${(adjustedMax.y - adjustedMin.y) * state.scale}px`;
    
        this.lineList.forEach(line => {
            line.element.setAttribute("transform", `translate(${(-Min.x + padding) * state.scale},${(-Min.y + padding) * state.scale})`);
            line.elementBorder.setAttribute("transform", `translate(${(-Min.x + padding) * state.scale},${(-Min.y + padding) * state.scale})`);
            line.elementBorder.setAttribute("fill", "none");
            line.elementBorder.setAttribute("stroke-dasharray", "none");
            line.elementBorder.setAttribute("stroke", "transparent");
        });

        this.EndpointsShow(Min.x, Min.y, padding);
        this.Arrow(Min.x, Min.y, padding);
        this.UpdateText();
    }

    updateID(id){
        this.id = id;
        this.svg.setAttribute('data-id', this.id);
        this.div.setAttribute('data-id', this.id);
        this.lineList.forEach((line, index) => {
            line.element.setAttribute('data-id', `${this.id}_${index}`);
            line.elementBorder.setAttribute('data-id', `${this.id}_${index}`);
        })
        if(this.arrow){
            this.arrow.setAttribute('data-id', `${this.id}_Arrow`);
        }
        if(this.textElement){
            this.textElement.setAttribute('data-id', `${this.id}_Text`);
        }
        if(this.nodeInCircle){
            this.nodeInCircle.setAttribute('data-id', `${this.id}_In`);
        }
        if(this.nodeToCircle){
            this.nodeToCircle.setAttribute('data-id', `${this.id}_Out`);
        }
        this.UpdateView();
    }

    CheckCanMerge(points){
        const Equal = (value1, value2, tolerance = 0.1) =>{
            return Math.abs(value1 - value2) < tolerance;
        }
        const EqualPoint = (point1, point2) => {
            return Equal(point1.x, point2.x, state.gridSize / 10 * state.scale) && 
                   Equal(point1.y, point2.y, state.gridSize / 10 * state.scale) ?
                   point1 : null;
        };
        const findJunction = (line1, line2) => {
            const candidates = [
                {a: line1[0], b: line2[0]},
                {a: line1[0], b: line2.at(-1)},
                {a: line1.at(-1), b: line2[0]},
                {a: line1.at(-1), b: line2.at(-1)}
            ]
            return candidates.find(pair => EqualPoint(pair.a, pair.b))?.a || null
        }
        const areLinesPerpendicularOrParallel = (points1, points2) => {
            const [p1, p2] = points1;
            const [p3, p4] = points2;
            const dx1 = p2.x - p1.x;
            const dy1 = p2.y - p1.y;
            const dx2 = p4.x - p3.x;
            const dy2 = p4.y - p3.y;
            if (dx1 * dy2 === dx2 * dy1) return false;
            if (dx1 * dx2 + dy1 * dy2 === 0) return true;
        }

        let canMerge = false;
        let round = false;
        this.lineList.forEach(line => {
            const points1 = line.points;
            const points2 = points;

            const junction = findJunction(line.points, points);

            if(junction != null){
                canMerge = true;

                if(EqualPoint(this.Endpoints.Out, junction) === null){
                    this.Endpoints.In = EqualPoint(points[0], junction) === null ? points[0] : points[1];
                }else{
                    this.Endpoints.Out = EqualPoint(points[0], junction) === null ? points[0] : points[1];
                }
                console.log(this.Endpoints);
                
                round = areLinesPerpendicularOrParallel(points1, points2);
                if(round){
                    // 计算交点处的圆角
                    let roundPoints = this.GetRoundPoints(points1, points2, junction);
                    
                    // 裁剪掉原直线的长度
                    const getEndpoint = (points) => 
                        Equal(points[0].x, junction.x, state.gridSize / 10 * state.scale) && 
                        Equal(points[0].y, junction.y, state.gridSize / 10 * state.scale)
                            ? points[1]
                            : points[0];
                    line.changePoints(
                        [getEndpoint(points1),roundPoints[0]]
                    );
                    
                    // 添加圆角
                    this.AddNewLine(new Line(roundPoints, `temp_{${Math.random()}}`, round,this));
                    // 添加新直线
                    this.AddNewLine(new Line([roundPoints[2], getEndpoint(points2)], `temp_{${Math.random()}}`,false, this));
                }else{
                    this.AddNewLine(new Line(points2, `temp_{${Math.random()}}`, false, this));
                }
                return;
            }
        })
        return canMerge;
    }

    AddNewLine(line){
        this.lineList.push(line);
        this.svg.appendChild(line.element);
        
        let newId = `Edge_${this.id}_${this.lineList.length}`
        line.element.setAttribute('data-id', newId);
        line.id = newId;
        
        if(line.FatherEdge == null) line.BindEdge(this);
        
        if(this.lineList.length == 1) {
            this.Endpoints = {
                In: line.points[0],
                Out: line.points[1]
            }
        }
        this.UpdateView();
    }

    GetRoundPoints(points1, points2, junction) {
        const Equal = (value1, value2, tolerance = 0.1) =>{
            return Math.abs(value1 - value2) < tolerance;
        }
        // 获取非交点的端点
        const getEndpoint = (points) => 
            Equal(points[0].x, junction.x, state.gridSize / 10 * state.scale) && 
            Equal(points[0].y, junction.y, state.gridSize / 10 * state.scale)
                ? points[1]
                : points[0];
    
        // 安全方向计算
        const directionVector = (from, to) => ({
            x: Equal(from.x, to.x, state.gridSize / 10 * state.scale) ? 0 : (to.x - from.x) / Math.abs(to.x - from.x),
            y: Equal(from.y, to.y, state.gridSize / 10 * state.scale) ? 0 : (to.y - from.y) / Math.abs(to.y - from.y)
        });
    
        // 计算偏移点
        const offsetPoint = (endpoint) => ({
            x: junction.x + directionVector(junction, endpoint).x * this.LineStyle.roundSize,
            y: junction.y + directionVector(junction, endpoint).y * this.LineStyle.roundSize
        });
    
        return [
            offsetPoint(getEndpoint(points1)), // 圆角起点
            junction,                          // 原始交点
            offsetPoint(getEndpoint(points2)) // 圆角终点
        ];
    }

    UpdateText(){
        if(!this.text.content){
            return;
        }
        
        if(this.textElement){
            this.textElement.remove();
        }
        this.textElement = document.createElement('div');
        this.textElement.setAttribute('data-id', `${this.id}_Text`);
        this.textElement.style.position = 'absolute';
        this.textElement.style.color = this.text.color;
        this.textElement.style.fontSize = `${this.text.size * state.scale}px`;
        this.textElement.textContent = this.text.content;
        this.textElement.style.pointerEvents = 'none'; // 防止文本干扰鼠标事件

        this.textElement.style.backgroundColor = 'white'; // 设置背景颜色为网页背景
        this.textElement.style.padding = '3px 6px'; // 添加内边距使文本与背景有一定间距
        this.textElement.style.borderRadius = '4px'; // 添加圆角
        // this.textElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; // 添加轻微阴影增强可见性
        // this.textElement.style.zIndex = '100'; // 确保文本在最上层

        const svgParent = this.svg.parentElement;
        svgParent.appendChild(this.textElement);

        setTimeout(() => {
            const centerX = this.getCenter().x * state.scale;
            const centerY = this.getCenter().y * state.scale;
            this.textElement.style.left = `${centerX - this.textElement.offsetWidth / 2}px`;
            this.textElement.style.top = `${centerY - this.textElement.offsetHeight / 2}px`;
        }, 0);
    }

    BindMenu(menu){
        menuManager.BindEdge(this);
    }

    OpenMenu(){
        this.BindMenu(this.menu);
        this.menu.style.display = this.menu.style.display === 'none' ? 'flex' : 'none';
        let target = this.getCenter();
        this.menu.style.position = 'absolute'
        this.menu.style.left = `${target.x * state.scale - this.menu.offsetWidth / 2}px`;
        this.menu.style.top = `${target.y * state.scale + state.gridSize * state.scale}px`;
    }

    reverseDirection(){ 
        let tempPoints = this.Endpoints.In;
        this.Endpoints.In = this.Endpoints.Out;
        this.Endpoints.Out = tempPoints;

        let tempNodeIn = this.node.nodeIn == null ? null : this.node.nodeIn;
        this.node.nodeIn = this.node.nodeOut == null ? null : this.node.nodeOut;
        this.node.nodeOut = tempNodeIn;
        this.UpdateView();
    }

    getCenter(){
        // 获取中间点
        let center = {
            x: (this.Endpoints.In.x + this.Endpoints.Out.x) / 2,
            y: (this.Endpoints.In.y + this.Endpoints.Out.y) / 2
        }
        let target = {
            x: 0,
            y: 0
        }
        this.lineList.forEach(line => {
            if(!line.round){ // 非圆角直线
                let line_center = {
                    x: (line.points[0].x + line.points[1].x) / 2,
                    y: (line.points[0].y + line.points[1].y) / 2
                }
                let dis1 = Math.sqrt(Math.pow(line_center.x - center.x, 2) + Math.pow(line_center.y - center.y, 2));
                let dis2 = Math.sqrt(Math.pow(target.x - center.x, 2) + Math.pow(target.y - center.y, 2));
                if(dis1 < dis2){
                    target = line_center;
                }
            }
        })
        return target;
    }
}

class Point{
    constructor(position, id, realPosition){
        if(position == null || position == undefined) return; // 如果位置为空，则不创建航点,等待重建
        this.id = id;
        this.position = position;
        this.realPosition = realPosition;
        this.color = '#1296db';
        this.text ={
            content: `${this.id}`,
            color: '#333',
            size: 12
        }
        this.init();
    }

    reconstruct(position, id, realPosition, color, text){
        this.position = position;
        this.id = id;
        this.realPosition = realPosition;
        this.color = color;
        this.text = text;
        this.init();
        this.UpdateView();
    }
    
    init(){
        this.mapImageDiv = document.querySelector('.map-image-div');
        this.mapImage = this.mapImageDiv.querySelector('.map-image');
        this.pointMenu = document.getElementById('pointMenu');

        this.element = document.createElement('div');
        this.element.className = 'point';
        this.element.setAttribute('data-id', `Point_${this.id}`);
        this.element.style.position = 'absolute';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
    
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute('width', 24);
        this.svg.setAttribute('height', 24);
        this.svg.setAttribute('viewBox', "0 0 1024 1024");
        this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.path.setAttribute('d',"M528 32C325.056 32 160 196.8 160 399.36c0 75.2 22.656 147.584 65.024 208.48 2.112 3.648 4.256 7.168 6.784 10.592l268.608 353.472c7.296 8.096 17.088 12.576 27.584 12.576 10.368 0 20.224-4.512 28.768-14.08l267.36-352c2.624-3.52 4.896-7.36 6.112-9.6A364.864 364.864 0 0 0 896 399.36C896 196.8 730.912 32 528 32z m0 498.72a131.52 131.52 0 0 1-131.456-131.232 131.488 131.488 0 0 1 262.88 0 131.52 131.52 0 0 1-131.424 131.2z")
        this.path.setAttribute('fill', this.color);
        this.svg.appendChild(this.path);

        this.IDtext = document.createElement('div');
        this.IDtext.textContent = `${this.id}`;
        this.IDtext.style.textAlign = 'center';
        this.IDtext.style.fontFamily = 'Arial, sans-serif';
        this.IDtext.style.fontSize = '12px';
        this.IDtext.style.fontWeight = 'bold';
        this.IDtext.style.color = '#333';
        this.IDtext.style.marginTop = '2px';

        this.PositionText = document.createElement('div');
        this.PositionText.textContent = `(${this.realPosition.x.toFixed(1)},${this.realPosition.y.toFixed(1)})`;
        this.PositionText.style.textAlign = 'center';
        this.PositionText.style.fontFamily = 'Arial, sans-serif';
        this.PositionText.style.fontSize = '12px';
        this.PositionText.style.fontWeight = 'bold';
        this.PositionText.style.color = '#333';

        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width && height) {
                    this.updatePosition();
                }
            }
        });

        this.resizeObserver.observe(this.mapImage);
        this.element.addEventListener('click', () => {
            this.OpenMenu();
        });

        this.element.appendChild(this.svg);
        this.element.appendChild(this.IDtext);
        this.element.appendChild(this.PositionText);
        this.mapImageDiv.appendChild(this.element);
        this.updatePosition();
    }

    updatePosition(){
        // 获取图片的实际显示尺寸
        const displayWidth = this.mapImage.width;
        const displayHeight = this.mapImage.height;
        
        // 获取图片的原始尺寸
        const naturalWidth = this.mapImage.naturalWidth;
        const naturalHeight = this.mapImage.naturalHeight;
        
        // 计算缩放比例
        const scaleX = naturalWidth / displayWidth;
        const scaleY = naturalHeight / displayHeight;
        
        let x = this.position.x / scaleX;
        let y = this.position.y / scaleY;
        console.log('实际位置', this.position, '在地图上的位置', x, y, '缩放比例', scaleX, scaleY);


        this.element.style.left = `${x - this.element.offsetWidth / 2}px`;
        this.element.style.top = `${y - this.element.offsetHeight / 2}px`;

        if (menuManager.menuPoint.selectedPoint == this) {
            this.moveMenu();
        }

    }
    UpdateView(){
        this.path.setAttribute('fill', this.color);
        // 更新文本属性
        this.IDtext.style.color = this.text.color;
        this.PositionText.style.color = this.text.color;
        this.IDtext.textContent = this.text.content;
        this.IDtext.style.fontSize = `${this.text.size}px`;
        // 避免文字太长导致坐标偏移，所以需要重新计算
        this.updatePosition();
        this.moveMenu();
    }
    OpenMenu(){
        menuManager.BindPoint(this);
        this.pointMenu.style.display = this.pointMenu.style.display === 'flex' ? 'none' : 'flex';
        this.moveMenu();
    }
    moveMenu(){
        const rect = this.element.getBoundingClientRect();
        let width = rect.width;
        let height = rect.height;

        this.pointMenu.style.position = 'absolute';
        this.pointMenu.style.left = `${this.element.offsetLeft - this.pointMenu.offsetWidth / 2 + width / 2}px`;
        this.pointMenu.style.top = `${this.element.offsetTop + this.element.offsetHeight + 10}px`;
    }
    // 删除航点
    Delete(){
        this.element.remove();
    }
}

class MapManager{
    constructor(){
        this.init();
        this.pointList = [];
        
        // 用于实际距离校准
        this.mapConfig = {
            LeftTop: {
                x: 266.717405691595,
                y: 115.88395285584768
            },
            RightBottom: {
                x: 1998.2859033752484,
                y: 1269.1387126019945
            },
            Distance: {
                x: 12,
                y: 8
            },
            BasePoint: {
                x: 371.4493712772998,
                y: 259.6917497733454
            }
        }
    }
    init(){
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'map-overlay';
        this.overlay.style.display = 'none';
        // 创建地图容器
        this.mapContainer = document.createElement('div');
        this.mapContainer.className = 'map-container';

        
        // 创建地图图片
        this.mapImageDiv = document.createElement('div');
        this.mapImageDiv.className = 'map-image-div';
        this.mapImageDiv.style.position = 'relative';
        this.mapImage = document.createElement('img');
        this.mapImage.className = 'map-image';
        this.mapImage.src = 'map/RUML.png';
        this.mapImage.alt = '航点地图';
        this.mapImageDiv.addEventListener('mousedown', this.clickMap.bind(this));
        this.mapImageDiv.appendChild(this.mapImage);


        // 创建提示
        this.tip = document.createElement('div');
        this.tip.className = 'map-tip';
        this.tip.innerHTML = `
            <p>点击地图左键选择航点或右键创建航点</p>
        `;

        // 创建关闭按钮
        this.closeButton = document.createElement('button');
        this.closeButton.className = 'close-button';
        this.closeButton.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        `;
        // 组装DOM
        this.mapContainer.appendChild(this.mapImageDiv);
        this.mapContainer.appendChild(this.closeButton);
        this.mapContainer.appendChild(this.tip);
        this.overlay.appendChild(this.mapContainer);
        document.body.appendChild(this.overlay);
        this.closeButton.addEventListener('click', this.closeMap.bind(this));
        this.initMenu();
    }
    closeMap(){
        this.overlay.style.display = 'none';
    };
    showMap(){
        this.overlay.style.display = 'flex';
    }
    clickMap(event){
        if (event.button != 2) return;
        // 获取图片的实际显示尺寸
        const displayWidth = this.mapImage.width;
        const displayHeight = this.mapImage.height;
        
        // 获取图片的原始尺寸
        const naturalWidth = this.mapImage.naturalWidth;
        const naturalHeight = this.mapImage.naturalHeight;
        console.log(naturalHeight, naturalWidth);
        
        // 计算缩放比例
        const scaleX = naturalWidth / displayWidth;
        const scaleY = naturalHeight / displayHeight;
        
        // 计算相对于图片的位置（考虑 padding）
        let position = {
            x: (event.offsetX) * scaleX,
            y: (event.offsetY) * scaleY
        }
        
        this.addPoint(position);
        console.log('在地图上的原始位置', position, '点击位置', event.offsetX, event.offsetY);
    }
    addPoint(position){
        let realPosition = this.getRealPoint(position);
        let point = new Point(position, this.pointList.length, realPosition);
        this.pointList.push(point);
    }
    getRealPoint(position){
        let scaleX = this.mapConfig.Distance.x / (this.mapConfig.RightBottom.x - this.mapConfig.LeftTop.x);
        let scaleY = this.mapConfig.Distance.y / (this.mapConfig.RightBottom.y - this.mapConfig.LeftTop.y);
        let realPoint = {
            x: (position.x - this.mapConfig.BasePoint.x) * scaleX,
            y: (position.y - this.mapConfig.BasePoint.y) * scaleY
        }
        return realPoint;
    }
    initMenu(){
        this.pointMenu = document.getElementById('pointMenu');
        this.mapImageDiv.appendChild(this.pointMenu);
    }
    deletePoint(point){
        this.pointList = this.pointList.filter(p => p !== point);
        point.Delete();
    }
    reloadPoint(position, id, realPosition, color, text){
        let point = new Point();
        point.reconstruct(position, id, realPosition, color, text);
        this.pointList.push(point);
    }
}

const Manager = new ObjectManager();

export default Manager;