import './style.css'
import { Game } from './engine/Game'
import { WebGPURenderer } from './engine/WebGPURenderer'

// Setup HTML Structure
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="game-container">
    <div id="ui-layer">
        <!-- HUD goes here -->
        <span id="debug-info">WASD Move | E Attack | Q Block | Space Roll | R Interact</span>
    </div>

    <!-- WEBGPU CANVAS -->
    <canvas id="webgpu-canvas" width="800" height="600"></canvas>
    <svg id="world-layer" xmlns="http://www.w3.org/2000/svg"></svg>
  </div>
`

// Initialize Renderer & Game
const renderer = WebGPURenderer.getInstance();
renderer.init().then(() => {
    console.log("Starting Game...");
    const game = new Game();
    (window as any).GameInstance = game; // Expose for verification/debugging
}).catch(e => {
    console.error("Failed to start WebGPU:", e);
    document.body.innerHTML = "<h1>WebGPU Not Supported</h1><p>" + e + "</p>";
});
