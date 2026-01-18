import { UIManager } from '../ui/UIManager';
import { EventManager } from '../engine/EventManager';

export interface Zone {
    name: string;
    description: string;
    trigger: (x: number, y: number) => boolean;
    onData: {
        background: string;
    };
    getTimeDilation?: (x: number, y: number) => number;
}

export class ZoneSystem {
    private static instance: ZoneSystem;

    currentZoneIndex: number = 0;

    zones: Zone[] = [
        {
            name: "The Scrapyard",
            description: "A rust-choked graveyard of failed prototypes.",
            trigger: (x, _y) => {
                const game = (window as any).Game?.getInstance();
                if (x > 1580) { // Updated for 1600px width
                    if (game && game.bossesDefeated.has('golgotha') && game.narrativesRead.size >= 2) {
                        return true;
                    } else {
                        // Feedback: Why can't I leave?
                        if (Math.random() < 0.01) { // Don't spam
                            UIManager.getInstance().showBark(x, _y, "The exit is barred by lingering echoes. Settle the past.");
                        }
                        return false;
                    }
                }
                return false;
            },
            onData: { background: '#2a1a1a' },
            getTimeDilation: (x, _y) => {
                // The "Heavy Room" - Liquid time in the center
                if (x > 300 && x < 500 && _y > 150 && _y < 450) {
                    return 0.4; // 40% speed
                }
                return 1.0;
            }
        },
        {
            name: "Glass Gardens",
            description: "Fragile flora blooming from the silica sands.",
            trigger: (x, _y) => x > 780, // Walk right to Area 3
            onData: { background: '#1a2a2a' },
            getTimeDilation: (_x, _y) => 1.0
        },
        {
            name: "The Clockwork Arteries",
            description: "A mechanical labyrinth of steam and rhythm.",
            trigger: (x, _y) => x < 20, // Walk left to return
            onData: { background: '#151515' },
            getTimeDilation: (_x, _y) => 1.0
        }
    ];

    private constructor() {
        (window as any).ZoneSystem = this;
    }

    static getInstance(): ZoneSystem {
        if (!ZoneSystem.instance) {
            ZoneSystem.instance = new ZoneSystem();
        }
        return ZoneSystem.instance;
    }

    checkTransition(playerX: number, playerY: number) {
        const current = this.zones[this.currentZoneIndex];

        if (current.trigger(playerX, playerY)) {
            this.transitionToNext();
        }
    }

    getCurrentTimeDilation(x: number, y: number): number {
        const current = this.zones[this.currentZoneIndex];
        return current.getTimeDilation ? current.getTimeDilation(x, y) : 1.0;
    }

    private transitionToNext() {
        // Toggle Zone (Simple 2-zone loop for prototype)
        this.currentZoneIndex = (this.currentZoneIndex + 1) % this.zones.length;
        const newZone = this.zones[this.currentZoneIndex];

        console.log(`[ZoneSystem] Entering: ${newZone.name}`);

        // Emit Event for Game.ts to handle Map Swap
        EventManager.getInstance().emit('ZONE_CHANGED', {
            name: newZone.name,
            index: this.currentZoneIndex
        });

        // Show UI Toast
        const ui = UIManager.getInstance();
        if (ui) {
            this.showToast(newZone.name, newZone.description);
        }
    }

    private showToast(title: string, subtitle: string) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '20%';
        div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.color = 'white';
        div.style.textAlign = 'center';
        div.style.textShadow = '0 0 10px black';
        div.style.animation = 'fadeInOut 4s forwards';
        div.style.pointerEvents = 'none'; // Click through

        div.innerHTML = `
            <h1 style="font-size: 48px; margin: 0; font-family: serif;">${title}</h1>
            <p style="font-size: 18px; font-style: italic; opacity: 0.8;">${subtitle}</p>
        `;

        // Inject simple keyframes if not exists
        if (!document.getElementById('zone-anim')) {
            const style = document.createElement('style');
            style.id = 'zone-anim';
            style.innerHTML = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -40%); }
                    20% { opacity: 1; transform: translate(-50%, -50%); }
                    80% { opacity: 1; transform: translate(-50%, -50%); }
                    100% { opacity: 0; transform: translate(-50%, -60%); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(div);
        setTimeout(() => div.remove(), 4000);
    }
}
