import state from "./script.js";
import menuManager from "./menu.js";
import {previewEdit} from './graph.js';

class ObjectManager{
    constructor(){
        this.NodeContainerId = "nodeContainer";
        this.EdgeContainerId = "edgeContainer";
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
                task: node.task
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
        const outputData = {
            Date: new Date().toISOString(),
            Version: 1.0,
            Nodes: NodeData,
            Edges: EdgeData
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
                let newNode = new Node(this.NodeContainerId, nodeData.id, nodeData.position, nodeData.shape, nodeData.color, nodeData.text, nodeData.task);
                this.NodeList.push(newNode);
            });
            
            // 加载边
            data.Edges.forEach(edgeData => {
                let newEdge = new Edge(this.EdgeContainerId, edgeData.id);
                newEdge.reconstruct(this.EdgeContainerId, edgeData.id, edgeData.node, edgeData.lineStyle, edgeData.text, edgeData.condition, edgeData.endpoints, edgeData.pointLists);
                this.EdgeList.push(newEdge);
                this.CheckConnection(newEdge);
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
    constructor(containerId, id, position, shape, color, text = null, task = null){
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
        if (task != null){
            this.task = task;
        }else{
            this.task = {

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

    changeStyle(shape, color, text, task){
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
        this.task = task;
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
        this.Addlistener();
        this.FatherEdge.svg.appendChild(this.element);
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
        this.element.addEventListener('mouseover', () => {
            this.FatherEdge.lineList.forEach(line => {
                line.element.style.filter = 'drop-shadow(0px 0px 3px rgba(0,0,0,0.5))';
                line.element.setAttribute('stroke-width', this.linewidth + 2);
            })
        });
        this.element.addEventListener('mouseout', () => {
            this.FatherEdge.lineList.forEach(line => {
                line.element.style.filter = '';
                line.element.setAttribute('stroke-width', this.linewidth);
            })
        })
        this.element.addEventListener('click', () => {
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
            weight: 2,
        }

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

const Manager = new ObjectManager();
export default Manager;