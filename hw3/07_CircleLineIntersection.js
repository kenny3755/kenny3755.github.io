import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao, positionBuffer;

let isInitialized = false;
let axes = new Axes(gl, 0.85);

let circle = null;       // [cx, cy, r]
let tempCircle = null;   // dragging 중일 때 반지름 임시 표시
let line = null;         // [x0, y0, x1, y1]
let tempLine = null;
let intersections = [];

let textOverlay1, textOverlay2, textOverlay3;

let stage = 0; // 0: circle 입력, 1: line 입력, 2: 완료
let isDrawing = false;
let startPoint = null;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    main().then(success => { isInitialized = success; });
});

function initWebGL() {
    if (!gl) return false;
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const [glX, glY] = convertToWebGLCoordinates(event.clientX - rect.left, event.clientY - rect.top);
        startPoint = [glX, glY];
        isDrawing = true;
    }

    function handleMouseMove(event) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const [glX, glY] = convertToWebGLCoordinates(event.clientX - rect.left, event.clientY - rect.top);

        if (stage === 0) {
            let dx = glX - startPoint[0];
            let dy = glY - startPoint[1];
            let r = Math.sqrt(dx * dx + dy * dy);
            tempCircle = [startPoint[0], startPoint[1], r];
        } else if (stage === 1) {
            tempLine = [startPoint[0], startPoint[1], glX, glY];
        }
        render();
    }

    function handleMouseUp(event) {
        if (!isDrawing) return;
        isDrawing = false;

        if (stage === 0 && tempCircle) {
            circle = tempCircle;
            updateText(textOverlay1, `Circle: center=(${circle[0].toFixed(2)}, ${circle[1].toFixed(2)}), r=${circle[2].toFixed(2)}`);
            stage = 1;
        } else if (stage === 1 && tempLine) {
            line = tempLine;
            updateText(textOverlay2, `Line: (${line[0].toFixed(2)}, ${line[1].toFixed(2)}) ~ (${line[2].toFixed(2)}, ${line[3].toFixed(2)})`);
            computeIntersections();
            stage = 2;
        }
        tempCircle = null;
        tempLine = null;
        render();
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function computeIntersections() {
    intersections = [];
    if (!circle || !line) return;

    let [cx, cy, r] = circle;
    let [x0, y0, x1, y1] = line;
    let dx = x1 - x0, dy = y1 - y0;

    let a = dx * dx + dy * dy;
    let b = 2 * (dx * (x0 - cx) + dy * (y0 - cy));
    let c = (x0 - cx) * (x0 - cx) + (y0 - cy) * (y0 - cy) - r * r;

    let disc = b * b - 4 * a * c;
    if (disc < 0) {
        updateText(textOverlay3, "Intersection: none");
        return;
    }
    let sqrtD = Math.sqrt(disc);
    let t1 = (-b - sqrtD) / (2 * a);
    let t2 = (-b + sqrtD) / (2 * a);

    let pts = [];
    if (0 <= t1 && t1 <= 1) pts.push([x0 + t1 * dx, y0 + t1 * dy]);
    if (0 <= t2 && t2 <= 1 && disc > 0) pts.push([x0 + t2 * dx, y0 + t2 * dy]);

    intersections = pts;
    updateText(textOverlay3, `Intersection: count=${pts.length} ${pts.map(p => `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})`).join(" ")}`);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    shader.use();

    // Circle
    if (circle || tempCircle) {
        let [cx, cy, r] = circle ? circle : tempCircle;
        let vertices = [];
        let N = 100;
        for (let i = 0; i <= N; i++) {
            let theta = (2 * Math.PI * i) / N;
            vertices.push(cx + r * Math.cos(theta));
            vertices.push(cy + r * Math.sin(theta));
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        shader.setVec4("u_color", [0.0, 0.6, 1.0, 1.0]);
        gl.drawArrays(gl.LINE_STRIP, 0, N + 1);
    }

    // Line
    if (line || tempLine) {
        let L = line ? line : tempLine;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(L), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // Intersection points
    if (intersections.length > 0) {
        let pts = [];
        intersections.forEach(p => { pts.push(p[0], p[1]); });
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        gl.drawArrays(gl.POINTS, 0, intersections.length);
    }

    axes.draw(mat4.create(), mat4.create());
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    if (!initWebGL()) return false;
    await initShader();
    setupBuffers();
    shader.use();

    textOverlay1 = setupText(canvas, "No circle", 1);
    textOverlay2 = setupText(canvas, "Draw a line after circle", 2);
    textOverlay3 = setupText(canvas, "Intersection info", 3);

    setupMouseEvents();
    render();
    return true;
}
