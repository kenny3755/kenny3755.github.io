import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { SquarePyramid } from './squarePyramid_hw06.js'; 

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader; 
let pyramidTexture; 

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();

let isDragging = false;
let lastMouseX = -1;
let lastMouseY = -1;
let currentRotation = mat4.create(); 
let cameraDistance = 5.0;          

const pyramid = new SquarePyramid(gl);

const axes = new Axes(gl, 1.8);

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

    canvas.width = 700;
    canvas.height = 700;

    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.15, 0.2, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('hw06_Vert.glsl');
    const fragmentShaderSource = await readShaderFile('hw06_Frag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function loadTexture(url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

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

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.src = url;

    return texture;
}


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

    const rotY = mat4.fromYRotation(mat4.create(), glMatrix.toRadian(deltaX * 0.5));
    const rotX = mat4.fromXRotation(mat4.create(), glMatrix.toRadian(deltaY * 0.5));

    const rotationDelta = mat4.multiply(mat4.create(), rotY, rotX);

    mat4.multiply(currentRotation, rotationDelta, currentRotation);

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseWheel(event) {
    event.preventDefault(); 
    cameraDistance += event.deltaY * 0.01; 
    cameraDistance = Math.max(1.5, Math.min(20.0, cameraDistance));
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    mat4.copy(modelMatrix, currentRotation);

    mat4.lookAt(viewMatrix,
        vec3.fromValues(0, 0.5, cameraDistance),
        vec3.fromValues(0, 0.5, 0), 
        vec3.fromValues(0, 1, 0)  
    );

    shader.use();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pyramidTexture);
    shader.setInt('u_sampler', 0); 

    shader.setMat4('u_model', modelMatrix); 
    shader.setMat4('u_view', viewMatrix); 
    shader.setMat4('u_projection', projMatrix);
    pyramid.draw(shader);

    let viewForAxes = mat4.create();
    mat4.multiply(viewForAxes, viewMatrix, modelMatrix);

    axes.draw(viewForAxes, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        await initShader();

        pyramidTexture = loadTexture('sunrise.jpg');

        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60), 
            canvas.width / canvas.height, 
            0.1, 
            100.0
        );

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('wheel', handleMouseWheel);

        requestAnimationFrame(render); 

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}
