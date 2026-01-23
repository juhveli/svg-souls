
// Mock WebGPU and DOM Environment for Retro Crunch Verification

class MockGPUBuffer {
    size: number;
    usage: number;
    data: Float32Array;

    constructor(descriptor: any) {
        this.size = descriptor.size;
        this.usage = descriptor.usage;
        this.data = new Float32Array(this.size / 4);
    }
    destroy() {
        (global as any).destroyedBuffers++;
    }
}

class MockGPUTexture {
    label: string;
    constructor(descriptor: any) {
        this.label = "tex";
    }
    createView() { return {}; }
    destroy() {
        (global as any).destroyedTextures++;
    }
}

const mockDevice = {
    createTexture: (desc: any) => {
        (global as any).createdTextures++;
        return new MockGPUTexture(desc);
    },
    createSampler: () => ({}),
    createBuffer: (desc: any) => new MockGPUBuffer(desc),
    createShaderModule: () => ({}),
    createRenderPipeline: (desc: any) => ({
        getBindGroupLayout: () => ({})
    }),
    createBindGroup: () => {
        (global as any).createdBindGroups++;
        return {};
    },
    createCommandEncoder: () => {
        return {
            beginRenderPass: () => ({
                setPipeline: () => {},
                setBindGroup: () => {},
                setVertexBuffer: () => {},
                draw: () => {},
                end: () => {}
            }),
            finish: () => ({})
        };
    },
    queue: {
        writeBuffer: () => {},
        submit: () => {}
    }
};

const mockContext = {
    configure: () => {
        (global as any).configuredContexts++;
    },
    getCurrentTexture: () => ({ createView: () => ({}) })
};

// Mock Globals
(global as any).document = {
    getElementById: (id: string) => {
        if (id === 'webgpu-canvas') {
            return (global as any).mockCanvas;
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
     // Force override
    try {
        Object.defineProperty(global, 'navigator', {
            value: mockNavigator,
            writable: true,
            configurable: true
        });
    } catch(e) {
        console.warn("Failed to redefine navigator", e);
        // Fallback: try to add gpu to existing navigator
        (navigator as any).gpu = mockNavigator.gpu;
    }
}

(global as any).GPUBufferUsage = { UNIFORM: 1, COPY_DST: 2, VERTEX: 4, RENDER_ATTACHMENT: 8, TEXTURE_BINDING: 16 };
(global as any).GPUTextureUsage = { RENDER_ATTACHMENT: 1, TEXTURE_BINDING: 2 };
(global as any).performance = { now: () => Date.now() };

// Initialize Counters
(global as any).createdTextures = 0;
(global as any).destroyedTextures = 0;
(global as any).destroyedBuffers = 0;
(global as any).createdBindGroups = 0;
(global as any).configuredContexts = 0;

// Setup Mock Canvas
(global as any).mockCanvas = {
    getContext: () => mockContext,
    width: 800,
    height: 600,
    clientWidth: 800,
    clientHeight: 600
};

// Import Renderer
import { WebGPURenderer } from '../src/engine/WebGPURenderer';

async function runTest() {
    console.log("Starting Retro Crunch Resize Verification...");

    const renderer = new WebGPURenderer();
    await renderer.init();

    // Initial State Check
    // createResources makes 4 textures (albedo, normal, depth, lighting)
    // createBindGroups makes 3 bind groups
    console.log(`Initial Textures Created: ${(global as any).createdTextures}`); // Should be 4
    console.log(`Initial BindGroups Created: ${(global as any).createdBindGroups}`); // Should be 3

    if ((global as any).createdTextures !== 4) throw new Error("Expected 4 initial textures");

    // Render Frame 1 (No Resize)
    console.log("Rendering Frame 1...");
    renderer.render([], { x: 0, y: 0, width: 800, height: 600 });

    // Check usage
    if ((global as any).createdTextures !== 4) throw new Error("Texture count changed unexpectedly");

    // Resize Canvas
    console.log("Resizing Canvas to 1024x768...");
    (global as any).mockCanvas.width = 1024;
    (global as any).mockCanvas.height = 768;

    // Render Frame 2 (Should trigger resize)
    console.log("Rendering Frame 2...");
    renderer.render([], { x: 0, y: 0, width: 800, height: 600 });

    // Verify Resize Logic
    // Should destroy 4 textures + 2 buffers
    // Should create 4 new textures
    // Should create 3 new bind groups

    console.log(`Total Textures Created: ${(global as any).createdTextures}`); // Should be 4 + 4 = 8
    console.log(`Total Destroyed Textures: ${(global as any).destroyedTextures}`); // Should be 4
    console.log(`Total BindGroups Created: ${(global as any).createdBindGroups}`); // Should be 3 + 3 = 6
    console.log(`Context Configured: ${(global as any).configuredContexts}`); // Should be 1 (init) + 1 (resize) = 2

    if ((global as any).createdTextures !== 8) throw new Error(`Expected 8 total textures, got ${(global as any).createdTextures}`);
    if ((global as any).destroyedTextures !== 4) throw new Error(`Expected 4 destroyed textures, got ${(global as any).destroyedTextures}`);
    if ((global as any).createdBindGroups !== 6) throw new Error(`Expected 6 total bind groups, got ${(global as any).createdBindGroups}`);

    // Verify renderer internal state
    const r = renderer as any;
    if (r.currentWidth !== 1024 || r.currentHeight !== 768) {
        throw new Error(`Renderer size mismatch: ${r.currentWidth}x${r.currentHeight}`);
    }

    console.log("ALL VERIFICATION TESTS PASSED.");
}

runTest().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
