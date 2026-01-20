
import { performance } from 'perf_hooks';

// Simulation parameters
const ENTITY_COUNT = 1000; // Simulating MAX_INSTANCES
const ITERATIONS = 100000; // Number of frames to simulate

// Mock classes
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y);
    }
}

class Enemy extends Entity {
    constructor(x, y) {
        super(x, y);
    }
}

// Setup entities
const entities = [];
// Randomly place player in the array
const playerIndex = Math.floor(Math.random() * ENTITY_COUNT);

let playerRef;

for (let i = 0; i < ENTITY_COUNT; i++) {
    if (i === playerIndex) {
        const p = new Player(Math.random() * 800, Math.random() * 600);
        entities.push(p);
        playerRef = p;
    } else {
        entities.push(new Enemy(Math.random() * 800, Math.random() * 600));
    }
}

console.log(`Setup: ${ENTITY_COUNT} entities. Player at index ${playerIndex}.`);
console.log(`Running ${ITERATIONS} iterations...`);

// Method A: Linear Search (Current)
const startA = performance.now();
let checkSumA = 0;
for (let i = 0; i < ITERATIONS; i++) {
    const player = entities.find(e => e.constructor.name === 'Player');
    if (player) {
        checkSumA += player.x;
    }
}
const endA = performance.now();
const timeA = endA - startA;

// Method B: Direct Access (Optimized)
const startB = performance.now();
let checkSumB = 0;
for (let i = 0; i < ITERATIONS; i++) {
    const player = playerRef; // Passed directly
    if (player) {
        checkSumB += player.x;
    }
}
const endB = performance.now();
const timeB = endB - startB;

console.log(`\nMethod A (Linear Search): ${timeA.toFixed(4)} ms`);
console.log(`Method B (Direct Access): ${timeB.toFixed(4)} ms`);
console.log(`Improvement: ${(timeA / timeB).toFixed(2)}x faster`);
console.log(`Checksums: ${checkSumA} vs ${checkSumB} (Should be equal)`);
