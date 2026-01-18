import './style.css'
import { Game } from './engine/Game'

// Setup HTML Structure
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="game-container">
    <div id="ui-layer">
        <!-- HUD goes here -->
        <span id="debug-info">WASD Move | E Attack | Q Block | Space Roll | R Interact</span>
    </div>
    <svg id="game-view" viewBox="0 0 800 600">
        <defs>
            <!-- 1. The Glass Shader (Chronocrystal material) -->
            <filter id="glass-shine">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
                <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lighting-color="#ffffff" result="specular">
                    <fePointLight x="-5000" y="-10000" z="20000"/>
                </feSpecularLighting>
                <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular"/>
                <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
            </filter>

            <!-- 2. The Shatter Glitch (Time Disruption) -->
            <filter id="shatter-glitch">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" seed="0">
                    <animate attributeName="baseFrequency" values="0.05;0.1;0.05" dur="10s" repeatCount="indefinite"/>
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G">
                     <!-- Animated via JS: scale goes 0 -> 20 -> 0 -->
                </feDisplacementMap>
            </filter>

            <!-- 3. The Silence (Low Health Desaturation) -->
            <filter id="silence-mono">
                <feColorMatrix type="saturate" values="1"/>
                 <!-- Value animated via JS: 1 (Health 100%) -> 0 (Health 0%) -->
            </filter>

            <!-- 4. Background Fog (Industrial Heat) -->
            <filter id="heat-haze">
                <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="1" result="turbulence"/>
                <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="10" xChannelSelector="R" yChannelSelector="B"/>
            </filter>

            <!-- 5. Glow Filter (Cyan/Purple Emission) -->
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            <!-- 6. Vignette Gradient (Focus on center) -->
            <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                <stop offset="60%" style="stop-color:#000;stop-opacity:0"/>
                <stop offset="100%" style="stop-color:#000;stop-opacity:0.8"/>
            </radialGradient>
        </defs>
        <g id="bg-layer">
            <g id="bg-far" filter="url(#heat-haze)" style="opacity: 0.4;">
                 <!-- Infinite Clockwork Depth (Atmospheric: dim, blue-tinted) -->
                 <rect width="2000" height="2000" x="-500" y="-500" fill="#030308"/>
                 <circle cx="400" cy="300" r="300" stroke="#0a0a1a" stroke-width="20" fill="none" style="animation: gear-rotate 60s linear infinite;"/>
                 <circle cx="600" cy="100" r="100" stroke="#080815" stroke-width="10" fill="none" style="animation: gear-rotate 30s linear infinite reverse;"/>
            </g>
            <g id="bg-mid" style="opacity: 0.7;">
                 <!-- Floating Gears (Mid-ground: slightly brighter) -->
                 <circle cx="150" cy="500" r="60" stroke="#1a1a25" stroke-width="8" fill="none" style="animation: gear-rotate 20s linear infinite;"/>
                 <circle cx="650" cy="450" r="40" stroke="#181820" stroke-width="6" fill="none" style="animation: gear-rotate 15s linear infinite reverse;"/>
            </g>
        </g>
        <g id="world-layer">
            <!-- Entities appended here -->
             <rect width="800" height="600" fill="none"/> <!-- Transparent to show parallax -->
             
             <!-- Floor markings for perspective -->
             <path d="M0,0 L800,600 M800,0 L0,600" stroke="#222" stroke-width="2" opacity="0.5"/>
        </g>
        <g id="fg-layer" pointer-events="none">
             <!-- Glass Overlay / Vignette -->
             <rect width="800" height="600" fill="url(#shatter-glitch)" opacity="0"/>
             <!-- Vignette Overlay -->
             <rect width="800" height="600" fill="url(#vignette)" />
        </g>
    </svg>
  </div>
`

// Start Game
new Game();
