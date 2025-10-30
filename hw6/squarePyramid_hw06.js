export class SquarePyramid {
    constructor(gl) {
        this.gl = gl;
        this.numIndices = 0;
        this.vao = null;
        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        const halfSize = 0.5;
        const height = 1.0;

        const vertices = new Float32Array([
            -halfSize, 0.0, halfSize, 0.0, 1.0,
            halfSize, 0.0, halfSize, 1.0, 1.0,
            halfSize, 0.0, -halfSize, 1.0, 0.0,
            -halfSize, 0.0, -halfSize, 0.0, 0.0,
            -halfSize, 0.0, halfSize, 0.0, 0.0,
            0.0, height, 0.0, 0.125, 1.0,
            halfSize, 0.0, halfSize, 0.25, 0.0,
            halfSize, 0.0, halfSize, 0.25, 0.0,
            0.0, height, 0.0, 0.375, 1.0,
            halfSize, 0.0, -halfSize, 0.5, 0.0,
            halfSize, 0.0, -halfSize, 0.5, 0.0,
            0.0, height, 0.0, 0.625, 1.0,
            -halfSize, 0.0, -halfSize, 0.75, 0.0,
            -halfSize, 0.0, -halfSize, 0.75, 0.0,
            0.0, height, 0.0, 0.875, 1.0,
            -halfSize, 0.0, halfSize, 1.0, 0.0,
        ]);

        const indices = new Uint16Array([
            0, 1, 2, 0, 2, 3,
            4, 5, 6,
            7, 8, 9,
            10, 11, 12,
            13, 14, 15,
        ]);
        
        this.numIndices = indices.length;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const stride = 5 * Float32Array.BYTES_PER_ELEMENT; 
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(0);

        const texCoordOffset = 3 * Float32Array.BYTES_PER_ELEMENT;
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, texCoordOffset);
        gl.enableVertexAttribArray(1);
        
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0); 
        gl.bindVertexArray(null);
    }
}
