
// Mock WebGPU and DOM Environment
class MockGPUBuffer {
    size: number;
    usage: number;
    data: Float32Array;

    constructor(descriptor: any) {
        this.size = descriptor.size;
        this.usage = descriptor.usage;
        this.data = new Float32Array(this.size / 4);
    }
    destroy() {}
}

const mockDevice = {
    createTexture: () => ({ createView: () => ({}) }),
    createSampler: () => ({}),
    createBuffer: (desc: any) => new MockGPUBuffer(desc),
    createShaderModule: () => ({}),
    createRenderPipeline: (desc: any) => ({
        getBindGroupLayout: () => ({})
    }),
    createBindGroup: () => ({}),
    createCommandEncoder: () => {
        const encoder = {
            beginRenderPass: (desc: any) => {
                return {
                    setPipeline: () => {},
                    setBindGroup: () => {},
                    setVertexBuffer: () => {},
                    draw: (vertexCount: number, instanceCount: number) => {
                         if (instanceCount > 0) {
                             (global as any).drawCalls.push(instanceCount);
                         }
                    },
                    end: () => {}
                };
            },
            finish: () => ({})
        };
        return encoder;
    },
    queue: {
        writeBuffer: (buffer: any, bufferOffset: number, data: Float32Array) => {
             // We can track writes if needed, but we mainly care about chunks being created/populated
        },
        submit: () => {}
    }
};

const mockContext = {
    configure: () => {},
    getCurrentTexture: () => ({ createView: () => ({}) })
};

// Mock Globals
(global as any).document = {
    getElementById: (id: string) => {
        if (id === 'webgpu-canvas') {
            return {
                getContext: () => mockContext,
                width: 800,
                height: 600
            };
        }
        return null;
    }
};

const mockNavigator = {
    gpu: {
        requestAdapter: async () => ({
            requestDevice: async () => mockDevice
        }),
        getPreferredCanvasFormat: () => 'bgra8unorm'
    }
};

if (typeof navigator === 'undefined') {
    (global as any).navigator = mockNavigator;
} else {
    // If it exists but is read-only, we might have issues.
    // Try to overwrite using defineProperty if assignment failed (though the error suggests it's a getter-only property on globalThis)
    try {
         Object.defineProperty(global, 'navigator', {
             value: mockNavigator,
             writable: true
         });
    } catch (e) {
        console.warn("Could not mock navigator directly, trying to rely on Renderer checking for it.");
    }
}

(global as any).GPUBufferUsage = {
    UNIFORM: 1,
    COPY_DST: 2,
    VERTEX: 4,
    RENDER_ATTACHMENT: 8,
    TEXTURE_BINDING: 16
};

(global as any).GPUTextureUsage = {
    RENDER_ATTACHMENT: 1,
    TEXTURE_BINDING: 2
};

(global as any).performance = {
    now: () => Date.now()
};

(global as any).drawCalls = [];

// Import Renderer
import { WebGPURenderer } from '../src/engine/WebGPURenderer';

async function runTest() {
    console.log("Starting Chunking Verification...");

    const renderer = new WebGPURenderer();
    await renderer.init();

    // Setup Entities
    // CHUNK_SIZE = 512
    // Camera: x=0, y=0, w=800, h=600
    // Camera View: 0,0 to 800,600
    // Padded View (pad=100): -100,-100 to 900,700

    const entities = [
        // Chunk 0,0 (0-512, 0-512) - Visible
        { x: 100, y: 100, constructor: { name: 'Player' } },

        // Chunk 1,0 (512-1024, 0-512) - Visible (intersect: 512-900)
        { x: 600, y: 100, constructor: { name: 'SerumBot' } },

        // Chunk 0,1 (0-512, 512-1024) - Visible (intersect: 512-700)
        { x: 100, y: 600, constructor: { name: 'RustMite' } },

        // Chunk 2,2 (1024-1536, 1024-1536) - Not Visible (starts at 1024, cam max 900)
        { x: 1200, y: 1200, constructor: { name: 'Golgotha' } },

        // Chunk -1,-1 (-512-0, -512-0) - Not Visible (ends at 0, cam min -100)
        // Wait, chunk -1 covers -512 to 0. Cam min is -100. Overlap is -100 to 0.
        // So Chunk -1,-1 IS Visible.
        { x: -50, y: -50, constructor: { name: 'PorcelainDancer' } },

        // Chunk -2,-2 (-1024 to -512) - Not Visible
        { x: -600, y: -600, constructor: { name: 'Vitria' } }
    ];

    const camera = { x: 0, y: 0, width: 800, height: 600 };

    console.log("Rendering...");
    renderer.render(entities, camera);

    // Verify
    const r = renderer as any;
    const chunks = r.chunks;
    console.log("Active Chunks:", Array.from(chunks.keys()));

    // Expected Visible Chunks:
    // "0,0" (Player)
    // "1,0" (SerumBot)
    // "0,1" (RustMite)
    // "-1,-1" (PorcelainDancer)

    // Expected Hidden Chunks:
    // "2,2" (Golgotha)
    // "-2,-2" (Vitria)

    const expectedVisible = ["0,0", "1,0", "0,1", "-1,-1"];
    const expectedHidden = ["2,2", "-2,-2"];

    let pass = true;

    for (const id of expectedVisible) {
        if (!chunks.has(id) || chunks.get(id).instanceCount === 0) {
            console.error(`FAIL: Chunk ${id} should be visible and populated.`);
            pass = false;
        } else {
            console.log(`PASS: Chunk ${id} is visible.`);
        }
    }

    for (const id of expectedHidden) {
        if (chunks.has(id) && chunks.get(id).instanceCount > 0) {
            console.error(`FAIL: Chunk ${id} should be hidden but was populated.`);
            pass = false;
        } else {
             console.log(`PASS: Chunk ${id} is hidden (or empty).`);
        }
    }

    if ((global as any).drawCalls.length === 0) {
        console.error("FAIL: No draw calls recorded.");
        pass = false;
    } else {
        console.log(`PASS: ${(global as any).drawCalls.length} chunks drawn.`);
    }

    if (pass) {
        console.log("ALL TESTS PASSED.");
        process.exit(0);
    } else {
        console.error("TESTS FAILED.");
        process.exit(1);
    }
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
