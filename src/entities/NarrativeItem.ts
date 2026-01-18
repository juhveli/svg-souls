import { Entity } from './Entity';
import { Player } from './Player';
import { UIManager } from '../ui/UIManager';
import { InputSystem } from '../engine/InputSystem';
import { EventManager } from '../engine/EventManager';

export class NarrativeItem extends Entity {
    private label: string;
    private barkText: string;
    private radius_trigger: number = 60;
    private target: Player;

    constructor(x: number, y: number, svg: string, label: string, barkText: string, target: Player) {
        super(x, y, svg);
        this.label = label;
        this.barkText = barkText;
        this.target = target;

        // Add a prompt circle (hidden initially)
        this.el.innerHTML += `
            <circle cx="0" cy="0" r="30" fill="none" stroke="#fff" stroke-dasharray="4 4" opacity="0" class="prompt-ring" />
            <text x="0" y="-40" fill="#fff" font-size="10" text-anchor="middle" opacity="0" class="prompt-text">${label}</text>
        `;
    }

    update(dt: number) {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const ring = this.el.querySelector('.prompt-ring') as SVGElement;
        const text = this.el.querySelector('.prompt-text') as SVGElement;

        if (dist < this.radius_trigger) {
            if (ring) ring.setAttribute('opacity', '0.5');
            if (text) text.setAttribute('opacity', '1');

            // Interaction
            const input = InputSystem.getInstance();
            if (input.isKeyDown('KeyE')) {
                UIManager.getInstance().showBark(this.x, this.y, this.barkText);
                EventManager.getInstance().emit('NARRATIVE_INTERACTED', { label: this.label, id: this.id });
            }
        } else {
            if (ring) ring.setAttribute('opacity', '0');
            if (text) text.setAttribute('opacity', '0');
        }

        super.update(dt);
        this.render();
    }
}
