import * as THREE from 'three';

async function init() {
    const canvas = document.querySelector('#planet-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Load Shaders
    const vertexShader = await fetch('./shaders/vertex.glsl').then(res => res.text());
    const fragmentShader = await fetch('./shaders/fragment.glsl').then(res => res.text());

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
        uEarthColor: await loadTexture('./assets/2k_earth_color.jpeg'),
        uEarthNight: await loadTexture('./assets/2k_earth_night.jpeg'),
        uEarthClouds: await loadTexture('./assets/2k_earth_clouds.jpeg'),
        uEarthSpecular: await loadTexture('./assets/2k_earth_specular.jpeg'),
        uEarthBump: await loadTexture('./assets/2k_earth_bump.jpg'),
        uStars: await loadTexture('./assets/8k_stars.jpg'),
    };

    // Set specific texture options to match original code
    textures.uEarthNight.minFilter = THREE.NearestMipmapLinearFilter;

    // Uniforms
    const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uQuality: { value: window.devicePixelRatio },
        sunDirectionXY: { value: new THREE.Vector2(1.0, 1.0) }, // Default sun direction

        // Planet Settings (matching earth.astro defaults)
        uPlanetPosition: { value: new THREE.Vector3(0, 0, 0) },
        uPlanetRadius: { value: 2.0 }, // Radius relative to view
        uCloudsDensity: { value: 0.3 },
        uAtmosphereColor: { value: new THREE.Vector3(0.3, 0.6, 1.0) },
        uAtmosphereDensity: { value: 0.2 },
        uSunIntensity: { value: 1.0 },
        uAmbientLight: { value: 0.02 },
        uRotationOffset: { value: 0.0 }, // Can be used to rotate planet initially

        // Textures
        ...Object.fromEntries(Object.entries(textures).map(([key, tex]) => [key, { value: tex }])),

        // Additional uniforms expected by shader matching original defaults
        uCloudsScale: { value: 1.0 },
        uCloudsSpeed: { value: 1.0 },
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
        time += 0.005; // Adjust rotation speed
        uniforms.uTime.value = time;
        renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(pixelRatio);
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        uniforms.uQuality.value = pixelRatio;
    });

    // Mouse Interaction (Simple Rotation for now)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            // Update rotation offset based on mouse movement
            // Adding separate uniform for manual rotation if script allows, 
            // or just modifying uRotationOffset
            uniforms.uRotationOffset.value += deltaX * 0.005;

            // For sun direction (vertical movement)
            // uniforms.sunDirectionXY.value.y -= deltaY * 0.005; // Optional

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });
}

init().catch(console.error);
