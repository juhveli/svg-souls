
// Mocks for DOM interfaces
class MockElement {
    id: string = '';
    children: MockElement[] = [];
    attributes: Map<string, string> = new Map();

    appendChild(child: MockElement) {
        this.children.push(child);
    }

    setAttribute(key: string, value: string) {
        this.attributes.set(key, value);
    }
}

const mockDocument = {
    createElementNS: (_ns: string, _tag: string) => new MockElement(),
    getElementById: (_id: string) => new MockElement(),
};

(globalThis as any).document = mockDocument;
(globalThis as any).SVGElement = MockElement;
(globalThis as any).SVGGElement = MockElement;
(globalThis as any).SVGPathElement = MockElement;

// Import ParticleSystem
// Note: using .js extension for NodeNext module resolution
import { ParticleSystem } from '../engine/ParticleSystem.js';

function runBenchmark() {
    console.log("Starting Benchmark...");

    // 1. Correctness Test
    console.log("\n--- Correctness Test ---");
    const sys = new ParticleSystem();

    // Emit 3 particles
    sys.emit(0, 0, 'A', 1);
    sys.emit(0, 0, 'B', 1);
    sys.emit(0, 0, 'C', 1);

    // Force lives
    // sys.particles is public
    if (sys.particles.length === 3) {
        sys.particles[0].life = 0.1; // A dies
        sys.particles[1].life = 10.0; // B lives
        sys.particles[2].life = 10.0; // C lives
        // Force colors (emit uses the passed color)
        sys.particles[0].color = 'A';
        sys.particles[1].color = 'B';
        sys.particles[2].color = 'C';
    } else {
        console.error("Setup failed: expected 3 particles");
        throw new Error("Setup failed");
    }

    console.log("Initial order:", sys.particles.map(p => p.color).join(', '));

    // Update with dt=0.2 (A should die)
    sys.update(0.2);

    const remaining = sys.particles.map(p => p.color).join(', ');
    console.log("After update (A dies):", remaining);

    if (remaining === 'B, C') {
        console.log("PASS: Order preserved.");
    } else {
        console.error("FAIL: Order NOT preserved. Expected 'B, C', got '" + remaining + "'");
        throw new Error("Correctness Check Failed");
    }

    // 2. Performance Test
    console.log("\n--- Performance Test ---");
    const perfSys = new ParticleSystem();
    const COUNT = 50000;
    console.log(`Emitting ${COUNT} particles...`);

    for(let i=0; i<COUNT; i++) {
        perfSys.emit(0, 0, 'Red', 1);
    }

    console.log(`Running update loop for simulation...`);
    const start = performance.now();

    let frames = 0;
    const dt = 0.016;
    let time = 0;
    // Run for 1.2 seconds. Particles have maxLife 1.0.
    // They start dying at 0.5.
    while(time < 1.2) {
        perfSys.update(dt);
        time += dt;
        frames++;
    }

    const end = performance.now();
    const duration = end - start;
    console.log(`Finished ${frames} frames in ${duration.toFixed(2)}ms`);
    console.log(`Remaining particles: ${perfSys.particles.length}`);
}

runBenchmark();
