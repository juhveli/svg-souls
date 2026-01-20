
const ITERATIONS = 100000;
const MAX_INSTANCES = 1000;
const INSTANCE_floats = MAX_INSTANCES * 9;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

// --- BASELINE ---
const startBaseline = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    // Mimic the allocations in render()
    const instanceData = new Float32Array(INSTANCE_floats);
    const uniformDataA = new Float32Array(4);
    const uniformDataB = new Float32Array(1);
    const lightingData = new Float32Array(16);

    // Mimic some writes to prevent total optimization by V8 (though unlikely for allocation)
    instanceData[0] = Math.random();
    uniformDataA[0] = Math.random();
}
const endBaseline = performance.now();
const durationBaseline = endBaseline - startBaseline;
console.log(`Baseline (Allocation per frame): ${durationBaseline.toFixed(2)} ms`);


// --- OPTIMIZED ---
const startOptimized = performance.now();
// Pre-allocate
const instanceData = new Float32Array(INSTANCE_floats);
const uniformDataA = new Float32Array(4);
const uniformDataB = new Float32Array(1);
const lightingData = new Float32Array(16);

for (let i = 0; i < ITERATIONS; i++) {
    // Mimic writes
    instanceData[0] = Math.random();
    uniformDataA[0] = Math.random();
}
const endOptimized = performance.now();
const durationOptimized = endOptimized - startOptimized;
console.log(`Optimized (Reuse buffer): ${durationOptimized.toFixed(2)} ms`);

// --- RESULT ---
const improvement = durationBaseline / durationOptimized;
console.log(`Speedup factor: ${improvement.toFixed(2)}x`);
console.log(`Time saved per 100k frames: ${(durationBaseline - durationOptimized).toFixed(2)} ms`);
