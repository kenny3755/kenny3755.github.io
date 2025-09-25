// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 현재 window 전체를 canvas로 사용
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.1, 0.2, 0.3, 1.0);
// Start rendering
render();

// Render loop
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);    
  gl.enable(gl.SCISSOR_TEST);

  const w = canvas.width;
  const h = canvas.height;
  const halfW = w / 2;
  const halfH = h / 2;

  // 왼쪽 위 (초록)
  gl.viewport(0, halfH, halfW, halfH);
  gl.scissor(0, halfH, halfW, halfH);
  gl.clearColor(0.0, 1.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 오른쪽 위 (빨강)
  gl.viewport(halfW, halfH, halfW, halfH);
  gl.scissor(halfW, halfH, halfW, halfH);
  gl.clearColor(1.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 왼쪽 아래 (파랑)
  gl.viewport(0, 0, halfW, halfH);
  gl.scissor(0, 0, halfW, halfH);
  gl.clearColor(0.0, 0.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 오른쪽 아래 (노랑)
  gl.viewport(halfW, 0, halfW, halfH);
  gl.scissor(halfW, 0, halfW, halfH);
  gl.clearColor(1.0, 1.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.disable(gl.SCISSOR_TEST);
};

function resizeCanvas() {
  const size = Math.min(window.innerWidth, window.innerHeight);
  canvas.width = size;
  canvas.height = size;

  canvas.style.width = size + "px";
  canvas.style.height = size + "px";

  render();
};

window.addEventListener("resize", resizeCanvas);

// ====== 시작 ======
resizeCanvas();
