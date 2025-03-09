import {drawGrid} from "./graph.js";

const canvases = {
  background: document.getElementById('background-layer'),
  storage: document.getElementById('storage-layer'),
  operate: document.getElementById('operate-layer')
};

const state = {
  gridNumberX: 400,
  gridNumberY: 300,
  gridSize: 20,
  scale: 1,
  lastscale: 1,
  canvases: canvases,
}

export default state;

const ctxs = {
  background: document.getElementById('background-layer').getContext('2d'),
  storage: document.getElementById('storage-layer').getContext('2d'),
  operate: document.getElementById('operate-layer').getContext('2d')
}

Object.values(canvases).forEach(element => {
  element.width = state.gridSize * state.gridNumberX;
  element.height = state.gridSize * state.gridNumberY;
  element.style.display = 'block';
});


//初始化事件
drawGrid(state.canvases.background);

// 状态栏功能
document.addEventListener('DOMContentLoaded', function() {
    const statusBar = document.getElementById('statusBar');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    
    // 工具按钮和对应的状态信息
    const toolsInfo = {
        'cursor': {
            icon: '<img src="css/鼠标.png" width="20px">',
            text: '选择工具 - 点击选择和编辑元素'
        },
        'renderTaskNode': {
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.9" y="4.9" width="18.2" height="14.2" rx="3.1" stroke="#4285f4" stroke-width="1.8"></rect></svg>',
            text: '任务节点工具 - 点击画布添加新任务节点'
        },
        'renderNodeEdge': {
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.7491 7.72104L11.525 7.72104L11.525 9.62563L18.7491 9.62563L15.6132 12.7615C15.5222 12.8494 15.4497 12.9545 15.3998 13.0706C15.3499 13.1868 15.3236 13.3118 15.3225 13.4382C15.3214 13.5647 15.3455 13.6901 15.3934 13.8071C15.4413 13.9241 15.512 14.0305 15.6014 14.1199C15.6908 14.2093 15.7971 14.28 15.9141 14.3279C16.0312 14.3758 16.1566 14.3999 16.283 14.3988C16.4095 14.3977 16.5344 14.3714 16.6506 14.3215C16.7668 14.2716 16.8719 14.199 16.9597 14.1081L21.7212 9.3466C21.8997 9.16802 22 8.92585 22 8.67333C22 8.42082 21.8997 8.17864 21.7212 8.00006L16.9597 3.2386C16.8719 3.14765 16.7668 3.0751 16.6506 3.02519C16.5344 2.97528 16.4095 2.94901 16.283 2.94791C16.1566 2.94681 16.0312 2.97091 15.9141 3.01879C15.7971 3.06667 15.6908 3.13738 15.6014 3.2268C15.512 3.31621 15.4413 3.42254 15.3934 3.53957C15.3455 3.6566 15.3214 3.782 15.3225 3.90844C15.3236 4.03489 15.3499 4.15985 15.3998 4.27603C15.4497 4.39221 15.5222 4.4973 15.6132 4.58514L18.7491 7.72104Z" fill="#4285f4"></path><path d="M11.5229 9.62454C10.997 9.62454 10.5706 10.0509 10.5706 10.5768V18.1952C10.5706 19.773 9.29156 21.052 7.71375 21.052H2.95229C2.42636 21.052 2 20.6257 2 20.0998C2 19.5738 2.42636 19.1475 2.95229 19.1475H7.71375C8.23969 19.1475 8.66605 18.7211 8.66605 18.1952V10.5768C8.66605 8.99902 9.94511 7.71996 11.5229 7.71996V9.62454Z" fill="#4285f4"></path></svg>',
            text: '条件连接线 - 连接两个节点，默认连续绘制'
        }
    };
    
    // 初始化状态栏
    updateStatus('default', '准备就绪', '<img src="css/版本信息提示.png" width="20px">');
    
    // 为工具按钮添加点击事件监听器
    document.getElementById('cursor').addEventListener('click', function() {
        updateStatus('cursor', toolsInfo.cursor.text, toolsInfo.cursor.icon);
    });
    
    document.getElementById('renderTaskNode').addEventListener('click', function() {
        updateStatus('renderTaskNode', toolsInfo.renderTaskNode.text, toolsInfo.renderTaskNode.icon);
    });
    
    document.getElementById('renderNodeEdge').addEventListener('click', function() {
        updateStatus('renderNodeEdge', toolsInfo.renderNodeEdge.text, toolsInfo.renderNodeEdge.icon);
    });
    
    // 帮助和信息按钮
    document.getElementById('help').addEventListener('click', function() {
        updateStatus('help', '帮助信息 - 查看使用指南', '<img src="css/帮助.png" width="20px">');
        // 这里可以添加显示帮助信息的代码
    });
    
    document.getElementById('info').addEventListener('click', function() {
        updateStatus('info', '版本信息 - 当前版本: 1.0', '<img src="css/版本信息提示.png" width="20px">');
        // 这里可以添加显示版本信息的代码
    });
    
    // 更新状态栏函数
    function updateStatus(tool, message, iconContent = '') {
        // 移除之前的类
        statusBar.className = 'status-bar';
        
        // 添加新类
        statusBar.classList.add('active');
        statusBar.classList.add('show');
        
        // 更新图标和文本
        if (iconContent) {
            statusIcon.innerHTML = iconContent;
        } else {
            statusIcon.innerHTML = '';
        }
        
        statusText.textContent = message;
        
        // 0.1秒后淡出
        setTimeout(() => {
            statusBar.classList.remove('active');
        }, 100);
        
    }
    
    // 在画布上操作时显示相应提示
    const canvasContainer = document.querySelector('.canvas-container');
    
    canvasContainer.addEventListener('mouseenter', function() {
        const activeTool = document.querySelector('.tools-item button.active');
        if (activeTool) {
            const toolId = activeTool.id;
            if (toolsInfo[toolId]) {
                updateStatus(toolId, toolsInfo[toolId].text, toolsInfo[toolId].icon);
            }
        }
    });
});


