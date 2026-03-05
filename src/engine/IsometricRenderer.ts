import { IsometricMath } from './IsometricMath';

export class IsometricRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tileImage: HTMLImageElement;
    private imageLoaded: boolean = false;
    private cols = 20;
    private rows = 20;
    private tileSize = 64;

    constructor(containerId: string, width: number, height: number) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'isometric-bg-layer';
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '0';

        const container = document.getElementById(containerId);
        if (container) {
            container.insertBefore(this.canvas, container.firstChild);
        }

        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        this.tileImage = new Image();
        this.tileImage.src = '/assets/sprites/isometric/floor_tile_placeholder.png';
        this.tileImage.onload = () => {
            this.imageLoaded = true;
        };
    }

    public render(cameraX: number, cameraY: number) {
        if (!this.ctx || !this.imageLoaded) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const offsetX = this.canvas.width / 2 - cameraX;
        const offsetY = this.canvas.height / 4 - cameraY;

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const worldX = x * (this.tileSize / 2);
                const worldY = y * (this.tileSize / 2);
                const screenPos = IsometricMath.worldToScreen(worldX, worldY, 0);

                this.ctx.save();
                this.ctx.translate(screenPos.x + offsetX, screenPos.y + offsetY);

                this.ctx.beginPath();
                this.ctx.moveTo(0, -this.tileSize / 4);
                this.ctx.lineTo(this.tileSize / 2, 0);
                this.ctx.lineTo(0, this.tileSize / 4);
                this.ctx.lineTo(-this.tileSize / 2, 0);
                this.ctx.closePath();

                this.ctx.fillStyle = '#5a3a2a';
                this.ctx.fill();

                this.ctx.strokeStyle = '#1a1a1a';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();

                this.ctx.restore();
            }
        }
    }

    public destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}
