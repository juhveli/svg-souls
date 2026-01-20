export interface NPCDefinition {
    name: string;
    typeID: number;
    dialogue: string[];
}

export class NPCDatabase {
    private static instance: NPCDatabase;
    private npcs: Map<string, NPCDefinition> = new Map();
    private loaded: boolean = false;

    private constructor() {
        (window as any).NPCDatabase = this;
    }

    static getInstance(): NPCDatabase {
        if (!NPCDatabase.instance) {
            NPCDatabase.instance = new NPCDatabase();
        }
        return NPCDatabase.instance;
    }

    async init(): Promise<void> {
        if (this.loaded) return;

        try {
            const response = await fetch('/assets/data/npcs.json');
            const data = await response.json();

            for (const [id, npc] of Object.entries(data)) {
                this.npcs.set(id, npc as NPCDefinition);
            }

            this.loaded = true;
            console.log(`[NPCDatabase] Loaded ${this.npcs.size} NPCs.`);
        } catch (e) {
            console.error('[NPCDatabase] Failed to load npcs.json:', e);
        }
    }

    get(id: string): NPCDefinition | undefined {
        return this.npcs.get(id);
    }

    getName(id: string): string {
        return this.npcs.get(id)?.name || id;
    }

    getDialogue(id: string): string[] {
        return this.npcs.get(id)?.dialogue || [];
    }
}
