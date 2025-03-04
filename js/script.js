const canvases = {
  background: document.getElementById('background-layer'),
  storage: document.getElementById('storage-layer'),
  operate: document.getElementById('operate-layer')
};

const ctxs = {
  background: document.getElementById('background-layer').getContext('2d'),
  storage: document.getElementById('storage-layer').getContext('2d'),
  operate: document.getElementById('operate-layer').getContext('2d')
}

let gridNumberX = 400;
let gridNumberY = 300;

// 设置 canvas 大小为窗口大小
Object.values(canvases).forEach(element => {
  element.width = gridSize * gridNumberX;
  element.height = gridSize * gridNumberY;
  element.style.display = 'block';
});

const img = new Image();
img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2.9" y="4.9" width="18.2" height="14.2" rx="3.1" stroke="currentColor" stroke-width="0.2"/>
  </svg>
  `);


drawGrid(canvases.background);


Manager = new ObjectManager();




