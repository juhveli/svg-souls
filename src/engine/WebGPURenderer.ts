import { vertexShaderWGSL, fragmentShaderGBufferWGSL, fragmentShaderLightingWGSL, fragmentShaderPostProcessWGSL, vertexShaderFullscreenWGSL } from '../shaders/shaders';

interface ChunkData {
    buffer: GPUBuffer;
    capacity: number; // in instances
    instanceCount: number;
    cpuData: Float32Array;
}

export class WebGPURenderer {
    canvas: HTMLCanvasElement;
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    // Pipelines
    gBufferPipeline!: GPURenderPipeline;
    lightingPipeline!: GPURenderPipeline;

    // Buffers
    uniformBuffer!: GPUBuffer;
    // instanceBuffer removed in Phase 4
    lightingUniformBuffer!: GPUBuffer;

    // Textures (G-Buffer)
    albedoTexture!: GPUTexture;
    normalTexture!: GPUTexture;
    depthTexture!: GPUTexture;
    lightingTexture!: GPUTexture; // Output of Lighting Pass (Low Res)

    // Pipelines
    postProcessPipeline!: GPURenderPipeline;

    // Bind Groups
    gBufferBindGroup!: GPUBindGroup;
    lightingBindGroup!: GPUBindGroup;
    postProcessBindGroup!: GPUBindGroup;

    // Samplers
    nearestSampler!: GPUSampler;

    // Constants
    RETRO_SCALE = 4.0;
    MAX_INSTANCES = 1000; // Legacy constant, kept just in case
    // 9 floats * 4 bytes = 36 bytes.
    INSTANCE_SIZE = 9 * 4;

    // Chunking System
    private chunks: Map<string, ChunkData> = new Map();
    private readonly CHUNK_SIZE = 512;
    private readonly INITIAL_CHUNK_CAPACITY = 64;

    // CPU-side Buffers (Optimization: Reuse to avoid GC)
    // instanceData removed in Phase 4
    private uniformDataA!: Float32Array;
    private uniformDataB!: Float32Array;
    private lightingData!: Float32Array;

    private static instance: WebGPURenderer;

    constructor() {
        this.canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;
        if (!this.canvas) {
            // It might not exist yet if called too early, but usually init calls it.
        }

        // Initialize CPU-side buffers
        // this.instanceData removed
        this.uniformDataA = new Float32Array(4); // Screen(2) + Camera(2)
        this.uniformDataB = new Float32Array(1); // Time(1)
        this.lightingData = new Float32Array(16); // Lighting Block
    }

    static getInstance(): WebGPURenderer {
        if (!WebGPURenderer.instance) {
            WebGPURenderer.instance = new WebGPURenderer();
        }
        return WebGPURenderer.instance;
    }

    async init(): Promise<void> {
        this.canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;

        if (!navigator.gpu) {
            console.error("WebGPU not supported.");
            return;
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            console.error("No WebGPU adapter found.");
            return;
        }
        this.adapter = adapter;

        this.device = await adapter.requestDevice();

        this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        this.format = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });

        await this.createResources();
        this.createPipelines();

        console.log("WebGPU Renderer Initialized.");
    }

    async createResources() {
        const width = Math.max(1, this.canvas.width);
        const height = Math.max(1, this.canvas.height);

        // Retro Crunch: Low Resolution Dimensions
        const lowResWidth = Math.max(1, Math.ceil(width / this.RETRO_SCALE));
        const lowResHeight = Math.max(1, Math.ceil(height / this.RETRO_SCALE));

        // 1. G-Buffer Textures (Low Res)
        this.albedoTexture = this.device.createTexture({
            size: [lowResWidth, lowResHeight],
            format: 'bgra8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.normalTexture = this.device.createTexture({
            size: [lowResWidth, lowResHeight],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.depthTexture = this.device.createTexture({
            size: [lowResWidth, lowResHeight],
            format: 'r32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        // Lighting Result Texture (Low Res)
        this.lightingTexture = this.device.createTexture({
            size: [lowResWidth, lowResHeight],
            format: 'bgra8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        // Sampler
        this.nearestSampler = this.device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
        });

        // 2. Uniform Buffer
        // We need 2 blocks:
        // Block A (Vertex): Screen(2) + Camera(2) = 4 floats (16 bytes).
        // Block B (Frag): Time(1) = 1 float (4 bytes).
        // Minimal alignment for uniform buffer offset is usually 256 bytes!
        // So we must offset binding 1 by 256 bytes.

        this.uniformBuffer = this.device.createBuffer({
            size: 512, // Enough for 2 blocks aligned at 256
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 3. Lighting Uniform Buffer
        this.lightingUniformBuffer = this.device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 4. Instance Buffer removed (Chunking System uses per-chunk buffers)
    }

    createPipelines() {
        // --- G-BUFFER PIPELINE ---
        const gBufferModule = this.device.createShaderModule({
            code: vertexShaderWGSL + "\n" + fragmentShaderGBufferWGSL
        });

        this.gBufferPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: gBufferModule,
                entryPoint: 'main',
                buffers: [{
                    arrayStride: this.INSTANCE_SIZE,
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x2' }, // center
                        { shaderLocation: 1, offset: 8, format: 'float32x2' }, // size
                        { shaderLocation: 2, offset: 16, format: 'float32' },  // typeID
                        { shaderLocation: 3, offset: 20, format: 'float32x4' } // params
                    ]
                }]
            },
            fragment: {
                module: gBufferModule,
                entryPoint: 'main',
                targets: [
                    { format: 'bgra8unorm' }, // Albedo
                    { format: 'rgba8unorm' }, // Normal
                    { format: 'r32float' }    // Depth
                ]
            },
            primitive: { topology: 'triangle-list' }
        });

        this.gBufferBindGroup = this.device.createBindGroup({
            layout: this.gBufferPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer, offset: 0, size: 16 } },
                { binding: 1, resource: { buffer: this.uniformBuffer, offset: 256, size: 16 } } // Time
            ]
        });

        // --- LIGHTING PIPELINE ---
        const lightingModule = this.device.createShaderModule({ code: fragmentShaderLightingWGSL });

        this.lightingPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.device.createShaderModule({
                    code: `
                    @vertex fn main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
                        var pos = array<vec2<f32>, 6>(
                            vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),
                            vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)
                        );
                        return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
                    }`
                }),
                entryPoint: 'main',
            },
            fragment: {
                module: lightingModule,
                entryPoint: 'main',
                targets: [{ format: this.format }]
            }
        });

        this.lightingBindGroup = this.device.createBindGroup({
            layout: this.lightingPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.lightingUniformBuffer } },
                { binding: 1, resource: this.albedoTexture.createView() },
                { binding: 2, resource: this.normalTexture.createView() },
                { binding: 3, resource: this.depthTexture.createView() },
                { binding: 4, resource: this.nearestSampler }
            ]
        });

        // --- POST PROCESS PIPELINE ---
        const postProcessModule = this.device.createShaderModule({ code: fragmentShaderPostProcessWGSL });
        const fsVertexModule = this.device.createShaderModule({ code: vertexShaderFullscreenWGSL });

        this.postProcessPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: fsVertexModule,
                entryPoint: 'main'
            },
            fragment: {
                module: postProcessModule,
                entryPoint: 'main',
                targets: [{ format: this.format }] // Output to Screen
            },
            primitive: { topology: 'triangle-list' }
        });

        this.postProcessBindGroup = this.device.createBindGroup({
            layout: this.postProcessPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.lightingTexture.createView() },
                { binding: 1, resource: this.nearestSampler }
            ]
        });
    }

    render(entities: any[], camera: any, playerRef?: any) {
        // TODO: Phase 4 - Chunking System
        // Instead of a single instanceBuffer for all entities, use per-chunk buffers.
        // Culling: Only upload/render chunks visible to camera.

        // TODO: Phase 5 - Retro Crunch
        // Render to a low-res texture (e.g. 320x180) instead of screen.
        // Add a Post-Process pass to upscale with "Nearest Neighbor" and apply Dithering.

        if (!this.device || !this.context) return;

        const time = performance.now() / 1000;

        // 1. Update Global Uniforms
        // Block A: Screen(2), Camera(2)
        this.uniformDataA[0] = this.canvas.width;
        this.uniformDataA[1] = this.canvas.height;
        this.uniformDataA[2] = camera.x;
        this.uniformDataA[3] = camera.y;
        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformDataA);

        // Block B: Time(1) at offset 256
        this.uniformDataB[0] = time;
        this.device.queue.writeBuffer(this.uniformBuffer, 256, this.uniformDataB);

        // 2. Update Lighting Uniforms
        // Layout: Screen(2), Camera(2), LightPos(2), Padding(2), LightColor(3+1), Ambient(3+1)

        let playerX = 0, playerY = 0;
        const player = playerRef || entities.find(e => e.constructor.name === 'Player');
        if (player) {
            playerX = player.x;
            playerY = player.y;
        }

        this.lightingData[0] = this.canvas.width;
        this.lightingData[1] = this.canvas.height;
        this.lightingData[2] = camera.x;
        this.lightingData[3] = camera.y;
        this.lightingData[4] = playerX;
        this.lightingData[5] = playerY;
        this.lightingData[6] = 0;
        this.lightingData[7] = 0;
        this.lightingData[8] = 1.0;
        this.lightingData[9] = 0.7;
        this.lightingData[10] = 0.4;
        this.lightingData[11] = 0.0;
        this.lightingData[12] = 0.1;
        this.lightingData[13] = 0.15;
        this.lightingData[14] = 0.25;
        this.lightingData[15] = 0.0;
        this.device.queue.writeBuffer(this.lightingUniformBuffer, 0, this.lightingData);

        // 3. Chunking & Culling
        const visibleChunks = new Set<ChunkData>();

        // Culling Bounds (Camera + Padding)
        const pad = 100;
        const camLeft = camera.x - pad;
        const camTop = camera.y - pad;
        const camRight = camera.x + camera.width + pad;
        const camBottom = camera.y + camera.height + pad;

        for (const e of entities) {
            const x = e.x || 0;
            const y = e.y || 0;
            const w = e.width || 64;
            const h = e.height || 64;

            // Check if entity is within camera bounds + padding
            // We use chunk-based culling, but first let's bucket.

            const chunkID = this.getChunkID(x, y);
            const cx = Math.floor(x / this.CHUNK_SIZE);
            const cy = Math.floor(y / this.CHUNK_SIZE);

            const chunkLeft = cx * this.CHUNK_SIZE;
            const chunkTop = cy * this.CHUNK_SIZE;
            const chunkRight = chunkLeft + this.CHUNK_SIZE;
            const chunkBottom = chunkTop + this.CHUNK_SIZE;

            // AABB Test for Chunk
            if (chunkRight < camLeft || chunkLeft > camRight || chunkBottom < camTop || chunkTop > camBottom) {
                 continue; // Chunk not visible
            }

            const chunk = this.getOrCreateChunk(chunkID);

            if (!visibleChunks.has(chunk)) {
                chunk.instanceCount = 0;
                visibleChunks.add(chunk);
            }

            // Resize if needed
            if (chunk.instanceCount >= chunk.capacity) {
                const newCapacity = chunk.capacity * 2;
                const newCpuData = new Float32Array(newCapacity * 9);
                newCpuData.set(chunk.cpuData);
                chunk.cpuData = newCpuData;
                chunk.capacity = newCapacity;

                // Recreate GPU buffer
                chunk.buffer.destroy();
                chunk.buffer = this.device.createBuffer({
                    size: newCapacity * this.INSTANCE_SIZE,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
                });
            }

            // Type Mapping
            let typeID = (e as any).typeID || 0; // Use entity ID if set
            const name = e.constructor.name;

            if (typeID === 0) {
                if (name === 'Player') typeID = 1;
                else if (name === 'SerumBot') typeID = 2;
                else if (name === 'ScavengerCrab') typeID = 3;
                else if (name === 'Golgotha') typeID = 4;
                else if (name === 'PorcelainDancer') typeID = 5;
                else if (name === 'RustMite') typeID = 6;
                else if (name === 'RustDragon') typeID = 7;
                else if (name === 'VanityWraith') typeID = 8;
                else if (name === 'RazorVine') typeID = 9;
                else if (name === 'Vitria') typeID = 10;
                else if (name === 'Narcissus') typeID = 11;
                else if (name === 'GearKeeper') typeID = 12;
                else if (name === 'MetronomeGeneral') typeID = 13;
                else if (name === 'ChronoWraith') typeID = 14;
                else if (name === 'SilenceGuard') typeID = 15;
                else if (name === 'Cantor') typeID = 16;
                else if (name === 'Banshee') typeID = 17;
                else if (name === 'PrimeConductor') typeID = 18;
                else if (name === 'Paradox') typeID = 19;
                else if (name === 'WorldItem') {
                    const item = e as any;
                    if (item.itemId === 'vial_liquid_seconds') typeID = 20;
                }
            }

            // Params
            let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
            if (typeID === 5) {
                p1 = (e as any).isVisible ? 1.0 : 0.0;
            }
            if (typeID === 1) {
                // p1 can be used for tentacle phase offset or direction
            }
            if (typeID === 21) {
                p1 = (e as any).isActive ? 1.0 : 0.0;
            }
            if (typeID === 22) {
                p1 = (e as any).blastParam || 0;
                p2 = (e as any).chargeParam || 0;
            }
            if (typeID === 23) {
                p1 = (e as any).hoverParam || 0;
                p2 = (e as any).attackParam || 0;
            }

            const offset = chunk.instanceCount * 9;
            chunk.cpuData[offset + 0] = x;
            chunk.cpuData[offset + 1] = y;
            chunk.cpuData[offset + 2] = w;
            chunk.cpuData[offset + 3] = h;
            chunk.cpuData[offset + 4] = typeID;
            chunk.cpuData[offset + 5] = p1;
            chunk.cpuData[offset + 6] = p2;
            chunk.cpuData[offset + 7] = p3;
            chunk.cpuData[offset + 8] = p4;

            chunk.instanceCount++;
        }

        // 4. Render Passes
        const commandEncoder = this.device.createCommandEncoder();

        // Pass 1: G-Buffer
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.albedoTexture.createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: 'clear',
                    storeOp: 'store'
                },
                {
                    view: this.normalTexture.createView(),
                    clearValue: { r: 0.5, g: 0.5, b: 1.0, a: 1.0 }, // Flat normal Z+
                    loadOp: 'clear',
                    storeOp: 'store'
                },
                {
                    view: this.depthTexture.createView(),
                    clearValue: { r: 0.0, g: 0, b: 0, a: 1.0 }, // Depth init
                    loadOp: 'clear',
                    storeOp: 'store'
                }
            ]
        });

        passEncoder.setPipeline(this.gBufferPipeline);
        passEncoder.setBindGroup(0, this.gBufferBindGroup);

        for (const chunk of visibleChunks) {
            if (chunk.instanceCount > 0) {
                 // Write Buffer
                 this.device.queue.writeBuffer(chunk.buffer, 0, chunk.cpuData, 0, chunk.instanceCount * 9);

                 // Draw
                 passEncoder.setVertexBuffer(0, chunk.buffer);
                 passEncoder.draw(6, chunk.instanceCount, 0, 0);
            }
        }

        passEncoder.end();

        // Pass 2: Lighting
        const lightingPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.lightingTexture.createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        lightingPass.setPipeline(this.lightingPipeline);
        lightingPass.setBindGroup(0, this.lightingBindGroup);
        lightingPass.draw(6, 1, 0, 0); // Fullscreen
        lightingPass.end();

        // Pass 3: Post-Process (Upscale + Retro Crunch)
        const postProcessPass = commandEncoder.beginRenderPass({
             colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        postProcessPass.setPipeline(this.postProcessPipeline);
        postProcessPass.setBindGroup(0, this.postProcessBindGroup);
        postProcessPass.draw(6, 1, 0, 0);
        postProcessPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }

    private getChunkID(x: number, y: number): string {
        const cx = Math.floor(x / this.CHUNK_SIZE);
        const cy = Math.floor(y / this.CHUNK_SIZE);
        return `${cx},${cy}`;
    }

    private getOrCreateChunk(id: string): ChunkData {
        if (!this.chunks.has(id)) {
            const buffer = this.device.createBuffer({
                size: this.INITIAL_CHUNK_CAPACITY * this.INSTANCE_SIZE,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            });
            this.chunks.set(id, {
                buffer,
                capacity: this.INITIAL_CHUNK_CAPACITY,
                instanceCount: 0,
                cpuData: new Float32Array(this.INITIAL_CHUNK_CAPACITY * 9)
            });
        }
        return this.chunks.get(id)!;
    }
}
