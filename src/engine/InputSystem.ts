export class InputSystem {
    private static instance: InputSystem;

    // Key States
    keys: Set<string> = new Set();

    // Mouse State
    mouseX: number = 0;
    mouseY: number = 0;
    isMouseDown: boolean = false;

    private constructor() {
        this.bindEvents();
    }

    static getInstance(): InputSystem {
        if (!InputSystem.instance) {
            InputSystem.instance = new InputSystem();
        }
        return InputSystem.instance;
    }

    private bindEvents() {
        window.addEventListener('keydown', (e) => this.keys.add(e.code));
        window.addEventListener('keyup', (e) => this.keys.delete(e.code));

        window.addEventListener('mousemove', (e) => {
            const svg = document.getElementById('game-view');
            if (svg) {
                const rect = svg.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            }
        });

        window.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);
    }

    // Helper: Normalized vector from (x,y) to mouse
    getVectorToMouse(x: number, y: number): { x: number, y: number } {
        const dx = this.mouseX - x;
        const dy = this.mouseY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { x: 0, y: 0 };
        return { x: dx / dist, y: dy / dist };
    }

    isKeyDown(code: string): boolean {
        return this.keys.has(code);
    }
}
