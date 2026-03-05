import { UIManager } from '../ui/UIManager';
import { EventManager } from '../engine/EventManager';

export interface Zone {
    name: string;
    description: string;
    // Returns the index of the zone to transition to, or -1 if no transition
    trigger: (x: number, y: number) => number;
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
                // East Exit -> Glass Gardens (Index 1)
                if (x > 1580) {
                    if (game && game.bossesDefeated.has('golgotha') && game.narrativesRead.size >= 2) {
                        return 1;
                    } else {
                        // Feedback: Why can't I leave?
                        if (Math.random() < 0.01) { // Don't spam
                            UIManager.getInstance().showBark(x, _y, "The exit is barred by lingering echoes. Settle the past.");
                        }
                        return -1;
                    }
                }
                return -1;
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
            trigger: (x, _y) => {
                if (x > 1580) return 2; // East -> Clockwork Arteries
                if (x < 20) return 0;   // West -> The Scrapyard
                return -1;
            },
            onData: { background: '#1a2a2a' },
            getTimeDilation: (_x, _y) => 1.0
        },
        {
            name: "The Clockwork Arteries",
            description: "A mechanical labyrinth of steam and rhythm.",
            trigger: (x, _y) => {
                if (x > 1580) return 3; // East -> Hushed Halls
                if (x < 20) return 1;   // West -> Glass Gardens
                return -1;
            },
            onData: { background: '#151515' },
            getTimeDilation: (_x, _y) => 1.0
        },
        {
            name: "The Hushed Halls",
            description: "A sanctuary of velvet and silence.",
            trigger: (x, _y) => {
                if (x > 1580) return 4; // East -> Crystal Belfry
                if (x < 20) return 2;   // West -> Clockwork Arteries
                return -1;
            },
            onData: { background: '#100510' }, // Dark purple
            getTimeDilation: (_x, _y) => 1.0
        },
        {
            name: "The Crystal Belfry",
            description: "The apex where the song is sung.",
            trigger: (x, _y) => {
                if (x < 20) return 3;   // West -> Hushed Halls
                // No East exit from the apex
                return -1;
            },
            onData: { background: '#f0f0f0' }, // White/Grey
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

        const targetZoneIndex = current.trigger(playerX, playerY);
        if (targetZoneIndex !== -1 && targetZoneIndex >= 0 && targetZoneIndex < this.zones.length) {
            this.transitionToNext(targetZoneIndex);
        }
    }

    getCurrentTimeDilation(x: number, y: number): number {
        const current = this.zones[this.currentZoneIndex];
        return current.getTimeDilation ? current.getTimeDilation(x, y) : 1.0;
    }

    private transitionToNext(targetZoneIndex: number) {
        this.currentZoneIndex = targetZoneIndex;
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
