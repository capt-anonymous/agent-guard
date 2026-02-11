import * as THREE from 'three';

export async function init(containerId = 'earth-container') {
  // creating canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'planet-canvas';

  const container = document.getElementById(containerId) || document.body;
  container.appendChild(canvas);

  // Use container dimensions if available, else window
  const width = container === document.body ? window.innerWidth : container.clientWidth;
  const height = container === document.body ? window.innerHeight : container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(width, height);

  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Check for file protocol
  if (window.location.protocol === 'file:') {
    alert('Three.js requires a local server to load assets (textures/shaders).\nPlease run "npx http-server" or "python3 -m http.server" in this directory.');
  }

  // Inline Shaders to avoid fetch errors
  const vertexShader = `
uniform vec2 uResolution;
uniform vec2 sunDirectionXY;
uniform float uQuality;

out vec3 vSunDirection;
out vec2 vUv;

void main() {
   // Three.js prepends: in vec3 position; in vec2 uv;
   // We use the built-in 'uv' from Three.js
   vec2 resolution = uResolution * uQuality;
   
   // Calculate our own UV for the quad based on position
   // Three.js PlaneGeometry(2,2) -> position.xy is [-1, 1]
   vUv = (position.xy * 0.5) * resolution / min(resolution.y, resolution.x);
   
   vSunDirection = normalize(vec3(sunDirectionXY, 0.));
   gl_Position = vec4(position, 1.0);
}`;

  const fragmentShader = `
precision highp float;
precision mediump int;
precision mediump sampler3D;
precision mediump sampler2D;

in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform float uRotationOffset;
uniform vec2 uResolution;
uniform sampler2D uEarthColor;
uniform sampler2D uEarthClouds;
uniform sampler2D uEarthSpecular;
uniform sampler2D uEarthBump;
uniform sampler2D uEarthNight;
uniform sampler2D uStars;

uniform vec3 uPlanetPosition;
uniform float uPlanetRadius;
uniform float uCloudsDensity;
uniform vec3 uAtmosphereColor;
uniform float uAtmosphereDensity;
uniform float uSunIntensity;
uniform float uAmbientLight;
in vec3 vSunDirection;

#define ROTATION_SPEED .1
#define PLANET_ROTATION rotateY(uTime * ROTATION_SPEED + uRotationOffset)
#define CLOUD_COLOR vec3(1., 1., 1.)
#define SUN_COLOR vec3(1.0, 1.0, 0.9)
#define DEEP_SPACE vec3(0., 0., 0.0005)
#define INFINITY 1e10
#define CAMERA_POSITION vec3(0., 0., 6.0)
#define FOCAL_LENGTH CAMERA_POSITION.z / (CAMERA_POSITION.z - uPlanetPosition.z)
#define PI acos(-1.)

struct Material {
  vec3 color;
  float diffuse;
  float specular;
  vec3 emission;
};

struct Hit {
  float len;
  vec3 normal;
  Material material;
};

struct Sphere {
  vec3 position;
  float radius;
};

Hit miss = Hit(INFINITY, vec3(0.), Material(vec3(0.), -1., -1., vec3(-1.)));

Sphere getPlanet() {
  return Sphere(uPlanetPosition, uPlanetRadius);
}

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

vec2 sphereProjection(vec3 p, vec3 origin) {
  vec3 dir = normalize(p - origin);
  float longitude = atan(dir.x, dir.z);
  float latitude = asin(dir.y);
  return vec2((longitude + PI) / (2. * PI), (latitude + PI / 2.) / PI);
}

float sphIntersect(in vec3 ro, in vec3 rd, in Sphere sphere) {
  vec3 oc = ro - sphere.position;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - sphere.radius * sphere.radius;
  float h = b * b - c;
  if(h < 0.0) return -1.;
  return -b - sqrt(h);
}

mat3 rotateY(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(vec3(c, 0, s), vec3(0, 1, 0), vec3(-s, 0, c));
}

vec3 simpleReinhardToneMapping(vec3 color) {
  float exposure = 1.5;
  color *= exposure / (1. + color / exposure);
  color = pow(color, vec3(1. / 2.4));
  return color;
}

float planetNoise(vec3 p) {
  vec2 textureCoord = sphereProjection(p, uPlanetPosition);
  float bump = texture(uEarthBump, textureCoord).r;
  float cloudsDensity = texture(uEarthClouds, textureCoord).r;
  return .01 * mix(bump, max(bump, smoothstep(-.5, 2., cloudsDensity)), uCloudsDensity);
}

float planetDist(in vec3 ro, in vec3 rd) {
  float smoothSphereDist = sphIntersect(ro, rd, getPlanet());
  vec3 intersection = ro + smoothSphereDist * rd;
  vec3 intersectionWithRotation = PLANET_ROTATION * (intersection - uPlanetPosition) + uPlanetPosition;
  return sphIntersect(ro, rd, Sphere(uPlanetPosition, uPlanetRadius + planetNoise(intersectionWithRotation)));
}

vec3 planetNormal(vec3 p) {
  vec3 rd = uPlanetPosition - p;
  float dist = planetDist(p, rd);
  vec2 e = vec2(max(.01, .03 * smoothstep(1300., 300., uResolution.x)), 0);
  vec3 normal = dist - vec3(planetDist(p - e.xyy, rd), planetDist(p - e.yxy, rd), planetDist(p + e.yyx, rd));
  return normalize(normal);
}

vec3 spaceColor(vec3 direction) {
  vec3 backgroundCoord = direction * rotateY(uTime * ROTATION_SPEED / 3. + 1.5);
  vec2 textureCoord = sphereProjection(backgroundCoord, vec3(0.));
  textureCoord.x = 1. - textureCoord.x;
  vec3 stars = texture(uStars, textureCoord).rgb;
  return DEEP_SPACE + stars * stars * stars * .5;
}

vec3 atmosphereColor(vec3 ro, vec3 rd, float spaceMask) {
  float distCameraToPlanetOrigin = length(uPlanetPosition - CAMERA_POSITION);
  float distCameraToPlanetEdge = sqrt(distCameraToPlanetOrigin * distCameraToPlanetOrigin - uPlanetRadius * uPlanetRadius);
  float planetMask = 1.0 - spaceMask;
  vec3 coordFromCenter = (ro + rd * distCameraToPlanetEdge) - uPlanetPosition;
  float distFromEdge = abs(length(coordFromCenter) - uPlanetRadius);
  float planetEdge = max(uPlanetRadius - distFromEdge, 0.) / uPlanetRadius;
  float atmosphereMask = pow(remap(dot(vSunDirection, coordFromCenter), -uPlanetRadius, uPlanetRadius / 2., 0., 1.), 5.);
  atmosphereMask *= uAtmosphereDensity * uPlanetRadius * uSunIntensity;
  vec3 atmosphere = vec3(pow(planetEdge, 120.)) * .5;
  atmosphere += pow(planetEdge, 50.) * .3 * (1.5 - planetMask);
  atmosphere += pow(planetEdge, 15.) * .015;
  atmosphere += pow(planetEdge, 5.) * .04 * planetMask;
  return atmosphere * uAtmosphereColor * atmosphereMask;
}

Hit intersectPlanet(vec3 ro, vec3 rd) {
  float len = sphIntersect(ro, rd, getPlanet());
  if(len < 0.) return miss;
  vec3 position = ro + len * rd;
  vec3 rotatedPosition = PLANET_ROTATION * (position - uPlanetPosition) + uPlanetPosition;
  vec2 textureCoord = sphereProjection(rotatedPosition, uPlanetPosition);
  vec3 color = texture(uEarthColor, textureCoord).rgb;
  vec3 normal = planetNormal(position);
  float specular = texture(uEarthSpecular, textureCoord).r;
  float nightLightIntensity = clamp(dot(-normal, vSunDirection) + .1, smoothstep(1., 0., pow((uSunIntensity + uAmbientLight), .3)), 1.);
  vec3 nightColor = pow(texture(uEarthNight, textureCoord).r, 3.) * vec3(1., .8, .6);
  nightColor *= nightLightIntensity;
  float cloudsDensity = texture(uEarthClouds, textureCoord).r;
  float cloudsThreshold = 1. - uCloudsDensity;
  float smoothness = uCloudsDensity * (1. - uCloudsDensity);
  cloudsDensity *= smoothstep(cloudsThreshold - smoothness, cloudsThreshold, cloudsDensity);
  color = mix(color, CLOUD_COLOR, cloudsDensity);
  return Hit(len, normal, Material(color, 1., specular, nightColor));
}

Hit intersectScene(vec3 ro, vec3 rd) {
  return intersectPlanet(ro, rd);
}

vec3 radiance(vec3 ro, vec3 rd) {
  vec3 color = vec3(0.);
  float spaceMask = 1.;
  Hit hit = intersectScene(ro, rd);
  if(hit.len < INFINITY) {
    spaceMask = 0.;
    float directLightIntensity = pow(clamp(dot(hit.normal, vSunDirection), 0.0, 1.0), 2.) * uSunIntensity;
    vec3 diffuseLight = directLightIntensity * SUN_COLOR;
    vec3 diffuseColor = hit.material.color.rgb * (uAmbientLight + diffuseLight);
    vec3 reflected = normalize(reflect(-vSunDirection, hit.normal));
    vec3 phongRd = normalize(vec3(vUv * pow(FOCAL_LENGTH, -1.), -1.));
    float phongValue = pow(max(0.0, dot(phongRd, reflected)), 8.) * .2 * uSunIntensity;
    vec3 specularColor = hit.material.specular * vec3(phongValue);
    color = diffuseColor + specularColor + hit.material.emission;
  } else {
    float zoomFactor = min(uResolution.x / uResolution.y, 1.);
    vec3 backgroundRd = normalize(vec3(vUv * zoomFactor, -1.));
    color = spaceColor(backgroundRd); 
  }
  return color + atmosphereColor(ro, rd, spaceMask);
}

void main() {
  vec3 ro = vec3(CAMERA_POSITION);
  vec3 rd = normalize(vec3(vUv * FOCAL_LENGTH, -1.));
  vec3 color = radiance(ro, rd);
  color = simpleReinhardToneMapping(color);
  color *= 1. - 0.5 * pow(length(vUv), 3.);
  fragColor = vec4(color, 1.0);
}`;

  // Load Textures
  const textureLoader = new THREE.TextureLoader();

  // Helper to load texture with promise
  const loadTexture = (path) => {
    return new Promise((resolve) => {
      textureLoader.load(path, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        resolve(texture);
      });
    });
  };

  // Textures loaded from local assets folder
  const textures = {
    uEarthColor: await loadTexture(new URL('./assets/2k_earth_color.jpeg', import.meta.url).href),
    uEarthNight: await loadTexture(new URL('./assets/2k_earth_night.jpeg', import.meta.url).href),
    uEarthClouds: await loadTexture(new URL('./assets/2k_earth_clouds.jpeg', import.meta.url).href),
    uEarthSpecular: await loadTexture(new URL('./assets/2k_earth_specular.jpeg', import.meta.url).href),
    uEarthBump: await loadTexture(new URL('./assets/2k_earth_bump.jpg', import.meta.url).href),
    uStars: await loadTexture(new URL('./assets/8k_stars.jpg', import.meta.url).href),
  };

  // Set specific texture options
  textures.uEarthNight.minFilter = THREE.NearestMipmapLinearFilter;

  // Uniforms
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(width, height) },
    uQuality: { value: pixelRatio },
    sunDirectionXY: { value: new THREE.Vector2(1.0, 1.0) },

    // Planet Settings (Red Earth Configuration)
    uPlanetPosition: { value: new THREE.Vector3(0, 0, 0) },
    uPlanetRadius: { value: 2.0 },
    uCloudsDensity: { value: 0.3 },
    uAtmosphereColor: { value: new THREE.Vector3(1.0, 0.2, 0.1) }, // Red atmosphere for Doomsday look
    uAtmosphereDensity: { value: 0.4 }, // Increased density for more dramatic look
    uSunIntensity: { value: 1.2 },
    uAmbientLight: { value: 0.05 },
    uRotationOffset: { value: 0.0 },

    // Textures
    ...Object.fromEntries(Object.entries(textures).map(([key, tex]) => [key, { value: tex }])),

    uCloudsScale: { value: 1.0 },
    uCloudsSpeed: { value: 0.5 }, // Slower clouds
  };

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    glslVersion: THREE.GLSL3
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Animation Loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;
    uniforms.uTime.value = time;
    renderer.render(scene, camera);
  }
  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    const width = container === document.body ? window.innerWidth : container.clientWidth;
    const height = container === document.body ? window.innerHeight : container.clientHeight;

    renderer.setSize(width, height);
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    uniforms.uResolution.value.set(width, height);
    uniforms.uQuality.value = pixelRatio;
  });

  // Mouse Interaction
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', (e) => {
    isDragging = false;
    canvas.style.cursor = 'grab';
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      uniforms.uRotationOffset.value += deltaX * 0.005;
      // uniforms.sunDirectionXY.value.y -= deltaY * 0.005; // Optional sun movement

      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });
}

// Auto-initialize if not imported as a module (approximate check, or just rely on manual init in new pages)
// For backward compatibility with existing index.html, we'll need to update index.html to call imports.
// init().catch(console.error);
