#version 300 es
precision mediump float;

in vec2 v_texCoord;

uniform sampler2D u_sampler;

out vec4 outColor;

void main() {
    outColor = texture(u_sampler, vec2(v_texCoord.x, 1.0 - v_texCoord.y));
}
