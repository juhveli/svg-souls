import { Entity } from './Entity';
import { Player } from './Player';
import { UIManager } from '../ui/UIManager';
import { InputSystem } from '../engine/InputSystem';

export class NPCEntity extends Entity {
    private name: string;
    private dialogueLines: string[];
    private currentLine: number = 0;
    private interactRadius: number = 50;
    private target: Player;
    private canInteract: boolean = true;
    private interactCooldown: number = 0;

    constructor(x: number, y: number, svg: string, name: string, dialogue: string[], target: Player) {
        super(x, y, svg);
        this.name = name;
        this.dialogueLines = dialogue;
        this.target = target;

        // Add interaction prompt
        const prompt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        prompt.id = 'interact-prompt';
        prompt.setAttribute('y', '-40');
        prompt.setAttribute('text-anchor', 'middle');
        prompt.setAttribute('fill', '#fff');
        prompt.setAttribute('font-size', '10');
        prompt.setAttribute('opacity', '0');
        prompt.textContent = '[E] Talk';
        this.el.appendChild(prompt);
    }

    update(dt: number) {
        // Cooldown management
        if (this.interactCooldown > 0) {
            this.interactCooldown -= dt;
            if (this.interactCooldown <= 0) {
                this.canInteract = true;
            }
        }

        // Distance check
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const inRange = dist < this.interactRadius;

        // Show/hide prompt
        const prompt = this.el.querySelector('#interact-prompt');
        if (prompt) {
            prompt.setAttribute('opacity', inRange && this.canInteract ? '1' : '0');
        }

        // Interaction
        if (inRange && this.canInteract) {
            const input = InputSystem.getInstance();
            if (input.isKeyDown('KeyE')) {
                this.interact();
            }
        }

        super.render();
    }

    private interact() {
        if (this.dialogueLines.length === 0) return;

        // Show current line
        const line = this.dialogueLines[this.currentLine];
        UIManager.getInstance().showBark(this.x, this.y - 20, `${this.name}: "${line}"`);

        // Advance dialogue
        this.currentLine = (this.currentLine + 1) % this.dialogueLines.length;

        // Cooldown to prevent spam
        this.canInteract = false;
        this.interactCooldown = 1.0; // 1 second between interactions
    }
}
