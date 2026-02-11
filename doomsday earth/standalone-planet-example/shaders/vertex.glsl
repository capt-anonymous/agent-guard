#version 300 es

precision highp float;

in vec3 position;
uniform vec2 uResolution;
uniform vec2 sunDirectionXY;
uniform float uQuality;

out vec3 uSunDirection;
out vec2 uv;

void main() {
   vec2 resolution = uResolution * uQuality;
   // Three.js PlaneGeometry(2,2) gives position in range [-1, 1]
   // Original code expected [0, 1] and subtracted 0.5.
   // So [-1, 1] * 0.5 gives [-0.5, 0.5] which matches the logic.
   uv = (position.xy * 0.5) * resolution / min(resolution.y, resolution.x);
   uSunDirection = normalize(vec3(sunDirectionXY, 0.));

   gl_Position = vec4(position, 1.0);
}