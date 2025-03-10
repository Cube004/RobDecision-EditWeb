import state from "./script.js";
import Manager from "./manager.js";

class ColorPicker {
    constructor(options = {}) {
        const { type = 'fill' } = options;
        this.type = type;
        this.currentColor = '#4285f4';
        this.currentOpacity = 100;
        this.onChange = options.onChange || function() {};
        
        // 根据类型获取相应的DOM元素
        const prefix = type === 'border' ? 'border-' : 'fill-';
        this.colorOptions = document.querySelectorAll(`#${type}Color .color-option`);
        
        if (this.type === 'fill') {
            this.opacitySlider = document.getElementById(`${prefix}opacity-slider`);
            this.opacityValue = document.getElementById(`${prefix}opacity-value`);
        }

        // 颜色图标
        this.colorIcon = document.querySelector(`#${type}Color .icon svg`);

        // 自定义颜色
        this.customColorSection = document.getElementById(`${prefix}custom-color-section`);
        this.customColorInput = document.getElementById(`${prefix}custom-color`);

        this.hexInput = document.getElementById(`${prefix}hex-value`);
        this.addColorButton = document.getElementById(`${prefix}add-color-button`);
        
        this.init();
    }
    
    init() {
        // 初始化颜色选择事件
        this.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                if (option.id === 'add-custom-color') {
                    this.toggleCustomColorSection();
                } else {
                    this.selectColor(option);
                }
            });
        });
        
        // 初始化不透明度滑块事件
        if (this.type === 'fill') {
            this.opacitySlider.addEventListener('input', () => {
                this.opacitySlider.style.setProperty('--value', this.value + '%');
                this.opacityValue.textContent = this.value + '%';
                this.updateOpacity(this.opacitySlider.value);
            });
        }
        
        // 初始化自定义颜色输入事件
        this.customColorInput.addEventListener('input', () => {
            this.hexInput.value = this.customColorInput.value.toUpperCase();
        });
        
        // 初始化十六进制输入事件
        this.hexInput.addEventListener('input', () => {
            if (/^#[0-9A-F]{6}$/i.test(this.hexInput.value)) {
                this.customColorInput.value = this.hexInput.value;
            }
        });

        // 初始化添加颜色按钮事件
        this.addColorButton.addEventListener('click', () => {
            this.addCustomColor();
        });

    }
    
    
    selectColor(option) {
        // 移除之前的选中状态
        this.colorOptions.forEach(opt => opt.classList.remove('selected'));
        // 添加新的选中状态
        option.classList.add('selected');
        
        this.currentColor = option.dataset.color;
        // 更新颜色图标的颜色
        if (this.colorIcon) {
            this.colorIcon.style.fill = this.currentColor === 'transparent' ? '#666' : this.currentColor;
            this.colorIcon.style.opacity = this.currentOpacity / 100;
        }
        
        this.triggerChange();
    }
    
    updateOpacity(value) {
        this.currentOpacity = value;
        if (this.type === 'fill') {
            this.opacityValue.textContent = value + '%';
            this.opacitySlider.style.setProperty('--value', value + '%');
        }
        
        // 更新颜色图标的透明度
        if (this.colorIcon) {
            this.colorIcon.style.opacity = value / 100;
        }
        
        this.triggerChange();
    }
    
    toggleCustomColorSection() {
        const isVisible = this.customColorSection.style.display !== 'none';
        this.customColorSection.style.display = isVisible ? 'none' : 'block';
    }
    
    triggerChange() {
        this.onChange({
            type: this.type,
            color: this.currentColor,
            opacity: this.currentOpacity,
            rgba: this.getRgbaValue()
        });
    }
    
    getRgbaValue() {
        if (this.currentColor === 'transparent') {
            return 'transparent';
        }
        
        const hex = this.currentColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${this.currentOpacity / 100})`;
    }
    
    // 公共接口
    getColor() {
        return {
            color: this.currentColor,
            opacity: this.currentOpacity,
            rgba: this.getRgbaValue()
        };
    }
    
    setColor(color, opacity) {
        
        if (color) {
            // 查找匹配的预设颜色
            const matchedOption = Array.from(this.colorOptions)
                .find(option => option.dataset.color == color);
            
            if (matchedOption) {
                this.selectColor(matchedOption);
                
            } else {
                this.currentColor = color;
            }
            
        }
        
        if (opacity !== undefined) {
            this.updateOpacity(opacity);
        }
    }

    addCustomColor() {
        const color = this.customColorInput.value;
        
        // 创建新的颜色选项
        const newColorOption = document.createElement('div');
        newColorOption.className = 'color-option';
        newColorOption.style.backgroundColor = color;
        newColorOption.dataset.color = color;
        
        // 获取添加按钮的引用
        const addButton = document.getElementById('add-custom-color');
        
        // 在添加按钮前插入新的颜色选项
        addButton.parentNode.insertBefore(newColorOption, addButton);
        
        // 为新的颜色选项添加点击事件
        newColorOption.addEventListener('click', () => {
            this.selectColor(newColorOption);
        });
        
        // 选中新添加的颜色
        this.selectColor(newColorOption);
        
        // 隐藏自定义颜色区域
        this.toggleCustomColorSection();
    }
}

class MenuNode {
    constructor() {
        this.menu = document.getElementById('nodeMenu')

        // 位置
        this.x = 0;
        this.y = 0;
        
        // 大小
        this.width = 200;
        this.height = 100;
        
        // 样式
        this.borderRadius = 8;
        this.borderWidth = 1;
        this.borderColor = '#4285f4';
        this.fillcolor = '#4285f4';
        this.fillOpacity = 100;
        
        // 文本
        this.text = '';
        this.textColor = '#000000';
        this.fontSize = 14;
        this.fontFamily = 'Arial';
        
        // 当前选中的节点
        this.selectedNode = null;
        
        // 添加文本属性相关的DOM引用
        this.textInput = document.getElementById('node-text');
        this.fontSizeInput = document.getElementById('font-size');
        this.textColorOptions = document.querySelectorAll('#textProperties .color-option');
        
        // 修改圆角相关的DOM引用
        this.radiusPreset = document.getElementById('radius-preset');
        this.customRadius = document.getElementById('custom-radius');
        this.customRadiusGroup = document.getElementById('custom-radius-group');
        
        // 修改删除按钮相关的DOM引用
        this.deleteButton = document.getElementById('delete-button');
        this.deleteConfirm = document.querySelector('.delete-confirm-content');
        this.confirmButton = document.querySelector('.confirm-button');
        
        // 添加文本菜单的引用
        this.textProperties = document.getElementById('textProperties');
        this.textPropertiesContent = document.querySelector('.text-properties-content');
        
        // 创建两个独立的颜色选择器实例
        this.fillColorPicker = new ColorPicker({
            type: 'fill',
            onChange: colorInfo =>{
                this.updateFromColorPickers(colorInfo);
            }
        });

        this.borderColorPicker = new ColorPicker({
            type: 'border',
            onChange: colorInfo =>{
                this.updateFromColorPickers(colorInfo);
            }
        });

        this.initTextProperties();
        this.initTextPropertiesHover();
        this.initBorderRadius();
        this.initDeleteConfirm();
    }
    
    // 初始化文本编辑器
    initTextProperties() {
        // 文本内容变化监听
        this.textInput.addEventListener('input', () => {
            this.setText(this.textInput.value);
        });
        
        // 字体大小变化监听
        this.fontSizeInput.addEventListener('input', () => {
            this.setText(undefined, undefined, parseInt(this.fontSizeInput.value));
        });
        
        // 文本颜色选择监听
        this.textColorOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.setText(undefined, option.dataset.color);
                // 更新选中状态
                this.textColorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }
    
    // 初始化文本编辑器hover
    initTextPropertiesHover() {
        let isHovered = false;
        let isComposing = false;
        let closeTimeout = null;  // 添加延时变量
        
        // 监听输入法组合事件
        this.textInput.addEventListener('compositionstart', () => {
            isComposing = true;
        });
        
        this.textInput.addEventListener('compositionend', () => {
            isComposing = false;
        });
        
        // 监听菜单项的hover
        this.textProperties.addEventListener('mouseenter', () => {
            if (closeTimeout) {
                clearTimeout(closeTimeout);  // 清除延时关闭
            }
            isHovered = true;
            this.textPropertiesContent.classList.add('show');
        });
        
        this.textProperties.addEventListener('mouseleave', (e) => {
            isHovered = false;
            // 设置延时关闭
            closeTimeout = setTimeout(() => {
                if (!isHovered && !isComposing) {
                    this.textPropertiesContent.classList.remove('show');
                }
            }, 100);  // 100ms的延迟
        });
        
        // 监听内容区域的hover
        this.textPropertiesContent.addEventListener('mouseenter', () => {
            if (closeTimeout) {
                clearTimeout(closeTimeout);  // 清除延时关闭
            }
            isHovered = true;
        });
        
        this.textPropertiesContent.addEventListener('mouseleave', (e) => {
            isHovered = false;
            // 设置延时关闭
            closeTimeout = setTimeout(() => {
                if (!isHovered && !isComposing) {
                    this.textPropertiesContent.classList.remove('show');
                }
            }, 100);  // 100ms的延迟
        });
        
        // 监听文档点击，但在输入过程中不关闭
        document.addEventListener('click', (e) => {
            if (!isComposing && 
                !this.textProperties.contains(e.target) && 
                !this.textPropertiesContent.contains(e.target)) {
                this.textPropertiesContent.classList.remove('show');
            }
        });
    }
    
    // 初始化圆角设置
    initBorderRadius() {
        // 预设圆角选择事件
        this.radiusPreset.addEventListener('change', () => {
            const value = this.radiusPreset.value;
            if (value === 'custom') {
                this.customRadiusGroup.style.display = 'flex';
                this.setBorderRadius(parseInt(this.customRadius.value));
            } else {
                this.customRadiusGroup.style.display = 'none';
                this.setBorderRadius(parseInt(value) * state.gridSize);
            }
        });
        
        // 自定义圆角输入事件
        this.customRadius.addEventListener('input', () => {
            this.setBorderRadius(parseInt(this.customRadius.value));
        });
    }

    // 初始化删除确认
    initDeleteConfirm() {
        // 确认删除按钮点击事件
        this.confirmButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.selectedNode) {
                Manager.deleteNode(this.selectedNode.id);
                delete this.selectedNode
                this.selectedNode = null;
            }
            this.menu.style.display = 'none';
        });
    }

    // 更新选中的节点
    BindNode(node) {
        this.selectedNode = node;
        if (node) {
            this.updateFromNode();
            this.updateColorPickers();
            this.updateTextProperties();
            this.updateBorderRadius();
        }
    }

    // 更新文本属性显示
    updateTextProperties() {
        if (this.selectedNode) {
            this.textInput.value = this.selectedNode.text.content || '';
            this.fontSizeInput.value = this.selectedNode.text.size || 14;
            
            // 更新T图标颜色
            const icon = document.querySelector(`svg[data-id="T-icon"]`);
            // 将RGB颜色转换为十六进制
            const textColor = this.selectedNode.text.color || 'rgb(102, 102, 102)';
            
            if (textColor.startsWith('rgb')) {
                const rgb = textColor.match(/\d+/g);
                if (rgb && rgb.length === 3) {
                    const hexColor = '#' + rgb.map(x => {
                        const hex = parseInt(x).toString(16);
                        return hex.length === 1 ? '0' + hex : hex;
                    }).join('');
                    icon.style.fill = hexColor;
                }
            } else {
                icon.style.fill = textColor;
            }
            // 更新文本颜色选中状态
            this.textColorOptions.forEach(option => {
                const optionColor = option.dataset.color;
                // 将选项的十六进制颜色转换为RGB进行比较
                const r = parseInt(optionColor.slice(1, 3), 16);
                const g = parseInt(optionColor.slice(3, 5), 16);
                const b = parseInt(optionColor.slice(5, 7), 16);
                const rgbColor = `rgb(${r}, ${g}, ${b})`;
                option.classList.toggle('selected', rgbColor === this.selectedNode.text.color);
            });
        }
    }

    // 从颜色选择器更新菜单数据
    updateFromColorPickers(colorInfo) {
        if(colorInfo.type === 'fill'){
            this.fillcolor = colorInfo.color;
            this.fillOpacity = colorInfo.opacity;
        }else if(colorInfo.type === 'border'){
            this.borderColor = colorInfo.color;
        }
        this.UpdateNode();
    }

    // 从节点更新菜单数据
    updateFromNode() {
        // 位置
        this.x = this.selectedNode.position.x;
        this.y = this.selectedNode.position.y;
        
        // 形状
        this.width = this.selectedNode.shape.width;
        this.height = this.selectedNode.shape.height;
        this.borderRadius = this.selectedNode.shape.borderRadius;
        this.borderWidth = this.selectedNode.shape.borderWidth;
        
        // 颜色
        this.borderColor = this.selectedNode.color.borderColor;
        this.fillcolor = this.selectedNode.color.fillColor;
        this.fillOpacity = this.selectedNode.color.fillOpacity;
        
        // 文本
        this.text = this.selectedNode.text.content;
        this.textColor = this.selectedNode.text.color;
        this.fontSize = this.selectedNode.text.size;
        this.fontFamily = this.selectedNode.text.fontFamily;
    }

    // 更新圆角显示
    updateBorderRadius() {
        if (this.selectedNode) {
            const radius = this.selectedNode.shape.borderRadius;
            const gridRadius = radius / state.gridSize;
            
            // 检查是否匹配预设值
            if (Number.isInteger(gridRadius) && gridRadius >= 0 && gridRadius <= 3) {
                this.radiusPreset.value = gridRadius.toString();
                this.customRadiusGroup.style.display = 'none';
            } else {
                this.radiusPreset.value = 'custom';
                this.customRadiusGroup.style.display = 'flex';
            }
            
            this.customRadius.value = radius;
        }
    }

    // 更新颜色选择器显示
    updateColorPickers() {
        this.fillColorPicker.setColor(this.fillcolor, this.fillOpacity);
        this.borderColorPicker.setColor(this.borderColor);
    }
    
    // 更新节点视图
    UpdateNode() {
        if (this.selectedNode) {
            const shape = {
                width: this.width,
                height: this.height,
                borderRadius: this.borderRadius,
                borderWidth: this.borderWidth
            }

            const color = {
                borderColor: this.borderColor,
                fillColor: this.fillcolor,
                fillOpacity: this.fillOpacity
            }   
            
            const text = {
                content: this.text,
                size: this.fontSize,
                color: this.textColor,
                fontFamily: this.fontFamily
            }
            
            const task = null;
            // 触发节点更新
            this.selectedNode.changeStyle(shape, color, text, task);
        }
    }
    
    // 更新位置
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.UpdateNode();
    }
    
    // 更新大小
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.UpdateNode();
    }
    
    // 更新圆角
    setBorderRadius(radius) {
        this.borderRadius = radius;
        this.UpdateNode();
    }
    
    // 更新文本属性
    setText(text, color, size, family) {
        if (text !== undefined) this.text = text;
        if (color !== undefined) {
            this.textColor = color;
            const icon = document.querySelector(`svg[data-id="T-icon"]`);
            icon.style.fill = color;
        }
        if (size !== undefined) this.fontSize = size;
        if (family !== undefined) this.fontFamily = family;
        this.UpdateNode();
    }
    
}

class MenuEdge {
    constructor() {
        this.menu = document.getElementById('edgeMenu');

        // 线条属性
        this.color = '#4285f4';
        this.width = 2;
        this.condition = '';
        this.conditionType = 'success';
        this.text = '';
        this.textColor = '#000000';
        this.fontSize = 14;
        
        // 当前选中的边
        this.selectedEdge = null;
        
        // 颜色选择器相关DOM引用
        this.colorOptions = document.querySelectorAll('#edgeColor .color-option');
        this.colorIcon = document.querySelector('#edgeColor .icon svg');
        
        // 线条宽度相关DOM引用
        this.widthPreset = document.getElementById('width-preset');
        this.customWidth = document.getElementById('custom-width');
        this.customWidthGroup = document.getElementById('custom-width-group');
        
        // 方向相关DOM引用
        this.directionButton = document.querySelector('#edgeDirection .confirm-button');
        
        // 条件相关DOM引用
        this.conditionInput = document.getElementById('edge-condition');
        this.conditionTypeOptions = document.querySelectorAll('input[name="condition-type"]');
        
        // 文本相关DOM引用
        this.textInput = document.querySelector('#edgeMenu #node-text');
        this.fontSizeInput = document.querySelector('#edgeMenu #font-size');
        this.textColorOptions = document.querySelectorAll('#edgeMenu #textProperties .color-option');
        
        // 删除按钮相关DOM引用
        this.deleteButton = document.getElementById('edge-delete-button');
        this.confirmButton = document.querySelector('#delete-confirm-content .confirm-button');
        
        // 自定义颜色相关DOM引用
        this.customColorSection = document.getElementById('edge-custom-color-section');
        this.customColorInput = document.getElementById('edge-custom-color');
        this.hexInput = document.getElementById('edge-hex-value');
        this.addColorButton = document.getElementById('edge-add-color-button');
        
        // 添加文本菜单的引用
        this.textProperties = document.getElementById('edgeMenu').querySelector('#textProperties');
        this.textPropertiesContent = document.querySelector('#edgeMenu .text-properties-content');
        
        this.init();
    }
    
    init() {
        // 初始化颜色选择事件
        this.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                if (option.id === 'add-edge-custom-color') {
                    this.toggleCustomColorSection();
                } else {
                    this.selectColor(option);
                }
            });
        });
        
        // 初始化线条宽度事件
        this.widthPreset.addEventListener('change', () => {
            const value = this.widthPreset.value;
            if (value === 'custom') {
                this.customWidthGroup.style.display = 'flex';
                this.setWidth(parseInt(this.customWidth.value));
            } else {
                this.customWidthGroup.style.display = 'none';
                this.setWidth(parseInt(value));
            }
        });
        
        // 自定义宽度输入事件
        this.customWidth.addEventListener('input', () => {
            this.setWidth(parseInt(this.customWidth.value));
        });
        
        // 初始化方向反转按钮事件
        this.directionButton.addEventListener('click', () => {
            this.reverseDirection();
        });
        
        // 初始化条件输入事件
        this.conditionInput.addEventListener('input', () => {
            this.setCondition(this.conditionInput.value);
        });
        
        // 初始化条件类型选择事件
        this.conditionTypeOptions.forEach(option => {
            option.addEventListener('change', () => {
                if (option.checked) {
                    this.setConditionType(option.value);
                }
            });
        });
        
        // 初始化文本输入事件
        this.textInput.addEventListener('input', () => {
            this.setText(this.textInput.value);
        });
        
        // 初始化字体大小事件
        this.fontSizeInput.addEventListener('input', () => {
            this.setText(undefined, undefined, parseInt(this.fontSizeInput.value));
        });
        
        // 初始化文本颜色选择事件
        this.textColorOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.setText(undefined, option.dataset.color);
                // 更新选中状态
                this.textColorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        // 初始化删除确认按钮事件
        this.confirmButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.selectedEdge) {
                Manager.deleteEdge(this.selectedEdge);
                this.selectedEdge = null;
            }
            this.menu.style.display = 'none';
        });
        
        // 初始化自定义颜色输入事件
        this.customColorInput.addEventListener('input', () => {
            this.hexInput.value = this.customColorInput.value.toUpperCase();
        });
        
        // 初始化十六进制输入事件
        this.hexInput.addEventListener('input', () => {
            if (/^#[0-9A-F]{6}$/i.test(this.hexInput.value)) {
                this.customColorInput.value = this.hexInput.value;
            }
        });
        
        // 初始化添加颜色按钮事件
        this.addColorButton.addEventListener('click', () => {
            this.addCustomColor();
        });

        // 添加文本属性悬停功能
        this.initTextPropertiesHover();
    }
    
    // 初始化文本编辑器hover
    initTextPropertiesHover() {
        let isHovered = false;
        let isComposing = false;
        let closeTimeout = null;  // 添加延时变量
        
        // 监听输入法组合事件
        this.textInput.addEventListener('compositionstart', () => {
            isComposing = true;
        });
        
        this.textInput.addEventListener('compositionend', () => {
            isComposing = false;
        });
        
        // 监听菜单项的hover
        this.textProperties.addEventListener('mouseenter', () => {
            if (closeTimeout) {
                clearTimeout(closeTimeout);  // 清除延时关闭
            }
            isHovered = true;
            this.textPropertiesContent.classList.add('show');
        });
        
        this.textProperties.addEventListener('mouseleave', (e) => {
            isHovered = false;
            // 设置延时关闭
            closeTimeout = setTimeout(() => {
                if (!isHovered && !isComposing) {
                    this.textPropertiesContent.classList.remove('show');
                }
            }, 100);  // 100ms的延迟
        });
        
        // 监听内容区域的hover
        this.textPropertiesContent.addEventListener('mouseenter', () => {
            if (closeTimeout) {
                clearTimeout(closeTimeout);  // 清除延时关闭
            }
            isHovered = true;
        });
        
        this.textPropertiesContent.addEventListener('mouseleave', (e) => {
            isHovered = false;
            // 设置延时关闭
            closeTimeout = setTimeout(() => {
                if (!isHovered && !isComposing) {
                    this.textPropertiesContent.classList.remove('show');
                }
            }, 100);  // 100ms的延迟
        });
        
        // 监听文档点击，但在输入过程中不关闭
        document.addEventListener('click', (e) => {
            if (!isComposing && 
                !this.textProperties.contains(e.target) && 
                !this.textPropertiesContent.contains(e.target)) {
                this.textPropertiesContent.classList.remove('show');
            }
        });
    }
    
    // 绑定选中的边
    BindEdge(edge) {
        this.selectedEdge = edge;
        if (edge) {
            this.updateFromEdge();
            this.updateUI();
        }
    }
    
    // 从边更新菜单数据
    updateFromEdge() {
        if (this.selectedEdge) {
            this.color = this.selectedEdge.LineStyle.color || '#4285f4';
            this.width = this.selectedEdge.LineStyle.width || 2;
            this.condition = this.selectedEdge.condition || '';
            this.text = this.selectedEdge.text.content || '';
            this.textColor = this.selectedEdge.text.color || '#000000';
            this.fontSize = this.selectedEdge.text.size || 14;
        }
    }
    
    // 更新UI显示
    updateUI() {
        // 更新颜色选择器
        this.updateColorSelection();
        
        // 更新线条宽度
        this.updateWidthSelection();
        
        // 更新条件输入
        this.conditionInput.value = this.condition;
        
        // 更新条件类型
        this.conditionTypeOptions.forEach(option => {
            option.checked = option.value === this.conditionType;
        });
        
        // 更新文本输入
        this.textInput.value = this.text;
        
        // 更新字体大小
        this.fontSizeInput.value = this.fontSize;
        
        // 更新文本颜色选择
        this.updateTextColorSelection();
    }
    
    // 更新颜色选择器显示
    updateColorSelection() {
        // 移除之前的选中状态
        this.colorOptions.forEach(option => option.classList.remove('selected'));
        
        // 查找匹配的预设颜色并选中
        const matchedOption = Array.from(this.colorOptions)
            .find(option => option.dataset.color === this.color);
        
        if (matchedOption) {
            matchedOption.classList.add('selected');
        }
        
        // 更新颜色图标
        if (this.colorIcon) {
            this.colorIcon.style.fill = this.color;
        }
    }
    
    // 更新线条宽度显示
    updateWidthSelection() {
        const width = this.width;
        
        // 检查是否匹配预设值
        if ([1, 2, 3, 4].includes(width)) {
            this.widthPreset.value = width.toString();
            this.customWidthGroup.style.display = 'none';
        } else {
            this.widthPreset.value = 'custom';
            this.customWidthGroup.style.display = 'flex';
            this.customWidth.value = width;
        }
    }
    
    // 更新文本颜色选择显示
    updateTextColorSelection() {
        // 移除之前的选中状态
        this.textColorOptions.forEach(option => option.classList.remove('selected'));
        
        // 查找匹配的预设颜色并选中
        const matchedOption = Array.from(this.textColorOptions)
            .find(option => option.dataset.color === this.textColor);
        
        if (matchedOption) {
            matchedOption.classList.add('selected');
        }
        
        // 更新T图标颜色
        const icon = document.querySelector(`#edgeMenu svg[data-id="T-icon"]`);
        if (icon) {
            icon.style.fill = this.textColor;
        }
    }
    
    // 选择颜色
    selectColor(option) {
        // 移除之前的选中状态
        this.colorOptions.forEach(opt => opt.classList.remove('selected'));
        // 添加新的选中状态
        option.classList.add('selected');
        
        this.color = option.dataset.color;
        // 更新颜色图标
        if (this.colorIcon) {
            this.colorIcon.style.fill = this.color;
        }
        
        this.updateEdge();
    }
    
    // 设置线条宽度
    setWidth(width) {
        this.width = width;
        this.updateEdge();
    }
    
    // 反转边的方向
    reverseDirection() {
        if (this.selectedEdge) {
            this.selectedEdge.reverseDirection();
        }
    }
    
    // 设置条件
    setCondition(condition) {
        this.condition = condition;
        this.updateEdge();
    }
    
    // 设置条件类型
    setConditionType(type) {
        this.conditionType = type;
        this.updateEdge();
    }
    
    // 设置文本属性
    setText(text, color, size) {
        if (text !== undefined) this.text = text;
        if (color !== undefined) {
            this.textColor = color;
            const icon = document.querySelector(`#edgeMenu svg[data-id="T-icon"]`);
            if (icon) {
                icon.style.fill = color;
            }
        }
        if (size !== undefined) this.fontSize = size;
        
        this.updateEdge();
    }
    
    // 更新边
    updateEdge() {
        if (this.selectedEdge) {
            // 更新边属性
            this.selectedEdge.LineStyle.color = this.color;
            this.selectedEdge.LineStyle.width = this.width;
            this.selectedEdge.condition = this.condition;
            
            // 更新文本属性
            if (!this.selectedEdge.text) {
                this.selectedEdge.text = {};
            }
            this.selectedEdge.text.content = this.text;
            this.selectedEdge.text.color = this.textColor;
            this.selectedEdge.text.size = this.fontSize;
            
            // 触发边更新
            this.selectedEdge.UpdateView();
        }
    }
    
    // 切换自定义颜色区域显示
    toggleCustomColorSection() {
        const isVisible = this.customColorSection.style.display !== 'none';
        this.customColorSection.style.display = isVisible ? 'none' : 'block';
    }
    
    // 添加自定义颜色
    addCustomColor() {
        const color = this.customColorInput.value;
        
        // 创建新的颜色选项
        const newColorOption = document.createElement('div');
        newColorOption.className = 'color-option';
        newColorOption.style.backgroundColor = color;
        newColorOption.dataset.color = color;
        
        // 获取添加按钮的引用
        const addButton = document.getElementById('add-edge-custom-color');
        
        // 在添加按钮前插入新的颜色选项
        addButton.parentNode.insertBefore(newColorOption, addButton);
        
        // 为新的颜色选项添加点击事件
        newColorOption.addEventListener('click', () => {
            this.selectColor(newColorOption);
        });
        
        // 选中新添加的颜色
        this.selectColor(newColorOption);
        
        // 隐藏自定义颜色区域
        this.toggleCustomColorSection();
    }
}

class MenuManager{
    constructor(){
        this.menuNode = new MenuNode();
        this.menuEdge = new MenuEdge();
    }

    BindNode(node){
        this.menuNode.BindNode(node);
    }

    BindEdge(edge){
        this.menuEdge.BindEdge(edge);
    }
}

const menuManager = new MenuManager();

export default menuManager;