#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;  
in vec3 normal;  
in vec2 texCoord;

struct Material {
    vec3 diffuse;
    vec3 specular;
    float shininess;
};

struct Light {
    vec3 direction;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform int u_toonLevels;

void main() {
    vec3 rgb = material.diffuse;
    vec3 ambient = light.ambient * rgb;
  	
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);

    float N = float(u_toonLevels);
    diff = floor(diff * N) / N;

    vec3 diffuse = light.diffuse * diff * rgb;
    
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = 0.0;
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    }

    spec = floor(spec * N) / N;
    
    vec3 specular = light.specular * spec * material.specular;
        
    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}