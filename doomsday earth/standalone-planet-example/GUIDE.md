# Interactive Planet Integration Guide

This directory contains a standalone version of the Interactive Planet that can be dropped into any HTML website.

## Files Overview
- `index.html`: A minimal example showing how to mount the planet.
- `main.js`: The core logic that initializes the WebGL scene using Three.js.
- `shaders/`: Contains the Vertex and Fragment shaders required for the rendering.
- `assets/`: Contains the texture files (Earth, Clouds, Stars, etc.).

## How to Integrate
1. **Copy Files**: Copy the `shaders/`, `assets/`, and `main.js` into your website's project directory.
2. **Add Dependencies**: Ensure you include Three.js in your project. You can use a CDN link in your HTML head or body:
   ```html
   <script type="importmap">
       {
           "imports": {
               "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
           }
       }
   </script>
   ```
3. **Add Canvas**: Add a canvas element to your HTML where you want the planet to appear.
   ```html
   <canvas id="planet-canvas"></canvas>
   ```
4. **Initialize**: Import `main.js` as a module.
   ```html
   <script type="module" src="./path/to/main.js"></script>
   ```

## Customization
- **Textures**: You can replace items in `assets/` with other planet textures to change the look (e.g., Mars, Moon).
- **Settings**: Open `main.js` and tweak the `uniforms` object to change lighting, rotation speed, atmosphere color, etc.
   ```javascript
   const uniforms = {
       // ...
       uAtmosphereColor: { value: new THREE.Vector3(1.0, 0.0, 0.0) }, // Red atmosphere
       uRotationSpeed: { value: 0.5 }, // Change rotation speed (need to implement in update loop if logic changes)
   };
   ```

## Running Locally
Due to browser security restrictions (CORS), you cannot open `index.html` directly from the file system (file://) because it tries to load shaders and textures.
**You must run a local server.**

Examples:
- VS Code: Install "Live Server" extension and click "Go Live".
- Node: `npx http-server .`
- Python: `python3 -m http.server`
