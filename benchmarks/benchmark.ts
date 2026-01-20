import { performance } from 'perf_hooks';

// Mocks
class MockEntity {
    id: number;
    markedForDeletion: boolean = false;
    y: number = 0;
    constructor(id: number) {
        this.id = id;
        this.y = Math.random() * 1000;
    }
    update(dt: number) {}
}

class MockPlayer extends MockEntity {}
class MockEnemy extends MockEntity {}
class MockNarrativeItem extends MockEntity {}

// Baseline
class BaselineEntityManager {
    entities: MockEntity[] = [];
    players: MockPlayer[] = [];
    enemies: MockEnemy[] = [];
    narrativeItems: MockNarrativeItem[] = [];

    add(entity: MockEntity) {
        this.entities.push(entity);
        if (entity instanceof MockPlayer) this.players.push(entity);
        else if (entity instanceof MockEnemy) this.enemies.push(entity);
        else if (entity instanceof MockNarrativeItem) this.narrativeItems.push(entity);
    }

    update(dt: number) {
        this.entities = this.entities.filter(e => !e.markedForDeletion);
        this.players = this.players.filter(e => !e.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.narrativeItems = this.narrativeItems.filter(e => !e.markedForDeletion);

        this.entities.sort((a, b) => a.y - b.y);

        for (const entity of this.entities) {
            entity.update(dt);
        }
    }
}

// Optimized
class OptimizedEntityManager {
    entities: MockEntity[] = [];
    players: MockPlayer[] = [];
    enemies: MockEnemy[] = [];
    narrativeItems: MockNarrativeItem[] = [];

    add(entity: MockEntity) {
        this.entities.push(entity);
        if (entity instanceof MockPlayer) this.players.push(entity);
        else if (entity instanceof MockEnemy) this.enemies.push(entity);
        else if (entity instanceof MockNarrativeItem) this.narrativeItems.push(entity);
    }

    private cleanArray(array: MockEntity[]) {
        let writeIndex = 0;
        for (let i = 0; i < array.length; i++) {
            const entity = array[i];
            if (!entity.markedForDeletion) {
                if (writeIndex !== i) {
                    array[writeIndex] = entity;
                }
                writeIndex++;
            }
        }
        array.length = writeIndex;
    }

    update(dt: number) {
        this.cleanArray(this.entities);
        this.cleanArray(this.players);
        this.cleanArray(this.enemies);
        this.cleanArray(this.narrativeItems);

        this.entities.sort((a, b) => a.y - b.y);

        for (const entity of this.entities) {
            entity.update(dt);
        }
    }
}

// Benchmark
const ITERATIONS = 100; // Frames
const ENTITY_COUNT = 10000;

// Simple pseudo-random generator for consistency across runs
class RNG {
    seed: number;
    constructor(seed: number) { this.seed = seed; }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

function runBenchmark(ManagerClass: any, name: string) {
    const rng = new RNG(12345);
    const manager = new ManagerClass();
    const entities: MockEntity[] = [];

    // Setup
    for (let i = 0; i < ENTITY_COUNT; i++) {
        const r = rng.next();
        let e: MockEntity;
        if (r < 0.1) e = new MockPlayer(i);
        else if (r < 0.5) e = new MockEnemy(i);
        else if (r < 0.6) e = new MockNarrativeItem(i);
        else e = new MockEntity(i);

        manager.add(e);
        entities.push(e);
    }

    const start = performance.now();

    for (let f = 0; f < ITERATIONS; f++) {
        // Mark ~1% for deletion deterministically based on RNG
        for (const e of entities) {
            if (!e.markedForDeletion && rng.next() < 0.01) {
                e.markedForDeletion = true;
            }
        }
        manager.update(0.016);
    }

    const end = performance.now();
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    return { time: end - start, count: manager.entities.length };
}

console.log(`Starting Benchmark: ${ENTITY_COUNT} entities, ${ITERATIONS} frames`);
const res1 = runBenchmark(BaselineEntityManager, "Baseline");
const res2 = runBenchmark(OptimizedEntityManager, "Optimized");

if (res1.count !== res2.count) {
    console.error(`MISMATCH! Baseline: ${res1.count}, Optimized: ${res2.count}`);
    process.exit(1);
} else {
    console.log(`Verification Passed: Both have ${res1.count} entities remaining.`);
    const improv = ((res1.time - res2.time) / res1.time * 100).toFixed(1);
    console.log(`Improvement: ${improv}%`);
}
