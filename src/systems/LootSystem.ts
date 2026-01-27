import { EventManager } from '../engine/EventManager';

interface LootTableEntry {
    min: number;
    max: number;
    chance: number; // 0-1
    items?: string[]; // Potential item drops
}

const DROP_TABLES: Record<string, LootTableEntry> = {
    'serum_bot': {
        min: 5,
        max: 15,
        chance: 1.0,
        items: ['Glass Shard']
    },
    'porcelain_dancer': {
        min: 10,
        max: 30,
        chance: 1.0,
        items: ['Shattered Porcelain Mask']
    },
    'boss_glass_blower': {
        min: 500,
        max: 1000,
        chance: 1.0,
        items: ['Breath of the Creator']
    },
    'golgotha': {
        min: 200,
        max: 500,
        chance: 1.0,
        items: ['The Stopped Watch']
    }
};

// Rare global drops
const GLOBAL_DROPS = [
    { item: 'Vial of Liquid Seconds', chance: 0.05 }, // 5% chance
    { item: 'The Stopped Watch', chance: 0.001 } // 0.1% chance
];

export class LootSystem {
    private static instance: LootSystem;

    private constructor() {
        (window as any).LootSystem = this;

        // Listen for Deaths (Item drops only now)
        EventManager.getInstance().on('ENTITY_DIED', (data: any) => {
            if (data.type) {
                this.calculateItemDrop(data.type, data.x, data.y);
            }
        });

        // Listen for Shard Collection (Vibration)
        EventManager.getInstance().on('SHARD_COLLECTED', (data: any) => {
            EventManager.getInstance().emit('LOOT_GAINED', {
                type: 'vibration',
                amount: data.value,
                x: data.x,
                y: data.y
            });
        });
    }

    static getInstance(): LootSystem {
        if (!LootSystem.instance) {
            LootSystem.instance = new LootSystem();
        }
        return LootSystem.instance;
    }

    private calculateItemDrop(entityType: string, x: number, y: number) {
        const table = DROP_TABLES[entityType];
        if (!table) return;

        // Item drops only (Vibration now comes from shards)
        // Check special item drops
        if (table.items && table.items.length > 0) {
            const itemChance = 0.1; // 10% for normal enemies, bosses have higher
            const effectiveChance = entityType.includes('boss') || entityType === 'golgotha' ? 1.0 : itemChance;
            if (Math.random() < effectiveChance) {
                const item = table.items[Math.floor(Math.random() * table.items.length)];
                this.dropItem(item, x, y);
            }
        }

        // Global rare drops
        for (const globalDrop of GLOBAL_DROPS) {
            if (Math.random() < globalDrop.chance) {
                this.dropItem(globalDrop.item, x, y);
            }
        }
    }

    private dropItem(itemName: string, x: number, y: number) {
        EventManager.getInstance().emit('LOOT_GAINED', { type: 'item', id: itemName, x: x, y: y });
        console.log(`[LootSystem] Dropped ITEM: ${itemName} at (${x}, ${y})`);
    }
}
