import { Entity } from './Entity';
import { AudioController } from '../engine/AudioController';
import { Player } from './Player';

export class SteamVent extends Entity {
    state: 'SAFE' | 'DANGEROUS' = 'SAFE';
    beatCounter: number = 0;
    target: Player;
    damage: number = 10;
    isActive: boolean = false; // For Renderer (TypeID 21)
    private beatListener: () => void;

    constructor(x: number, y: number, target: Player) {
        super(x, y); // Removed SVG
        this.typeID = 21;
        this.target = target;
        this.width = 32;
        this.height = 32;

        this.beatListener = () => this.onBeat();
        AudioController.getInstance().subscribeToBeat(this.beatListener);
    }

    onBeat() {
        this.beatCounter++;

        // Pattern: Safe for 3 beats, Dangerous on 4th
        if (this.beatCounter % 4 === 0) {
            this.activate();
        } else {
            this.deactivate();
        }
    }

    activate() {
        this.state = 'DANGEROUS';
        this.isActive = true;

        // Check for player damage
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
            this.target.takeDamage(this.damage);
        }
    }

    deactivate() {
        this.state = 'SAFE';
        this.isActive = false;
    }

    destroy() {
        AudioController.getInstance().unsubscribeFromBeat(this.beatListener);
        super.destroy();
    }
}
