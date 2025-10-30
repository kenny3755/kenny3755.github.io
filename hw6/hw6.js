/*-------------------------------------------------------------------------
hw6.js - Arcball Texture Pyramid

- 'sunrise.jpg' 텍스처가 매핑된 사각뿔을 렌더링합니다.
- 마우스 기반 아크볼 컨트롤(회전, 줌) 기능을 구현합니다.
- 피라미드(Model) 회전 시, 축(Axes)도 동일하게 회전합니다.
---------------------------------------------------------------------------*/

// 유틸리티 파일들은 ../util 폴더에 있다고 가정합니다.
import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
// HW06 요구사항 10: squarePyramid.js는 Homework06 폴더 안에 둡니다.
import { SquarePyramid } from './squarePyramid_hw06.js'; 

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader; // 텍스처 셰이더
let pyramidTexture; // sunrise.jpg 텍스처 객체

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();

// --- 아크볼 컨트롤 변수 ---
let isDragging = false;
let lastMouseX = -1;
let lastMouseY = -1;
let currentRotation = mat4.create(); // 모델의 현재 회전 (Model Matrix로 사용)
let cameraDistance = 5.0;            // 카메라 줌 거리

// 사각뿔 객체 생성 (HW06 버전 클래스 사용)
const pyramid = new SquarePyramid(gl);
// 좌표축 객체
const axes = new Axes(gl, 1.8);

// DOM 로드 완료 시 main 함수 실행
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    main().then(success => {
        if (!success) console.log('program terminated');
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    // 요구사항 1: canvas 크기 700x700
    canvas.width = 700;
    canvas.height = 700;

    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // 배경색을 어둡게 변경 (텍스처가 잘 보이도록)
    gl.clearColor(0.1, 0.15, 0.2, 1.0);
    
    return true;
}

/**
 * HW06용 텍스처 셰이더를 로드합니다.
 */
async function initShader() {
    const vertexShaderSource = await readShaderFile('hw06_Vert.glsl');
    const fragmentShaderSource = await readShaderFile('hw06_Frag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

/**
 * 'sunrise.jpg' 텍스처를 로드하는 함수
 * @param {string} url 텍스처 이미지 파일 경로
 */
function loadTexture(url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 임시 1x1 파란색 픽셀 (이미지 로딩 전 표시)
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // Blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                      srcFormat, srcType, image);
        
        // 텍스처 필터링 및 래핑 설정
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.src = url;

    return texture;
}

// --- 마우스 이벤트 핸들러 (아크볼) ---

function handleMouseDown(event) {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    isDragging = false;
}

function handleMouseMove(event) {
    if (!isDragging) return;

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    // Y축 기준 회전 (좌우)
    const rotY = mat4.fromYRotation(mat4.create(), glMatrix.toRadian(deltaX * 0.5));
    // X축 기준 회전 (상하)
    const rotX = mat4.fromXRotation(mat4.create(), glMatrix.toRadian(deltaY * 0.5));

    // 두 회전을 결합 (새 회전 = Y * X)
    const rotationDelta = mat4.multiply(mat4.create(), rotY, rotX);
    
    // 현재 회전에 새 회전을 누적 (전역 회전 = 새 회전 * 이전 회전)
    mat4.multiply(currentRotation, rotationDelta, currentRotation);

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseWheel(event) {
    event.preventDefault(); // 페이지 스크롤 방지
    cameraDistance += event.deltaY * 0.01; // 휠 민감도
    cameraDistance = Math.max(1.5, Math.min(20.0, cameraDistance)); // 줌 범위 제한
}

// --- 렌더링 (요구사항 반영 수정된 부분) ---

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // 1. Model Matrix: 아크볼 회전 적용
    mat4.copy(modelMatrix, currentRotation);

    // 2. View Matrix: 아크볼 줌(cameraDistance) 적용
    mat4.lookAt(viewMatrix,
        vec3.fromValues(0, 0.5, cameraDistance), // 카메라 위치 (높이 0.5에서)
        vec3.fromValues(0, 0.5, 0), // 피라미드 중심(높이 0.5)을 바라봄
        vec3.fromValues(0, 1, 0)  // Up vector
    );

    // 3. 사각뿔 그리기
    shader.use();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pyramidTexture);
    shader.setInt('u_sampler', 0); // 셰이더의 u_sampler에 0번 텍스처 유닛 전달

    shader.setMat4('u_model', modelMatrix); // 회전 O
    shader.setMat4('u_view', viewMatrix);   // 회전 X (줌만)
    shader.setMat4('u_projection', projMatrix);
    pyramid.draw(shader);

    // --- [수정된 부분] ---
    // 4. 축(Axes)을 위한 View Matrix 계산
    //    axes.draw()는 modelMatrix를 받지 못하므로,
    //    View Matrix에 Model (회전)을 미리 곱해서 전달합니다.
    //    (새로운 View = View * Model)
    let viewForAxes = mat4.create();
    mat4.multiply(viewForAxes, viewMatrix, modelMatrix);

    // 5. 좌표축 그리기
    //    회전이 "미리 곱해진" viewForAxes를 전달
    axes.draw(viewForAxes, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        await initShader(); // HW06 셰이더 로드

        // 텍스처 로드
        pyramidTexture = loadTexture('sunrise.jpg');

        // Projection Matrix 설정 (HW05와 동일)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // fov
            canvas.width / canvas.height, // aspect
            0.1, // near
            100.0 // far
        );

        // 마우스 이벤트 리스너 등록
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('wheel', handleMouseWheel);

        requestAnimationFrame(render); // 렌더링 루프 시작

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}