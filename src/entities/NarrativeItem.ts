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

    constructor(x: number, y: number, label: string, barkText: string, target: Player) {
        super(x, y);
        this.label = label;
        this.barkText = barkText;
        this.target = target;
        this.width = 32;
        this.height = 32;
    }

    update(dt: number) {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius_trigger) {
            const input = InputSystem.getInstance();
            if (input.isKeyDown('KeyR')) { // Changed to R to match HUD
                UIManager.getInstance().showBark(this.x, this.y, this.barkText);
                EventManager.getInstance().emit('NARRATIVE_INTERACTED', { label: this.label, id: this.id });
            }
        }

        super.update(dt);
    }
}
