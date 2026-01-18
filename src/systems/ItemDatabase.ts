import { EventManager } from '../engine/EventManager';

interface ItemEffect {
    type: string;
    value?: number;
    target?: string;
    spell?: string;
    damage?: number;
    resonance_gain?: number;
}

interface ItemDefinition {
    name: string;
    description: string;
    category: 'material' | 'consumable' | 'key' | 'boss_soul' | 'weapon' | 'narrative';
    effect: ItemEffect | null;
    icon: string;
}

export class ItemDatabase {
    private static instance: ItemDatabase;
    private items: Map<string, ItemDefinition> = new Map();
    private loaded: boolean = false;

    private constructor() {
        (window as any).ItemDatabase = this;
    }

    static getInstance(): ItemDatabase {
        if (!ItemDatabase.instance) {
            ItemDatabase.instance = new ItemDatabase();
        }
        return ItemDatabase.instance;
    }

    async init(): Promise<void> {
        if (this.loaded) return;

        try {
            const response = await fetch('/assets/data/items.json');
            const data = await response.json();

            for (const [id, item] of Object.entries(data)) {
                this.items.set(id, item as ItemDefinition);
            }

            this.loaded = true;
            console.log(`[ItemDatabase] Loaded ${this.items.size} items.`);
        } catch (e) {
            console.error('[ItemDatabase] Failed to load items.json:', e);
        }
    }

    get(id: string): ItemDefinition | undefined {
        return this.items.get(id);
    }

    getName(id: string): string {
        return this.items.get(id)?.name || id;
    }

    getDescription(id: string): string {
        return this.items.get(id)?.description || 'Unknown item.';
    }

    useItem(id: string): boolean {
        const item = this.items.get(id);
        if (!item || !item.effect) return false;

        switch (item.effect.type) {
            case 'heal':
                EventManager.getInstance().emit('ITEM_USED', {
                    type: 'heal',
                    value: item.effect.value || 0
                });
                console.log(`[ItemDatabase] Used ${item.name}: +${item.effect.value} Integrity`);
                return true;

            case 'unlock':
                EventManager.getInstance().emit('ITEM_USED', {
                    type: 'unlock',
                    target: item.effect.target
                });
                console.log(`[ItemDatabase] Used ${item.name}: Unlocked ${item.effect.target}`);
                return true;

            default:
                console.log(`[ItemDatabase] Item ${item.name} has no usable effect.`);
                return false;
        }
    }
}
