let gridSize = 20;
let lastscale = 1;
let scale = 1;



class ObjectManager{
    constructor(){
        this.NodecontainerId = "Nodecontainer";
        this.EdgecontainerId = "Edgecontainer";
        this.NodeList = [];
        this.EdgeList = [];
        this.menu_node = null;

        window.addEventListener('wheel', this.updatescale.bind(this));
    }

    updatescale(){

        this.NodeList.forEach(Node => {
            Node.UpdateView();
        })
        this.EdgeList.forEach(Edge => {
            Edge.UpdateView();
        })
        const menu = document.getElementById('menu')
        if (menu.style.display === 'flex') {
            menu.style.left = `${(parseInt(menu.style.left) + menu.offsetWidth / 2) / lastscale * scale - menu.offsetWidth / 2}px`
            menu.style.top = `${parseInt(menu.style.top) / lastscale * scale}px`
        }

    }

    addNode(x, y, width, height, borderRadius, border, bordercolor, color){
        let node_id =  "Node_" + this.NodeList.length;
        this.NodeList.push(new Node(this.NodecontainerId, x, y, width, height, borderRadius, border, bordercolor, color, node_id, this));
    }

    deleteNode(id) {
        // 删除对应的按钮
        const button = document.querySelector(`button[data-id="${id}"]`);
        if (button) {
            button.remove();
        }
        // 过滤掉目标节点
        this.NodeList = this.NodeList.filter(node => node.id !== id);
        // 重新排序剩余节点的ID，并更新DOM元素和按钮属性
        this.NodeList.forEach((node, index) => {
            const oldId = node.id; // 保存旧ID以定位按钮
            const newId = `Node_${index}`;
            // 更新节点ID
            node.id = newId;
            // 更新节点对应的DOM元素ID
            if (node.element) {
                node.element.id = newId;
            }
            // 找到旧ID对应的按钮，更新其data-id属性
            const oldButton = document.querySelector(`button[data-id="${oldId}"]`);
            if (oldButton) {
                oldButton.setAttribute('data-id', newId);
            }
        });
    }

    addLine(points){
        let canMerge = false;
        this.EdgeList.forEach(Edge => {
            canMerge = Edge.CheckCanMerge(points)
        })
        if (!canMerge) {
            let polyline = new Line(points, `temp_${Math.random()}`, null);
            this.EdgeList.push(new Edge(this.EdgecontainerId ,`Edge_${this.EdgeList.length}`, polyline));
        }
    }
    
}

class Node{
    constructor(containerId, x, y, width, height, borderRadius, border, bordercolor, color, id, manager){
        this.containerId = containerId;
        this.left = x;
        this.top = y;
        this.width = width;
        this.height = height;
        this.borderRadius = borderRadius;
        this.bordercolor = bordercolor;
        this.color = color;
        this.border = border;
        this.id = id;
        this.font = {
            size: 12,
            color: "#000000",
            Text: ""
        }
        this.task = {
            
        }
        this.create();
        this.manager = manager;
        this.menu = document.getElementById('menu')
        
    }
    
    create(){
        const container = document.getElementById(this.containerId)
        
        const button = document.createElement('button')
        
        button.className = 'node'      // 继承之前定义的样式
        button.setAttribute('data-id', this.id) // 设置自定义属性
        button.textContent = `Node ${this.id}` // 默认文本
        
        container.appendChild(button)
        
        this.UpdateView()

        button.addEventListener("mouseenter", () => {
            button.style.border = `${this.border * scale * 2}px solid ${this.bordercolor}`
        });
    
        button.addEventListener("mouseleave", () => {
            button.style.border = `${this.border * scale}px solid ${this.bordercolor}`
        });

        button.addEventListener("click", () => {
            menu.style.display = menu.style.display != 'flex' ? 'flex' : 'none'
            if (this.manager.menu_node != this && menu.style.display === 'none') menu.style.display = 'flex'
            
            this.manager.menu_node = this
            menu.style.position = 'absolute'
            menu.style.left = `${this.left * scale + this.width * scale / 2 - menu.offsetWidth / 2}px`
            menu.style.top = `${this.top * scale + this.height * scale + gridSize * scale}px`
        })
    }


    UpdateView(){
        const button = document.querySelector(`button[data-id="${this.id}"]`)
        button.style.width = `${this.width * scale}px`
        button.style.height = `${this.height * scale}px`

        button.style.position = 'absolute'
        button.style.left = `${this.left * scale}px`
        button.style.top = `${this.top * scale}px`

        button.style.borderRadius = `${this.borderRadius * scale}px`
        button.style.border = `${this.border * scale}px solid ${this.bordercolor}`
        button.style.backgroundColor = this.color

        button.style.fontSize = `${this.font.size * scale}px`
        button.style.color = this.font.color
        button.style.fontFamily = 'Arial, sans-serif'
    }

    changestyle(x, y, width, height, borderRadius, border, bordercolor, color){
        this.left = x;
        this.top = y;
        this.width = width;
        this.height = height;
        this.borderRadius = borderRadius;
        this.bordercolor = bordercolor;
        this.color = color;
        this.border = border;
        this.UpdateView()
    }

    menu(){

    }

}


class Line {
    constructor(points = [], id, FatherEdge = null, round = false) {
        this.id = id;
        this.FatherEdge = FatherEdge;
        this.round = round;
        this.padding = 10;
        this.points = points;  // 路径点数组，格式：[{x,y}, {x,y}, ...]
        this.linewidth = 2.5;
        this.dasharray = `${this.linewidth * scale * 2},${this.linewidth * scale * 2}`;
        this.color = '#333';
        this.element = round ? this.createRoundedPath() : this.createPolyline();
        this.element.setAttribute("stroke-dasharray", this.dasharray);
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
        if (this.round) {
            this.element.remove();
            this.element = this.createRoundedPath();
            this.Addlistener();
        } else {
            this.element.setAttribute('points', this.points.map(p => `${p.x * scale},${p.y * scale}`).join(' '));
        }
        this.element.setAttribute("stroke-dasharray", this.dasharray);
    }

    createRoundedPath() {
        let A = {
            x: this.points[0].x * scale,
            y: this.points[0].y * scale
        }
        let B = {
            x: this.points[1].x * scale,
            y: this.points[1].y * scale
        }
        let C = {
            x: this.points[2].x * scale,
            y: this.points[2].y * scale
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
        path.setAttribute('data-id', this.id)
        return path;
    }

    createPolyline() {
        let polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        const pointsStr = this.points
            .map(p => `${p.x * scale},${p.y * scale}`)
            .join(" ");
        polyline.setAttribute("points", pointsStr);
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke-width", this.linewidth);
        polyline.setAttribute("stroke", this.color);
        polyline.setAttribute("stroke-dasharray", `none`);
        polyline.setAttribute('data-id', this.id)
        return polyline;
    }

    Addlistener(){
        this.element.addEventListener('mouseover', () => {
            this.FatherEdge.polylineList.forEach(polyline => {
                polyline.element.style.filter = 'drop-shadow(0px 0px 3px rgba(0,0,0,0.5))';
                polyline.element.setAttribute('stroke-width', this.linewidth + 2);
            })
        });
        this.element.addEventListener('mouseout', () => {
            this.FatherEdge.polylineList.forEach(polyline => {
                polyline.element.style.filter = '';
                polyline.element.setAttribute('stroke-width', this.linewidth);
            })
        })
    }
}

class Edge{
    constructor(containerId, id, BasePolyline){
        this.nodeIn = null;
        this.nodeTo = null;
        this.id = id
        this.polylineList = [];
        this.roundsize = gridSize;
        this.container = document.getElementById(containerId)

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("data-id", this.id);
        this.linewidth = 3;
        this.container.appendChild(this.svg);

        BasePolyline.id = `Edge_${this.id}_${this.polylineList.length}`
        BasePolyline.element.setAttribute("data-id", BasePolyline.id);
        BasePolyline.BindEdge(this);
        this.polylineList.push(BasePolyline);
        this.svg.appendChild(BasePolyline.element);

        this.UpdateSize();
    }

    UpdateSize() {
        let Min = { x: Infinity, y: Infinity };
        let Max = { x: -Infinity, y: -Infinity };
        this.polylineList.forEach(line => {
            const points = line.points;
            points.forEach(point => {
                if (point.x < Min.x) Min.x = point.x;
                if (point.y < Min.y) Min.y = point.y;
                if (point.x > Max.x) Max.x = point.x;
                if (point.y > Max.y) Max.y = point.y;
            });
        });
    
        const padding = this.linewidth + 5;
        const paddingX = padding / scale;
        const paddingY = padding / scale;
    
        const adjustedMin = {
            x: Min.x - paddingX,
            y: Min.y - paddingY
        };
        const adjustedMax = {
            x: Max.x + paddingX,
            y: Max.y + paddingY
        };
    
        this.svg.style.position = 'absolute';
        this.svg.style.left = `${adjustedMin.x * scale}px`;
        this.svg.style.top = `${adjustedMin.y * scale}px`;
        this.svg.style.width = `${(adjustedMax.x - adjustedMin.x) * scale}px`;
        this.svg.style.height = `${(adjustedMax.y - adjustedMin.y) * scale}px`;
    
        this.polylineList.forEach(line => {
            line.element.setAttribute("transform", `translate(${(-Min.x + paddingX) * scale},${(-Min.y + paddingX) * scale})`);
        });
    }
    
    UpdateView(){
        this.polylineList.forEach(line => {
            line.Redraw();
            if(line.round){
                this.svg.appendChild(line.element);
            }
        })
        this.UpdateSize();
    }

    CheckCanMerge(points){
        const Equal = (value1, value2, tolerance = 0.1) =>{
            return Math.abs(value1 - value2) < tolerance;
        }
        const EqualPoint = (point1, point2) => {
            return Equal(point1.x, point2.x, gridSize / 10 * scale) && 
                   Equal(point1.y, point2.y, gridSize / 10 * scale) ?
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
        let canMerge = false;
        let round = false;
        this.polylineList.forEach(polyline => {
            const points1 = polyline.points;
            const points2 = points;

            const junction = findJunction(polyline.points, points);

            if(junction != null){
                canMerge = true;
                round = (points1.at(1).x - points1.at(0).x > gridSize / 10 * scale) 
                    === (points2.at(1).y - points2.at(0).y > gridSize / 10 * scale);
                if(round){
                    // 计算交点处的圆角
                    let roundpoints = this.GetRoundPoints(points1, points2, junction);
                    
                    // 裁剪掉原直线的长度
                    const getEndpoint = (points) => 
                        Equal(points[0].x, junction.x, gridSize / 10 * scale) && 
                        Equal(points[0].y, junction.y, gridSize / 10 * scale)
                            ? points[1]
                            : points[0];
                    polyline.changePoints(
                        [getEndpoint(points1),roundpoints[0]]
                    );
                    
                    // 添加圆角
                    this.AddnewLine(new Line(roundpoints, `temp_{${Math.random()}}`, this, round));
                    // 添加新直线
                    this.AddnewLine(new Line([roundpoints[2], getEndpoint(points2)], `temp_{${Math.random()}}`, this));
                }else{
                    this.AddnewLine(new Line(points2, `temp_{${Math.random()}}`, this));
                }
                return;
            }
        })
        return canMerge;
    }
    AddnewLine(polyline){
        this.polylineList.push(polyline);
        this.svg.appendChild(polyline.element);
        let newId = `Edge_${this.id}_${this.polylineList.length}`
        polyline.element.setAttribute('data-id', newId);
        polyline.id = newId;
        this.UpdateView();
    }

    GetRoundPoints(points1, points2, junction) {
        const Equal = (value1, value2, tolerance = 0.1) =>{
            return Math.abs(value1 - value2) < tolerance;
        }
        // 获取非交点的端点
        const getEndpoint = (points) => 
            Equal(points[0].x, junction.x, gridSize / 10 * scale) && 
            Equal(points[0].y, junction.y, gridSize / 10 * scale)
                ? points[1]
                : points[0];
    
        // 安全方向计算
        const directionVector = (from, to) => ({
            x: Equal(from.x, to.x, gridSize / 10 * scale) ? 0 : (to.x - from.x) / Math.abs(to.x - from.x),
            y: Equal(from.y, to.y, gridSize / 10 * scale) ? 0 : (to.y - from.y) / Math.abs(to.y - from.y)
        });
    
        // 计算偏移点
        const offsetPoint = (endpoint) => ({
            x: junction.x + directionVector(junction, endpoint).x * this.roundsize,
            y: junction.y + directionVector(junction, endpoint).y * this.roundsize
        });
    
        return [
            offsetPoint(getEndpoint(points1)), // 圆角起点
            junction,                          // 原始交点
            offsetPoint(getEndpoint(points2)) // 圆角终点
        ];
    }
    
}