/*-------------------------------------------------------------------------
hw2.js
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;   // shader program
let vao;      // vertex array object
let offsetX = 0.0;  // Rectangle position offset
let offsetY = 0.0;
const MOVE_STEP = 0.01;  // Movement step
const RECT_SIZE = 0.2;   // Rectangle size (half width/height)

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 600;
    canvas.height = 600;

    resizeAspectRatio(gl, canvas);

    // Initialize WebGL settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Black background
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('./shVert.glsl');
    const fragmentShaderSource = await readShaderFile('./shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        const halfSize = RECT_SIZE / 2;
        
        switch(event.key) {
            case 'ArrowUp':
                // Check boundary: top edge
                if (offsetY + halfSize + MOVE_STEP <= 1.0) {
                    offsetY += MOVE_STEP;
                }
                break;
            case 'ArrowDown':
                // Check boundary: bottom edge  
                if (offsetY - halfSize - MOVE_STEP >= -1.0) {
                    offsetY -= MOVE_STEP;
                }
                break;
            case 'ArrowLeft':
                // Check boundary: left edge
                if (offsetX - halfSize - MOVE_STEP >= -1.0) {
                    offsetX -= MOVE_STEP;
                }
                break;
            case 'ArrowRight':
                // Check boundary: right edge
                if (offsetX + halfSize + MOVE_STEP <= 1.0) {
                    offsetX += MOVE_STEP;
                }
                break;
        }
    });
}

function setupBuffers() {
    const halfSize = RECT_SIZE / 2;
    
    // Rectangle vertices using TRIANGLE_FAN (without center vertex)
    // Start from one corner and go around the rectangle
    const vertices = new Float32Array([
        -halfSize, -halfSize, 0.0,  // Bottom left (fan center)
         halfSize, -halfSize, 0.0,  // Bottom right  
         halfSize,  halfSize, 0.0,  // Top right
        -halfSize,  halfSize, 0.0   // Top left
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    shader.setVec2("uOffset", [offsetX, offsetY]);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    requestAnimationFrame(render);
}

async function main() {
    try {

        // WebGL 초기화
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        // 셰이더 초기화
        await initShader();

        // setup text overlay (see util.js)
        setupText(canvas, "Use arrow keys to move the rectangle", 1);

        // 키보드 이벤트 설정
        setupKeyboardEvents();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();
        
        // 렌더링 시작
        render();

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

// call main function
main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});