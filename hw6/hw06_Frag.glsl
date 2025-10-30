#version 300 es
precision mediump float;

// 정점 셰이더에서 전달받은 텍스처 좌표
in vec2 v_texCoord;
// 텍스처 샘플러 유닛 (sunrise.jpg가 바인딩될 곳)
uniform sampler2D u_sampler;

out vec4 outColor;

void main() {
    // 텍스처에서 v_texCoord 위치의 색상을 읽어와 픽셀 색상으로 출력
    outColor = texture(u_sampler, v_texCoord);
}