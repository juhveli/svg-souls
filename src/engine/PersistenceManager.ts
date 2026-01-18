import { ProgressionSystem } from '../systems/ProgressionSystem';

interface SaveData {
    version: number;
    vibration: number;
    level: number;
    inventory: string[];
    flags: Record<string, boolean>;
}

export class PersistenceManager {
    private static instance: PersistenceManager;
    private readonly SAVE_KEY = 'chronocrystal_save';
    private readonly SAVE_VERSION = 1;

    private constructor() {
        (window as any).PersistenceManager = this;
    }

    static getInstance(): PersistenceManager {
        if (!PersistenceManager.instance) {
            PersistenceManager.instance = new PersistenceManager();
        }
        return PersistenceManager.instance;
    }

    save(): void {
        const prog = ProgressionSystem.getInstance();
        const game = (window as any).Game?.getInstance();

        const data: SaveData = {
            version: this.SAVE_VERSION,
            vibration: prog.vibration,
            level: prog.level,
            inventory: prog.inventory,
            flags: {
                golgotha_defeated: game?.bossesDefeated?.has('golgotha') || false,
                mirror_read: game?.narrativesRead?.has('A Cracked Mirror') || false,
                ledger_read: game?.narrativesRead?.has("Foreman's Ledger") || false
            }
        };

        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            console.log('[PersistenceManager] Game saved.');
        } catch (e) {
            console.error('[PersistenceManager] Failed to save:', e);
        }
    }

    load(): boolean {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            if (!raw) {
                console.log('[PersistenceManager] No save data found.');
                return false;
            }

            const data: SaveData = JSON.parse(raw);

            // Version check
            if (data.version !== this.SAVE_VERSION) {
                console.warn('[PersistenceManager] Save version mismatch. Ignoring save.');
                return false;
            }

            // Restore Progression
            const prog = ProgressionSystem.getInstance();
            prog.vibration = data.vibration;
            prog.level = data.level;
            prog.inventory = data.inventory || [];

            // Restore Flags
            const game = (window as any).Game?.getInstance();
            if (game && data.flags) {
                if (data.flags.golgotha_defeated) {
                    game.bossesDefeated.add('golgotha');
                }
                if (data.flags.mirror_read) {
                    game.narrativesRead.add('A Cracked Mirror');
                }
                if (data.flags.ledger_read) {
                    game.narrativesRead.add("Foreman's Ledger");
                }
            }

            console.log('[PersistenceManager] Game loaded.');
            return true;
        } catch (e) {
            console.error('[PersistenceManager] Failed to load:', e);
            return false;
        }
    }

    clear(): void {
        localStorage.removeItem(this.SAVE_KEY);
        console.log('[PersistenceManager] Save data cleared.');
    }

    hasSave(): boolean {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }
}
