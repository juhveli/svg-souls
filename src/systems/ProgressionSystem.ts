import { EventManager } from '../engine/EventManager';

export class ProgressionSystem {
    private static instance: ProgressionSystem;

    // State
    vibration: number = 0; // Was Scrap
    level: number = 1;
    inventory: string[] = [];

    // Stats (Base + Modifiers)
    maxResonance: number = 100; // Mana
    maxIntegrity: number = 100; // Health

    private constructor() {
        (window as any).ProgressionSystem = this;

        // Listen for Loot
        EventManager.getInstance().on('LOOT_GAINED', (data: any) => {
            if (data.type === 'vibration') {
                this.addVibration(data.amount);
            } else if (data.type === 'item') {
                this.addItem(data.id);
            }
        });
    }

    static getInstance(): ProgressionSystem {
        if (!ProgressionSystem.instance) {
            ProgressionSystem.instance = new ProgressionSystem();
        }
        return ProgressionSystem.instance;
    }

    addVibration(amount: number) {
        this.vibration += amount;
        console.log(`[Progression] +${amount} Vibration. Total: ${this.vibration}`);

        this.checkAttunement();
    }

    addItem(itemId: string) {
        this.inventory.push(itemId);
        console.log(`[Progression] Acquired: ${itemId}`);

        // Item Effects
        if (itemId === 'Vial of Liquid Seconds') {
            // Auto-consume for now
            console.log("[Progression] Consumed Liquid Seconds: Integrity Restored.");
        }
    }

    private checkAttunement() {
        // "Attuning" (Leveling Up)
        const cost = this.level * 100;

        if (this.vibration >= cost) {
            this.vibration -= cost;
            this.level++;
            this.increaseCapacity();
            console.log(`[Progression] Attunement Complete! Now Level ${this.level}`);

            EventManager.getInstance().emit('PLAYER_ATTUNED', { level: this.level });
        }
    }

    private increaseCapacity() {
        // +10% Capacity per level
        this.maxResonance = Math.floor(100 * (1 + (this.level - 1) * 0.1));
        this.maxIntegrity = Math.floor(100 * (1 + (this.level - 1) * 0.1));
    }
}
