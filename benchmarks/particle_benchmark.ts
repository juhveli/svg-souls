// @ts-nocheck

// Minimal DOM Mock for Node.js environment
const mockElement = {
    id: '',
    appendChild: (_child) => {},
    setAttribute: (_attr, _val) => {},
    style: {},
    classList: { add: () => {}, remove: () => {} }
};

globalThis.document = {
    createElementNS: (_ns, _tag) => ({ ...mockElement }),
    getElementById: (_id) => ({ ...mockElement }),
    body: { ...mockElement },
    querySelector: () => ({ ...mockElement })
};

globalThis.window = globalThis;

// We need to delay import until after globals are set
async function run() {
    console.log("Starting Benchmark...");

    // Import the system under test
    // We assume this runs from the dist folder where both files are present
    const { ParticleSystem } = await import('./engine/ParticleSystem.js');

    const particles = new ParticleSystem();

    // Setup: Emit a lot of particles
    // emit(x, y, color, count)
    // We want a substantial load.
    const BATCHES = 1000;
    const PARTICLES_PER_BATCH = 5; // default is 5
    // Total 5000 particles

    for (let i = 0; i < BATCHES; i++) {
        particles.emit(400, 300, i % 2 === 0 ? '#ff0000' : '#0000ff', PARTICLES_PER_BATCH);
    }

    console.log(`Simulating ${particles.particles.length} particles...`);

    // Warmup
    for (let i = 0; i < 10; i++) {
        particles.update(0.016);
    }

    // Measure
    const ITERATIONS = 100;
    const start = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
        particles.update(0.016);
        // Reset life to keep them alive for the benchmark if needed
        for (const p of particles.particles) {
            p.life = 1.0;
        }
    }

    const end = performance.now();
    const duration = end - start;
    const avg = duration / ITERATIONS;

    console.log(`Total Time: ${duration.toFixed(2)}ms`);
    console.log(`Average Frame: ${avg.toFixed(4)}ms`);
}

run().catch(console.error);
