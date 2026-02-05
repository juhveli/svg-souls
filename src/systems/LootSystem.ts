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
        items: ['glass_shard']
    },
    'glass_blower': {
        min: 500,
        max: 1000,
        chance: 1.0,
        items: ['breath_of_creator']
    },
    'golgotha': {
        min: 200,
        max: 500,
        chance: 1.0,
        items: ['stopped_watch']
    },
    'porcelain_dancer': {
        min: 25,
        max: 50,
        chance: 1.0,
        items: ['porcelain_mask']
    },
    'librarian': {
        min: 30,
        max: 60,
        chance: 1.0,
        items: ['librarian_finger']
    },
    'book_mimic': {
        min: 20,
        max: 40,
        chance: 1.0,
        items: ['hollow_book_spine']
    },
    'crystal_shard': {
        min: 10,
        max: 30,
        chance: 1.0,
        items: ['crystal_shard_spire']
    },
    'trash_compactor': {
        min: 100,
        max: 200,
        chance: 1.0,
        items: ['cube_of_compacted_regret']
    },
    'steam_marshal': {
        min: 100,
        max: 200,
        chance: 1.0,
        items: ['valve_of_marshal']
    },
    'gatekeeper': {
        min: 150,
        max: 300,
        chance: 1.0,
        items: ['lens_of_gatekeeper']
    }
};

// Rare global drops
const GLOBAL_DROPS = [
    { item: 'vial_liquid_seconds', chance: 0.05 }, // 5% chance
    { item: 'stopped_watch', chance: 0.001 } // 0.1% chance
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
            // Check known boss types for 100% drop chance
            const isBoss = entityType === 'golgotha' ||
                           entityType === 'glass_blower' ||
                           entityType === 'trash_compactor' ||
                           entityType === 'steam_marshal' ||
                           entityType === 'gatekeeper';

            const effectiveChance = isBoss ? 1.0 : itemChance;
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

    private dropItem(itemId: string, x: number, y: number) {
        EventManager.getInstance().emit('LOOT_GAINED', { type: 'item', id: itemId, x: x, y: y });
        console.log(`[LootSystem] Dropped ITEM: ${itemId} at (${x}, ${y})`);
    }
}
