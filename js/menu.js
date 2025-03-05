document.getElementById('opacity-slider').addEventListener('input', function() {
    this.style.setProperty('--value', this.value + '%');
    document.getElementById('opacity-value').textContent = this.value + '%';
});

// 处理颜色选择
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
        const color = this.dataset.color;
        
    });
});

class ColorPicker {
    constructor(options = {}) {
        const { type = 'fill' } = options;
        this.type = type;
        this.currentColor = '#4285f4';
        this.currentOpacity = 100;
        this.onChange = options.onChange || function() {};
        
        // 根据类型获取相应的DOM元素
        const prefix = type === 'border' ? 'border-' : '';
        this.colorOptions = document.querySelectorAll(`#${type}Color .color-option`);
        this.opacitySlider = document.getElementById(`${prefix}opacity-slider`);
        this.opacityValue = document.getElementById(`${prefix}opacity-value`);
        this.customColorSection = document.getElementById(`${prefix}custom-color-section`);
        this.customColorInput = document.getElementById(`${prefix}custom-color`);
        this.hexInput = document.getElementById(`${prefix}hex-value`);
        this.colorIcon = document.querySelector(`#${type}Color .icon svg`);
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
        this.opacitySlider.addEventListener('input', () => {
            this.updateOpacity(this.opacitySlider.value);
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
            if(this.type === 'border'){
                Manager.menu_node.borderColor = this.currentColor;
                Manager.menu_node.borderOpacity = this.currentOpacity;
            }else if(this.type === 'fill'){
                Manager.menu_node.color = this.currentColor;
                Manager.menu_node.fillOpacity = this.currentOpacity;
            }
            Manager.menu_node.UpdateView();
        }
        
        this.triggerChange();
    }
    
    updateOpacity(value) {
        this.currentOpacity = value;
        this.opacityValue.textContent = value + '%';
        this.opacitySlider.style.setProperty('--value', value + '%');
        
        // 更新颜色图标的透明度
        if (this.colorIcon) {
            this.colorIcon.style.opacity = value / 100;
            if(this.type === 'border'){
                Manager.menu_node.borderOpacity = this.currentOpacity;
            }else if(this.type === 'fill'){
                Manager.menu_node.fillOpacity = this.currentOpacity;
            }
            Manager.menu_node.UpdateView();
        }
        
        this.triggerChange();
    }
    
    toggleCustomColorSection() {
        const isVisible = this.customColorSection.style.display !== 'none';
        this.customColorSection.style.display = isVisible ? 'none' : 'block';
    }
    
    triggerChange() {
        this.onChange({
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

// 创建两个独立的颜色选择器实例
let fillColorPicker = new ColorPicker({
    type: 'fill',
    onChange: function(colorInfo) {
        // console.log('Fill color changed:', colorInfo);
        // 处理填充颜色变化
    }
});

let borderColorPicker = new ColorPicker({
    type: 'border',
    onChange: function(colorInfo) {
        // console.log('Border color changed:', colorInfo);
        // 处理边框颜色变化
    }
});

class MenuManager {
    constructor() {
        this.menu = document.getElementById('menu')

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
        this.borderOpacity = 100;
        this.color = '#4285f4';
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
        
        this.initTextProperties();
        this.initTextPropertiesHover();
        this.initBorderRadius();
        this.initDeleteConfirm();
    }
    
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
    
    initBorderRadius() {
        // 预设圆角选择事件
        this.radiusPreset.addEventListener('change', () => {
            const value = this.radiusPreset.value;
            if (value === 'custom') {
                this.customRadiusGroup.style.display = 'flex';
                this.setBorderRadius(parseInt(this.customRadius.value));
            } else {
                this.customRadiusGroup.style.display = 'none';
                this.setBorderRadius(parseInt(value) * gridSize);
            }
        });
        
        // 自定义圆角输入事件
        this.customRadius.addEventListener('input', () => {
            this.setBorderRadius(parseInt(this.customRadius.value));
        });
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
    
    // 更新选中的节点
    setNode(node) {
        this.selectedNode = node;
        if (node) {
            this.updateFromNode();
            this.updateColorPickers();
            this.updateTextProperties();
            this.updateBorderRadius();
        }
    }
    
    // 从节点更新菜单数据
    updateFromNode() {
        // 位置
        this.x = this.selectedNode.x;
        this.y = this.selectedNode.y;
        
        // 大小
        this.width = this.selectedNode.width;
        this.height = this.selectedNode.height;
        
        // 样式
        this.borderRadius = this.selectedNode.borderRadius;
        this.borderWidth = this.selectedNode.borderWidth;
        this.borderColor = this.selectedNode.borderColor;
        this.borderOpacity = this.selectedNode.borderOpacity;
        this.color = this.selectedNode.color;
        this.fillOpacity = this.selectedNode.fillOpacity;
        
        // 文本
        this.text = this.selectedNode.text.content;
        this.textColor = this.selectedNode.text.color;
        this.fontSize = this.selectedNode.text.size;
        this.fontFamily = this.selectedNode.text.fontFamily;
    }
    
    // 更新颜色选择器显示
    updateColorPickers() {
        fillColorPicker.setColor(this.color, this.fillOpacity);
        borderColorPicker.setColor(this.borderColor, this.borderOpacity);
    }
    
    // 更新节点视图
    UpdateView() {
        if (this.selectedNode) {
            // 更新节点属性
            this.selectedNode.borderColor = this.borderColor;
            this.selectedNode.borderOpacity = this.borderOpacity;
            this.selectedNode.color = this.color;
            this.selectedNode.fillOpacity = this.fillOpacity;
            this.selectedNode.borderRadius = this.borderRadius;
            this.selectedNode.width = this.width;
            this.selectedNode.height = this.height;
            this.selectedNode.text.size = this.fontSize
            this.selectedNode.text.color = this.textColor
            this.selectedNode.text.content = this.text

            // 触发节点更新
            this.selectedNode.UpdateView();
        }
    }
    
    // 更新位置
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.UpdateView();
    }
    
    // 更新大小
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.UpdateView();
    }
    
    // 更新圆角
    setBorderRadius(radius) {
        this.borderRadius = radius;
        this.UpdateView();
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
        this.UpdateView();
    }
    
    // 更新圆角显示
    updateBorderRadius() {
        if (this.selectedNode) {
            const radius = this.selectedNode.borderRadius;
            const gridRadius = radius / gridSize;
            
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
}

// 创建菜单实例
let menuManager = new MenuManager();
