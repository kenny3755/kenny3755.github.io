#version 300 es
precision mediump float;

// 정점 위치 (location = 0)
layout (location = 0) in vec3 a_position;
// 텍스처 좌표 (location = 1)
layout (location = 1) in vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

// 프래그먼트 셰이더로 텍스처 좌표 전달
out vec2 v_texCoord;

void main() {
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    // 텍스처 좌표를 그대로 전달
    v_texCoord = a_texCoord;
}