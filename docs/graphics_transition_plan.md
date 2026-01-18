# implementation Plan: Graphics & Transitions (SVG Engine)

This plan details how to implement the *Chronocrystal* lore visuals using the existing SVG rendering engine.

## 1. Backgrounds & Parallax (The Clockwork Depth)
To achieve the "infinite clockwork" look:
*   **Technique:** Multi-Plane SVG Groups.
*   **Implementation:**
    *   Create 3 `<g>` layers in `index.html`: `#bg-far`, `#bg-mid`, `#bg-near`.
    *   **Logic:** In `Game.ts` `render()` loop, apply `transform="translate(x, y)"` to each group with different scroll factors (e.g., 0.2, 0.5, 1.0).
    *   **Content:**
        *   *Far:* Static gradients (Void colors).
        *   *Mid:* Slow-rotating gears (SVG `<path>` with CSS animation).
        *   *Near:* The playable level geometry.

## 2. Transition Effects (The Shatter)
To render the "Shattered Reality" and "Time Skipping":
*   **Technique:** SVG Filters (`<filter>`).
*   **Effect 1: The Timeline Glitch (Shatter)**
    *   **Filter:** `feTurbulence` (Fractal Noise) + `feDisplacementMap`.
    *   **Trigger:** When Player takes damage or Time Skips.
    *   **Animation:** Animate the `scale` attribute of the displacement map from 0 to 50 and back.
*   **Effect 2: Health Desaturation (The Silence)**
    *   **Filter:** `feColorMatrix` type="saturate".
    *   **Trigger:** Bind `values` attribute to Player Health % (1 = full color, 0 = B&W).

## 3. Glass & Refraction (The Aesthetic)
To make the world look like "Crystal":
*   **Technique:** `feSpecularLighting` + `feComposite`.
*   **Implementation:**
    *   Define a global `#glass-shine` filter.
    *   Apply it to all "Glass" geometry classes.
    *   *Code snippet:*
        ```xml
        <filter id="glass">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
          <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lighting-color="white">
            <fePointLight x="-5000" y="-10000" z="20000"/>
          </feSpecularLighting>
          <feComposite in="SourceGraphic" operator="in" />
        </filter>
        ```

## 4. Execution Steps
1.  **Refactor Main:** Move SVG structure to a class `RenderSystem.ts`.
2.  **Create Filter Library:** Define the filters in `<defs>` in `index.html`.
3.  **Update Loop:** Add `ParallaxSystem` to the game loop.
