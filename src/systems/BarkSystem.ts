import { UIManager } from '../ui/UIManager';

export type BarkEvent = 'AGGRO' | 'DAMAGE' | 'DEATH';

// Lore Database
const LORE_DB: Record<string, Partial<Record<BarkEvent, string[]>>> = {
    'serum_bot': {
        'AGGRO': [
            "The inspection! I'm not ready!",
            "Who authorized this visit?!",
            "No! My work isn't finished!",
            "Ticket? Do you have a ticket?"
        ],
        'DAMAGE': [
            "I crack! I crack!",
            "My glass... it sings!",
            "Don't touch the merchandise!",
            "Resonance... dropping..."
        ],
        'DEATH': [
            "Quiet... at last.",
            "Back to the furnace...",
            "Shattered...",
            "End of shift..."
        ]
    },
    'porcelain_dancer': {
        'AGGRO': [
            "May I have this dance?",
            "A step out of time...",
            "The garden requires pruning.",
            "So soft... so fragile."
        ],
        'DAMAGE': [
            "A crack in the glaze.",
            "Imperfect form...",
            "Delicate, aren't we?",
            "Resonance... discordant."
        ],
        'DEATH': [
            "The music... stops.",
            "Back to clay.",
            "Fragmented...",
            "A final bow."
        ]
    },
    'clockwork_hazard': {
        'DAMAGE': [
            "Venting... dissonance!",
            "Rhythm... broken.",
            "Steam... corrupted.",
            "Pressure... critical!"
        ]
    },
    'clockwork_arteries': {
        'AGGRO': [
            "Intruder detected! Recalibrating defenses!",
            "System integrity compromised!",
            "Warning! Unauthorized presence!",
            "Initiating lockdown sequence!"
        ],
        'DAMAGE': [
            "Structural integrity failing!",
            "Pressure drop detected!",
            "Fluid leak! Containment breached!",
            "Circuit overload! Emergency purge!"
        ],
        'DEATH': [
            "Core meltdown imminent...",
            "System shutdown... irreversible.",
            "Silence... at last.",
            "Deactivation complete."
        ]
    }
};

export class BarkSystem {
    private static instance: BarkSystem;
    private lastBarkMap: Map<string, string> = new Map();

    private constructor() {
        (window as any).BarkSystem = this;
    }

    static getInstance(): BarkSystem {
        if (!BarkSystem.instance) {
            BarkSystem.instance = new BarkSystem();
        }
        return BarkSystem.instance;
    }

    trigger(entityType: string, event: BarkEvent, position: { x: number, y: number }, _entityId: string) {
        // 1. Fetch Text
        const lines = LORE_DB[entityType]?.[event];
        if (!lines || lines.length === 0) return;

        let text = lines[Math.floor(Math.random() * lines.length)];

        // Improvement: Prevent consecutive duplicate barks for the same entity type and event
        if (lines.length > 1) {
            const key = `${entityType}_${event}`;
            const lastBark = this.lastBarkMap.get(key);

            // Re-roll once if it's the exact same bark to increase variety
            if (text === lastBark) {
                const otherLines = lines.filter(l => l !== lastBark);
                if (otherLines.length > 0) {
                    text = otherLines[Math.floor(Math.random() * otherLines.length)];
                }
            }
            this.lastBarkMap.set(key, text);
        }

        // 2. Delegate to UI Manager
        // Note: UIManager.showBark(x, y, text) exists in the current codebase
        const ui = UIManager.getInstance();
        if (ui) {
            ui.showBark(position.x, position.y, text);
            console.log(`[BarkSystem] ${entityType} triggered: "${text}"`);
        } else {
            console.warn("[BarkSystem] UIManager instance not found.");
        }
    }
}
