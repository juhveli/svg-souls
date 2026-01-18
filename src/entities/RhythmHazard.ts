import { Entity } from './Entity';
import { AudioController } from '../engine/AudioController';
import { Player } from './Player';

export class SteamVent extends Entity {
    state: 'SAFE' | 'DANGEROUS' = 'SAFE';
    beatCounter: number = 0;
    target: Player;
    damage: number = 10;

    constructor(x: number, y: number, target: Player) {
        const svg = `
            <g class="steam-vent">
                <circle cx="0" cy="0" r="15" fill="#444" stroke="#222" stroke-width="2" />
                <path id="vent-grill" d="M-10,-5 L10,-5 M-10,5 L10,5" stroke="#222" stroke-width="2" />
                <g id="steam-cloud" opacity="0">
                    <circle cx="0" cy="-20" r="10" fill="#fff" opacity="0.3" />
                    <circle cx="-5" cy="-25" r="8" fill="#fff" opacity="0.3" />
                    <circle cx="5" cy="-25" r="8" fill="#fff" opacity="0.3" />
                </g>
            </g>
        `;
        super(x, y, svg);
        this.target = target;

        AudioController.getInstance().subscribeToBeat(() => this.onBeat());
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
        const steam = this.el.querySelector('#steam-cloud');
        if (steam) steam.setAttribute('opacity', '1');

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
        const steam = this.el.querySelector('#steam-cloud');
        if (steam) steam.setAttribute('opacity', '0');
    }

    destroy() {
        // Unsubscribe? (AudioController needs a matching unsubscribe or we need to handle it)
        super.destroy();
    }
}
