// 添加滑动条渐变效果
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
    }
    
    // 更新选中的节点
    setNode(node) {
        
        this.selectedNode = node;
        if (node) {
            this.updateFromNode(node);
        }
        this.updateColorPickers();
    }
    
    // 从节点更新菜单数据
    updateFromNode(node) {
        // 位置
        this.x = node.x;
        this.y = node.y;
        
        // 大小
        this.width = node.width;
        this.height = node.height;
        
        // 样式
        this.borderRadius = node.borderRadius;
        this.borderWidth = node.borderWidth;
        this.borderColor = node.borderColor;
        this.borderOpacity = node.borderOpacity;
        this.color = node.color;
        this.fillOpacity = node.fillOpacity;
        
        // 文本
        this.text = node.text;
        this.textColor = node.textColor;
        this.fontSize = node.fontSize;
        this.fontFamily = node.fontFamily;
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
            this.selectedNode.text = this.text;
            this.selectedNode.textColor = this.textColor;
            this.selectedNode.fontSize = this.fontSize;
            this.selectedNode.fontFamily = this.fontFamily;
            
            // 触发节点更新
            this.selectedNode.update();
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
        if (color !== undefined) this.textColor = color;
        if (size !== undefined) this.fontSize = size;
        if (family !== undefined) this.fontFamily = family;
        this.UpdateView();
    }
}

// 创建菜单实例
let menuManager = new MenuManager();
